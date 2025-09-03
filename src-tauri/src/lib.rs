use std::sync::Arc;
use tokio::sync::Mutex;
use tracing_subscriber;

// Import our modules
mod commands;
mod services;
mod models;
mod utils;

use commands::{ServerState, *};
use services::TournamentServer;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing for logging
    tracing_subscriber::fmt::init();

    // Create server state
    let server_state: ServerState = Arc::new(Mutex::new(TournamentServer::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(server_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            start_tournament_server,
            stop_tournament_server,
            get_server_status,
            get_connected_players,
            broadcast_tournament_state,
            send_turn_start,
            send_timer_control,
            send_tournament_start,
            send_tournament_end
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}