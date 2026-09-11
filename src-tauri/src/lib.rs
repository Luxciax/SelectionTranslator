mod ai;
mod diagnostics;
pub mod domain;
mod platform;
mod selection;
pub mod settings;

pub fn run() {
    let settings_state = settings::SettingsState::load_default()
        .expect("failed to initialize SelectionTranslator settings");
    let diagnostic_log = diagnostics::DiagnosticLog::new_default()
        .expect("failed to initialize SelectionTranslator diagnostics");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            platform::window::show_home(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .manage(ai::AiRuntime::new())
        .manage(diagnostic_log)
        .manage(settings_state)
        .invoke_handler(tauri::generate_handler![
            ai::start_ai_action,
            ai::start_routed_ai_action,
            ai::cancel_ai,
            ai::list_models,
            ai::model_capabilities,
            ai::load_api_key,
            ai::save_api_key,
            ai::load_provider_api_key,
            ai::save_provider_api_key,
            ai::migrate_legacy_api_key,
            diagnostics::diagnostics_log_path,
            settings::settings_get,
            settings::settings_replace,
            settings::settings_migrate_legacy,
            selection::open_action,
            selection::hide_result,
            selection::set_result_pinned,
            selection::write_to_clipboard,
            selection::runtime_pause_selection,
            selection::runtime_resume_selection,
            selection::runtime_selection_paused,
            platform::autostart::autostart_is_enabled,
            platform::autostart::autostart_set_enabled,
        ])
        .setup(|app| {
            selection::start(app.handle().clone())?;
            platform::tray::setup(app)?;
            if !platform::window::launched_from_autostart() {
                platform::window::show_home(app.handle());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run SelectionTranslator");
}
