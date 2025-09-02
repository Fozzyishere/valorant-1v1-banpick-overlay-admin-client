use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use tracing_subscriber;

// Import our modules
mod socket_server;
mod player_manager;
mod tournament_broadcast;

use socket_server::{TournamentServer, ServerStatus};
use player_manager::PlayerInfo;
use tournament_broadcast::TournamentState;

// Global server state with async Mutex
type ServerState = Arc<Mutex<TournamentServer>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_tournament_server(
    state: State<'_, ServerState>,
    port: u16,
) -> Result<String, String> {
    let mut server = state.lock().await;
    server.start(port).await
}

#[tauri::command]
async fn stop_tournament_server(
    state: State<'_, ServerState>,
) -> Result<String, String> {
    let mut server = state.lock().await;
    server.stop().await
}

#[tauri::command]
async fn get_server_status(
    state: State<'_, ServerState>,
) -> Result<ServerStatus, String> {
    let server = state.lock().await;
    Ok(server.get_status().await)
}

#[tauri::command]
async fn get_connected_players(
    state: State<'_, ServerState>,
) -> Result<Vec<PlayerInfo>, String> {
    let server = state.lock().await;
    Ok(server.get_connected_players().await)
}

#[tauri::command]
async fn broadcast_tournament_state(
    state: State<'_, ServerState>,
    tournament_state: TournamentState,
) -> Result<(), String> {
    let server = state.lock().await;
    server.broadcast_tournament_state(tournament_state).await
}

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
            broadcast_tournament_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
