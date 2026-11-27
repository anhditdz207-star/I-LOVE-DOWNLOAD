// Hide the console window in release builds on Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

// The Python backend (yt-dlp, gallery-dl, FFmpeg) runs as a hidden "sidecar" on this local port
// and also serves the React UI. The window first shows desktop/splash, which waits for the backend and then opens it.
const PORT: &str = "18765";

struct Backend(Mutex<Option<CommandChild>>);

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Backend(Mutex::new(None)))
        .setup(|app| {
            let (mut rx, child) = app
                .shell()
                .sidecar("ild-backend")?
                .args(["--port", PORT, "--exit-on-stdin-eof"])
                .spawn()?;
            *app.state::<Backend>().0.lock().unwrap() = Some(child);
            // Keep draining the backend's output so its pipes never fill up.
            tauri::async_runtime::spawn(async move { while rx.recv().await.is_some() {} });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("khong khoi tao duoc ung dung");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            if let Some(child) = handle.state::<Backend>().0.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
    });
}
