import os, re, shutil, threading, time
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

BASE = {"quiet": True, "no_warnings": True, "noplaylist": True, "socket_timeout": 15, "retries": 2}

def extract_info(url: str) -> dict:
    with YoutubeDL({**BASE, "skip_download": True}) as y:
        return y.extract_info(url, download=False)

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
        return HTTPException(502, "Nền tảng đang chặn máy chủ này (yêu cầu xác minh không phải robot). Hãy chạy backend trên mạng nhà hoặc VPS khác.")
    if "private" in m:
        return HTTPException(422, "Video ở chế độ riêng tư, không thể tải.")
    if "unavailable" in m or "removed" in m or "not available" in m:
        return HTTPException(422, "Video không còn khả dụng hoặc bị giới hạn ở khu vực của máy chủ.")
    return HTTPException(422, "Không lấy được video. Hãy kiểm tra liên kết hoặc thử lại sau.")

class InfoReq(BaseModel):
    url: str
    platform: Literal["youtube", "tiktok"]

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
        raise vi_error(e)
    return build_info(data)

@app.get("/api/download", dependencies=[Depends(rate_limit)])
def download(url: str, kind: Literal["video", "audio"], id: str, bg: BackgroundTasks):
    try:
        url = validate_url(platform_of(url), url)
    except UnsafeUrl:
        raise HTTPException(400, "Liên kết không hợp lệ hoặc không thuộc nền tảng được hỗ trợ.")
    if kind == "video":
        if not re.fullmatch(r"\d{3,4}", id):
            raise HTTPException(400, "Chất lượng video không hợp lệ.")
        opts = {"format": f"bv*[height<={id}]+ba/b[height<={id}]", "merge_output_format": "mp4", "format_sort": ["res", "vcodec:h264", "acodec:aac"]}
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
