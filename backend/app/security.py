from urllib.parse import urlparse

HOSTS = {
    "youtube": {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"},
    "tiktok": {"tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"},
}

class UnsafeUrl(ValueError):
    pass

def validate_url(platform: str, raw: str) -> str:
    """https only, exact allow-listed hostname, no credentials/odd ports. Blocks IPs, localhost, file:// etc."""
    if platform not in HOSTS or not raw or len(raw) > 2048:
        raise UnsafeUrl("invalid")
    try:
        u = urlparse(raw.strip())
        port = u.port
    except ValueError:
        raise UnsafeUrl("invalid")
    if u.scheme != "https" or u.username or u.password or port not in (None, 443):
        raise UnsafeUrl("invalid")
    if (u.hostname or "").lower() not in HOSTS[platform]:
        raise UnsafeUrl("invalid")
    return u.geturl()

def platform_of(raw: str) -> str:
    for p in HOSTS:
        try:
            validate_url(p, raw)
            return p
        except UnsafeUrl:
            continue
    raise UnsafeUrl("invalid")
