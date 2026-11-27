import os, tempfile

def _csv(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]

ALLOWED_ORIGINS = _csv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8000")
TMP_DIR = os.getenv("TMP_DIR", os.path.join(tempfile.gettempdir(), "ild"))
TMP_TTL_SECONDS = int(os.getenv("TMP_TTL_SECONDS", "900"))
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "20"))
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "3600"))
MAX_FILESIZE = int(os.getenv("MAX_FILESIZE_MB", "500")) * 1024 * 1024
MAX_CONCURRENT_DOWNLOADS = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "1"))
MAX_HEIGHT = int(os.getenv("MAX_HEIGHT", "0"))  # 0 = no cap; free hosts: 720
TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() == "true"
