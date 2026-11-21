"""Turn a yt-dlp info dict into the options the frontend shows. Only real, supported options are returned."""
AUDIO_PRESETS = [("mp3", 128), ("mp3", 192), ("mp3", 256), ("mp3", 320), ("m4a", None), ("opus", None), ("wav", None), ("flac", None)]
AUDIO_IDS = {f"{f}-{b}" if b else f: (f, b) for f, b in AUDIO_PRESETS}

def _size(f: dict) -> int:
    return f.get("filesize") or f.get("filesize_approx") or 0

def _label(h: int) -> str:
    return {720: "720p HD", 1080: "1080p Full HD", 1440: "1440p 2K", 2160: "2160p 4K"}.get(h, f"{h}p")

def build_info(info: dict) -> dict:
    fmts = info.get("formats") or []
    vids = [f for f in fmts if f.get("vcodec") not in (None, "none") and f.get("height")]
    aonly = [f for f in fmts if f.get("acodec") not in (None, "none") and f.get("vcodec") in (None, "none")]
    best_a = max((_size(f) for f in aonly), default=0)
    video = []
    for h in sorted({f["height"] for f in vids}):
        vs = max((_size(f) for f in vids if f["height"] == h), default=0)
        video.append({"id": str(h), "label": _label(h), "ext": "mp4", "filesize": (vs + best_a) if vs else None})
    if not video and any(f.get("vcodec") not in (None, "none") for f in fmts):  # source gives no resolution info
        video.append({"id": "best", "label": "Chất lượng gốc", "ext": "mp4", "filesize": None})
    src_abr = max((f.get("abr") or 0 for f in fmts if f.get("acodec") not in (None, "none")), default=0) or 128
    audio = []
    for fmt, br in AUDIO_PRESETS:
        ok = True if br is None else br <= src_abr * 1.15  # never offer a bitrate above the source quality
        audio.append({"id": f"{fmt}-{br}" if br else fmt, "format": fmt.upper(), "bitrate": br, "filesize": None, "available": ok})
    return {"title": info.get("title") or "Không có tiêu đề", "thumbnail": info.get("thumbnail"),
            "duration": int(info["duration"]) if info.get("duration") else None, "uploader": info.get("uploader"),
            "video": video, "audio": audio}
