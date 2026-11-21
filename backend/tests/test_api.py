import os
import pytest
from fastapi.testclient import TestClient
from app import config, main
from app.security import UnsafeUrl, validate_url

c = TestClient(main.app)
FAKE = {"title": "T", "duration": 100, "formats": [
    {"vcodec": "avc1", "acodec": "none", "height": 360, "filesize": 1000},
    {"vcodec": "vp9", "acodec": "none", "height": 720, "filesize": 5000},
    {"vcodec": "none", "acodec": "opus", "abr": 130, "filesize": 400}]}

@pytest.mark.parametrize("bad", ["http://youtube.com/watch?v=1", "https://127.0.0.1/x", "https://evil.com/youtube.com",
    "https://youtube.com.evil.com/x", "file:///etc/passwd", "https://user:p@youtube.com/x", "https://youtube.com:8080/x", "https://169.254.169.254/"])
def test_rejects_bad_urls(bad):
    with pytest.raises(UnsafeUrl):
        validate_url("youtube", bad)

def test_info_real_formats_only(monkeypatch):
    monkeypatch.setattr(main, "extract_info", lambda u: FAKE)
    r = c.post("/api/info", json={"url": "https://youtu.be/abc", "platform": "youtube"})
    d = r.json()
    assert r.status_code == 200 and [v["id"] for v in d["video"]] == ["360", "720"]
    assert d["video"][1]["filesize"] == 5400 and d["video"][1]["label"] == "720p HD"
    av = {a["id"]: a["available"] for a in d["audio"]}
    assert av["mp3-128"] and av["mp3-192"] is False and av["flac"]

def test_info_rejects_wrong_platform():
    assert c.post("/api/info", json={"url": "https://youtu.be/abc", "platform": "tiktok"}).status_code == 400

def test_download_validates_ids():
    u = "https://youtu.be/abc"
    assert c.get("/api/download", params={"url": u, "kind": "video", "id": "720p;rm"}).status_code == 400
    assert c.get("/api/download", params={"url": u, "kind": "audio", "id": "mp3-999"}).status_code == 400

def test_download_serves_and_cleans(monkeypatch):
    def fake(url, opts, job):
        p = os.path.join(job, "x.mp3"); open(p, "wb").write(b"data"); return p, "Bài/hát"
    monkeypatch.setattr(main, "run_download", fake)
    monkeypatch.setattr(main.shutil, "which", lambda n: "/usr/bin/ffmpeg")
    r = c.get("/api/download", params={"url": "https://youtu.be/abc", "kind": "audio", "id": "mp3-128"})
    assert r.status_code == 200 and r.content == b"data" and "attachment" in r.headers["content-disposition"]
    assert os.listdir(config.TMP_DIR) == []

def test_rate_limit(monkeypatch):
    monkeypatch.setattr(config, "RATE_LIMIT_PER_MIN", 2); main._hits.clear()
    codes = [c.post("/api/info", json={"url": "x", "platform": "youtube"}).status_code for _ in range(3)]
    assert codes == [400, 400, 429]

def test_private_network_preflight():
    r = c.options("/api/info", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type", "Access-Control-Request-Private-Network": "true"})
    assert r.status_code == 200 and r.headers.get("access-control-allow-private-network") == "true"

@pytest.mark.parametrize("p,u", [("facebook", "https://www.facebook.com/watch?v=1"), ("facebook", "https://fb.watch/abc"), ("instagram", "https://www.instagram.com/reel/abc/")])
def test_new_platforms_accepted(p, u):
    assert validate_url(p, u) == u

def test_cross_platform_rejected():
    with pytest.raises(UnsafeUrl):
        validate_url("instagram", "https://www.facebook.com/watch?v=1")

def test_best_option_when_no_resolution(monkeypatch):
    monkeypatch.setattr(main, "extract_info", lambda u: {"title": "R", "formats": [{"vcodec": "h264", "acodec": "aac"}]})
    d = c.post("/api/info", json={"url": "https://www.instagram.com/reel/abc/", "platform": "instagram"}).json()
    assert [v["id"] for v in d["video"]] == ["best"]
    assert c.get("/api/download", params={"url": "https://www.instagram.com/reel/abc/", "kind": "video", "id": "best;x"}).status_code == 400

def test_max_height_cap(monkeypatch):
    monkeypatch.setattr(config, "MAX_HEIGHT", 360)
    monkeypatch.setattr(main, "extract_info", lambda u: FAKE)
    d = c.post("/api/info", json={"url": "https://youtu.be/abc", "platform": "youtube"}).json()
    assert [v["id"] for v in d["video"]] == ["360"]
    assert c.get("/api/download", params={"url": "https://youtu.be/abc", "kind": "video", "id": "720"}).status_code == 400

def _no_video(u):
    from yt_dlp.utils import DownloadError
    raise DownloadError("There is no video in this post")

def test_photo_post_fallback(monkeypatch):
    monkeypatch.setattr(main, "extract_info", _no_video)
    monkeypatch.setattr(main.images, "list_images", lambda u: ["jpg", "jpg", "png"])
    d = c.post("/api/info", json={"url": "https://www.instagram.com/p/abc/", "platform": "instagram"}).json()
    assert d["video"] == [] and d["images"][0]["id"] == "all" and "3 ảnh" in d["images"][0]["label"]

def test_photo_login_message(monkeypatch):
    monkeypatch.setattr(main, "extract_info", _no_video)
    def boom(u): raise main.images.ImageError("login")
    monkeypatch.setattr(main.images, "list_images", boom)
    r = c.post("/api/info", json={"url": "https://www.instagram.com/p/abc/", "platform": "instagram"})
    assert r.status_code == 422 and "đăng nhập" in r.json()["detail"]

def test_youtube_never_uses_image_fallback(monkeypatch):
    monkeypatch.setattr(main, "extract_info", _no_video)
    monkeypatch.setattr(main.images, "list_images", lambda u: (_ for _ in ()).throw(AssertionError("must not be called")))
    assert c.post("/api/info", json={"url": "https://youtu.be/abc", "platform": "youtube"}).status_code == 422

def test_image_download(monkeypatch):
    def fake(url, job, mb):
        p = os.path.join(job, "a.jpg"); open(p, "wb").write(b"img"); return p, "anh"
    monkeypatch.setattr(main.images, "download_all", fake)
    r = c.get("/api/download", params={"url": "https://www.instagram.com/p/abc/", "kind": "image", "id": "all"})
    assert r.status_code == 200 and r.content == b"img" and os.listdir(config.TMP_DIR) == []
    assert c.get("/api/download", params={"url": "https://www.instagram.com/p/abc/", "kind": "image", "id": "x"}).status_code == 400

def test_images_parse_gallery_dl_errors(monkeypatch):
    import subprocess, json
    from app import images
    def fake(args, timeout):
        out = json.dumps([[-1, {"error": "AuthRequired", "message": "login required"}]])
        return subprocess.CompletedProcess(args, 0, out, "")
    monkeypatch.setattr(images, "_run", fake)
    with pytest.raises(images.ImageError) as e:
        images.list_images("https://www.instagram.com/p/abc/")
    assert e.value.kind == "login"
    monkeypatch.setattr(images, "_run", lambda a, t: subprocess.CompletedProcess(a, 0, json.dumps([[2, {}], [3, "u", {"extension": "jpg"}], [3, "v", {"extension": "mp4"}]]), ""))
    assert images.list_images("https://www.instagram.com/p/abc/") == ["jpg"]
