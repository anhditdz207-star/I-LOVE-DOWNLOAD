"""Photo posts (TikTok photo mode, Facebook, Instagram) via gallery-dl, run as a separate process.
Only URLs already validated against the allow-list reach this module; arguments are a fixed list (no shell)."""
import json, os, subprocess, sys, zipfile

IMG_EXT = {"jpg", "jpeg", "png", "webp", "gif", "avif"}
_FILTER = "extension in ('jpg','jpeg','png','webp','gif','avif')"
_BASE = [sys.executable, "-m", "gallery_dl", "--config-ignore"]

class ImageError(Exception):
    def __init__(self, kind: str):
        super().__init__(kind)
        self.kind = kind  # "login" | "none" | "timeout"

def _run(args: list[str], timeout: int) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(_BASE + args, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise ImageError("timeout")

def _kind(stderr: str) -> str:
    s = stderr.lower()
    return "login" if any(k in s for k in ("login", "authrequired", "401", "403", "cookies")) else "none"

def list_images(url: str) -> list[str]:
    """Returns the file extensions of the images in the post (empty list if none)."""
    p = _run(["-j", url], 45)
    try:
        entries = json.loads(p.stdout or "[]")
    except ValueError:
        entries = []
    items = [e for e in entries if isinstance(e, list) and e]
    exts = [str((e[2] if len(e) > 2 else {}).get("extension", "")).lower() for e in items if e[0] == 3]
    exts = [x for x in exts if x in IMG_EXT]
    if not exts:
        errs = " ".join(json.dumps(e[1]) for e in items if e[0] == -1 and len(e) > 1)  # gallery-dl reports errors inside the JSON stream
        if errs or p.returncode != 0 or p.stderr.strip():
            raise ImageError(_kind(errs + " " + p.stderr))
    return exts

def download_all(url: str, job_dir: str, max_mb: int) -> tuple[str, str]:
    p = _run(["-D", job_dir, "--filter", _FILTER, "--filesize-max", f"{max_mb}M", url], 120)
    files = sorted(f for f in os.listdir(job_dir) if f.rsplit(".", 1)[-1].lower() in IMG_EXT)
    if not files:
        raise ImageError(_kind(p.stderr))
    if len(files) == 1:
        return os.path.join(job_dir, files[0]), "anh"
    zpath = os.path.join(job_dir, "anh.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
        for f in files:
            z.write(os.path.join(job_dir, f), f)
    return zpath, "anh"
