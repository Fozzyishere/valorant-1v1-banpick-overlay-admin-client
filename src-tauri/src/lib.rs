mod timer;

use std::sync::Arc;
use tokio::sync::Mutex;

use timer::{
    get_timer_state, pause_timer, reset_timer, start_timer, TimerState, TimerStateHandle,
    DEFAULT_TIMER_SECONDS,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_state: TimerStateHandle = Arc::new(Mutex::new(TimerState::new(DEFAULT_TIMER_SECONDS)));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Register timer state for access in commands
        .manage(timer_state)
        // Register all commands
        .invoke_handler(tauri::generate_handler![
            greet,
            start_timer,
            pause_timer,
            reset_timer,
            get_timer_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}