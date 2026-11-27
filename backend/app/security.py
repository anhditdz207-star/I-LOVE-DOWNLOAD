import re
from urllib.parse import urlparse

HOSTS = {
    "youtube": {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"},
    "facebook": {"facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"},
    "instagram": {"instagram.com", "www.instagram.com", "m.instagram.com"},
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

_RESERVED = {"p", "reel", "reels", "tv", "stories", "explore", "accounts", "watch", "photo", "photo.php", "groups", "share", "story.php",
             "permalink.php", "profile.php", "login", "hashtag", "marketplace", "events", "pages", "gaming", "public", "sharer",
             "sharer.php", "posts", "videos", "video", "live", "help", "privacy", "policies"}

def profile_avatar_url(platform: str, raw: str) -> str | None:
    """If `raw` (already validated) is a bare profile link, return the gallery-dl avatar URL for that account, else None."""
    u = urlparse(raw.strip())
    host, path = (u.hostname or "").lower(), u.path.rstrip("/")
    if platform == "tiktok" and host.endswith("tiktok.com"):
        m = re.fullmatch(r"/@([A-Za-z0-9._]{1,64})", path)
        return f"https://www.tiktok.com/@{m[1]}/avatar" if m else None
    if platform == "instagram":
        m = re.fullmatch(r"/([A-Za-z0-9._]{1,30})", path)
        return f"https://www.instagram.com/{m[1]}/avatar/" if m and m[1].lower() not in _RESERVED else None
    if platform == "facebook" and host.endswith("facebook.com"):
        m = re.fullmatch(r"/([A-Za-z0-9.\-]{1,80})", path)
        return f"https://www.facebook.com/{m[1]}/avatar" if m and m[1].lower() not in _RESERVED else None
    return None
