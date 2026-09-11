use tauri::{AppHandle, Emitter, LogicalSize, Manager, WebviewWindow};

const MAIN_WINDOW_WIDTH: f64 = 1120.0;
const MAIN_WINDOW_HEIGHT: f64 = 760.0;

fn prepare_main_window(window: &WebviewWindow) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    }
    let _ = window.set_size(LogicalSize::new(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT));
}

pub fn launched_from_autostart() -> bool {
    std::env::args().any(|arg| arg == "--autostart")
}

pub fn show_home(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("result") {
        prepare_main_window(&window);
        let _ = window.emit("app://home", ());
        let _ = window.center();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn show_settings(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("result") {
        prepare_main_window(&window);
        let _ = window.emit("app://home", ());
        let _ = window.center();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("app://settings", ());
    }
}
