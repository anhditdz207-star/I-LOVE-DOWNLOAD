"""Entry point of the desktop build: a local-only server (127.0.0.1) that serves both the UI and the API."""
import argparse, os, sys, threading

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=18765)
    ap.add_argument("--exit-on-stdin-eof", action="store_true", help="quit when the parent app closes (used by the desktop shell)")
    args = ap.parse_args()

    frozen = getattr(sys, "frozen", False)
    here = os.path.dirname(sys.executable) if frozen else os.path.dirname(os.path.abspath(__file__))
    # ffmpeg, ffprobe, deno and gallery-dl are installed next to the app: put that folder on PATH
    os.environ["PATH"] = here + os.pathsep + os.environ.get("PATH", "")
    ui = os.path.join(getattr(sys, "_MEIPASS", here), "ui") if frozen else os.path.join(here, "..", "dist")
    # Personal desktop use: no resolution cap, generous limits (set before the app module reads them)
    os.environ.setdefault("STATIC_DIR", ui)
    os.environ.setdefault("ALLOWED_ORIGINS", f"http://127.0.0.1:{args.port},http://tauri.localhost,tauri://localhost")
    os.environ.setdefault("MAX_DURATION_SECONDS", "86400")
    os.environ.setdefault("MAX_FILESIZE_MB", "20000")
    os.environ.setdefault("RATE_LIMIT_PER_MIN", "1000")
    os.environ.setdefault("MAX_CONCURRENT_DOWNLOADS", "2")

    if args.exit_on_stdin_eof and sys.stdin is not None and getattr(sys.stdin, "buffer", None) is not None:
        def watch() -> None:
            try:
                sys.stdin.buffer.read()   # returns when the parent process is gone
            except Exception:
                pass
            os._exit(0)
        threading.Thread(target=watch, daemon=True).start()

    import uvicorn
    from app.main import app
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")

if __name__ == "__main__":
    main()
