"""Photo posts (TikTok photo mode, Facebook, Instagram) via gallery-dl, run as a separate process.
Only URLs already validated against the allow-list reach this module; arguments are a fixed list (no shell)."""
import os, re, subprocess, sys, zipfile

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

def _kind(text: str) -> str:
    s = text.lower()
    return "login" if any(k in s for k in ("login", "auth", "401", "403", "cookies")) else "none"

def _nat(name: str) -> list:
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r"(\d+)", name)]

def list_files(job_dir: str) -> list[str]:
    names = [f for f in os.listdir(job_dir) if f.rsplit(".", 1)[-1].lower() in IMG_EXT]
    return sorted(names, key=_nat)

def fetch(url: str, job_dir: str, max_mb: int, max_count: int) -> None:
    """Downloads the post's images into job_dir. Raises ImageError if there are none."""
    p = _run(["-D", job_dir, "--filter", _FILTER, "--filesize-max", f"{max_mb}M", "--range", f"1-{max_count}", url], 120)
    if not list_files(job_dir):
        raise ImageError(_kind(p.stderr))

def pack(job_dir: str, names: list[str], out_dir: str) -> tuple[str, str]:
    """One image -> the file itself. Several -> a zip placed in out_dir. Returns (path, download filename)."""
    if len(names) == 1:
        return os.path.join(job_dir, names[0]), names[0]
    zpath = os.path.join(out_dir, "anh.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
        for f in names:
            z.write(os.path.join(job_dir, f), f)
    return zpath, "anh.zip"
