import os, re, shutil, tempfile, threading, time
from collections import defaultdict, deque
from typing import Literal

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from . import config
from . import images
from .formats import AUDIO_IDS, build_info
from .security import UnsafeUrl, platform_of, validate_url

os.makedirs(config.TMP_DIR, exist_ok=True)
app = FastAPI(title="I LOVE DOWNLOAD API", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=config.ALLOWED_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type"], allow_private_network=True)  # lets a public page (GitHub Pages) call this local backend

_hits: dict[str, deque] = defaultdict(deque)
_slots = threading.BoundedSemaphore(config.MAX_CONCURRENT_DOWNLOADS)

def rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "?"
    if config.TRUST_PROXY and request.headers.get("x-forwarded-for"):
        ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    now, q = time.time(), _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= config.RATE_LIMIT_PER_MIN:
        raise HTTPException(429, "Bạn thao tác quá nhanh. Hãy đợi một phút rồi thử lại.")
    q.append(now)

def _sweeper() -> None:
    while True:
        for d in os.listdir(config.TMP_DIR):
            p = os.path.join(config.TMP_DIR, d)
            if time.time() - os.path.getmtime(p) > config.TMP_TTL_SECONDS:
                shutil.rmtree(p, ignore_errors=True)
        time.sleep(300)
threading.Thread(target=_sweeper, daemon=True).start()

BASE = {"quiet": True, "no_warnings": True, "noplaylist": True, "socket_timeout": 15, "retries": 2, "playlist_items": "1"}

def extract_info(url: str) -> dict:
    with YoutubeDL({**BASE, "skip_download": True}) as y:
        info = y.extract_info(url, download=False)
    if info and info.get("_type") == "playlist":  # e.g. multi-media Instagram/Facebook posts: use the first item
        entries = [e for e in info.get("entries") or [] if e]
        if not entries:
            raise DownloadError("Unsupported URL")
        info = entries[0]
    return info

def run_download(url: str, opts: dict, job_dir: str) -> tuple[str, str]:
    def too_long(info, *, incomplete=False):
        if (info.get("duration") or 0) > config.MAX_DURATION_SECONDS:
            return "too long"
    o = {**BASE, **opts, "outtmpl": os.path.join(job_dir, "%(id)s.%(ext)s"), "max_filesize": config.MAX_FILESIZE, "match_filter": too_long}
    with YoutubeDL(o) as y:
        info = y.extract_info(url, download=True)
    files = [f for f in os.listdir(job_dir) if not f.endswith((".part", ".ytdl"))]
    if not files:
        raise HTTPException(413, "Video quá dài hoặc quá nặng so với giới hạn của máy chủ.")
    path = max((os.path.join(job_dir, f) for f in files), key=os.path.getsize)
    return path, (info or {}).get("title") or "download"

def vi_error(e: Exception) -> HTTPException:
    m = str(e).lower()
    if "sign in to confirm" in m or "not a bot" in m:
        return HTTPException(502, "Nền tảng đang chặn máy chủ miễn phí này (yêu cầu xác minh không phải robot). Các nền tảng khác vẫn dùng được. Với YouTube, hãy chạy bản trên máy bạn (start.bat) hoặc thử lại sau.")
    if "login" in m or "log in" in m or "cookies" in m or "rate-limit" in m:
        return HTTPException(422, "Nội dung này cần đăng nhập hoặc không công khai nên không tải được. Chỉ hỗ trợ nội dung công khai.")
    if "private" in m:
        return HTTPException(422, "Video ở chế độ riêng tư, không thể tải.")
    if "unavailable" in m or "removed" in m or "not available" in m:
        return HTTPException(422, "Video không còn khả dụng hoặc bị giới hạn ở khu vực của máy chủ.")
    return HTTPException(422, "Không lấy được video. Hãy kiểm tra liên kết hoặc thử lại sau.")

def image_error(ie: "images.ImageError", original: Exception) -> HTTPException:
    if ie.kind == "timeout":
        return HTTPException(504, "Hết thời gian chờ khi tìm ảnh. Hãy thử lại.")
    if ie.kind == "login":
        return HTTPException(422, "Nội dung này cần đăng nhập hoặc không công khai nên không tải được. Chỉ hỗ trợ nội dung công khai.")
    return vi_error(original)

MAX_IMAGES = 30
TOKEN = re.compile(r"[0-9a-f]{16}")

def collect_images(url: str) -> dict:
    token = os.urandom(8).hex()
    job = os.path.join(config.TMP_DIR, "img-" + token)
    os.makedirs(job)
    try:
        images.fetch(url, job, config.MAX_FILESIZE // 1048576, MAX_IMAGES)
    except Exception:
        shutil.rmtree(job, ignore_errors=True)
        raise
    names = images.list_files(job)
    return {"imageToken": token, "images": [{"id": str(i), "label": f"Ảnh {i}", "ext": n.rsplit(".", 1)[-1].lower(), "thumb": f"/api/img/{token}/{i}"} for i, n in enumerate(names, 1)]}

def serve_images(token: str, sel: str | None, bg: BackgroundTasks):
    if not TOKEN.fullmatch(token):
        raise HTTPException(400, "Phiên xem ảnh không hợp lệ.")
    job = os.path.join(config.TMP_DIR, "img-" + token)
    if not os.path.isdir(job):
        raise HTTPException(410, "Phiên xem ảnh đã hết hạn. Hãy bấm lấy thông tin lại.")
    names = images.list_files(job)
    if sel is None:
        idx = list(range(1, len(names) + 1))
    else:
        if not re.fullmatch(r"\d{1,3}(,\d{1,3})*", sel):
            raise HTTPException(400, "Lựa chọn ảnh không hợp lệ.")
        idx = sorted({int(x) for x in sel.split(",") if 1 <= int(x) <= len(names)})
    if not idx:
        raise HTTPException(400, "Bạn chưa chọn ảnh nào.")
    out_dir = tempfile.mkdtemp(dir=config.TMP_DIR)
    path, fname = images.pack(job, [names[i - 1] for i in idx], out_dir)
    if path.startswith(out_dir):
        bg.add_task(shutil.rmtree, out_dir, True)
    else:
        shutil.rmtree(out_dir, ignore_errors=True)
    return FileResponse(path, filename=fname)

@app.get("/api/img/{token}/{n}")
def thumb(token: str, n: int):
    job = os.path.join(config.TMP_DIR, "img-" + token)
    if not TOKEN.fullmatch(token) or n < 1 or not os.path.isdir(job):
        raise HTTPException(404, "Không tìm thấy ảnh.")
    names = images.list_files(job)
    if n > len(names):
        raise HTTPException(404, "Không tìm thấy ảnh.")
    return FileResponse(os.path.join(job, names[n - 1]), headers={"Cache-Control": "private, max-age=600"})

class InfoReq(BaseModel):
    url: str
    platform: Literal["youtube", "tiktok", "facebook", "instagram"]

@app.get("/healthz")
def healthz():
    return {"ok": True, "ffmpeg": shutil.which("ffmpeg") is not None}

@app.post("/api/info", dependencies=[Depends(rate_limit)])
def info(req: InfoReq):
    try:
        url = validate_url(req.platform, req.url)
    except UnsafeUrl:
        raise HTTPException(400, "Liên kết không hợp lệ hoặc không thuộc nền tảng được hỗ trợ.")
    try:
        data = extract_info(url)
    except DownloadError as e:
        blocked = "not a bot" in str(e).lower() or "sign in to confirm" in str(e).lower()
        if req.platform != "youtube" and not blocked:
            try:  # no video in this post? maybe it is a photo post
                out = build_info({"title": "Ảnh từ bài đăng"})
                out["audio"] = []
                out.update(collect_images(url))
                return out
            except images.ImageError as ie:
                raise image_error(ie, e)
        raise vi_error(e)
    out = build_info(data, config.MAX_HEIGHT)
    if req.platform != "youtube" and not out["video"]:  # e.g. photo slideshow that still has a sound track
        try:
            out.update(collect_images(url))
        except images.ImageError:
            pass
    return out

@app.get("/api/download", dependencies=[Depends(rate_limit)])
def download(url: str, kind: Literal["video", "audio", "image"], id: str, bg: BackgroundTasks, sel: str | None = None):
    try:
        url = validate_url(platform_of(url), url)
    except UnsafeUrl:
        raise HTTPException(400, "Liên kết không hợp lệ hoặc không thuộc nền tảng được hỗ trợ.")
    if kind == "image":
        return serve_images(id, sel, bg)
    if kind == "video":
        if not re.fullmatch(r"\d{3,4}|best", id):
            raise HTTPException(400, "Chất lượng video không hợp lệ.")
        if id != "best" and config.MAX_HEIGHT and int(id) > config.MAX_HEIGHT:
            raise HTTPException(400, "Chất lượng này vượt giới hạn của máy chủ.")
        cap = f"[height<={config.MAX_HEIGHT}]" if config.MAX_HEIGHT else ""
        fmt = f"bv*{cap}+ba/b{cap}" if id == "best" else f"bv*[height<={id}]+ba/b[height<={id}]"
        opts = {"format": fmt, "merge_output_format": "mp4", "format_sort": ["res", "vcodec:h264", "acodec:aac"]}
    else:
        if id not in AUDIO_IDS:
            raise HTTPException(400, "Định dạng âm thanh không hợp lệ.")
        codec, br = AUDIO_IDS[id]
        opts = {"format": "bestaudio/best", "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": codec, "preferredquality": str(br or 0)}]}
    if not shutil.which("ffmpeg"):
        raise HTTPException(503, "Máy chủ chưa cài FFmpeg.")
    if not _slots.acquire(blocking=False):
        raise HTTPException(429, "Máy chủ đang bận xử lý một tệp khác. Hãy thử lại sau ít phút.")
    job = os.path.join(config.TMP_DIR, os.urandom(8).hex())
    os.makedirs(job)
    try:
        path, title = run_download(url, opts, job)
    except DownloadError as e:
        shutil.rmtree(job, ignore_errors=True)
        raise vi_error(e)
    except Exception:
        shutil.rmtree(job, ignore_errors=True)
        raise
    finally:
        _slots.release()
    bg.add_task(shutil.rmtree, job, True)
    safe = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", title)[:80].strip() or "download"
    return FileResponse(path, filename=f"{safe}{os.path.splitext(path)[1]}")

# Serve the built frontend (dist/) from the same origin, so http://localhost:8000 works with no CORS or Node.
STATIC = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "dist"))
if os.path.isfile(os.path.join(STATIC, "index.html")):
    app.mount("/", StaticFiles(directory=STATIC, html=True), name="web")
