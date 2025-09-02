// Server Commands - Tauri interface for server control

use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use crate::services::{TournamentServer, PlayerInfo};
use crate::services::socket_server::ServerStatus;

// Global server state with async Mutex
pub type ServerState = Arc<Mutex<TournamentServer>>;

#[tauri::command]
pub async fn start_tournament_server(
    state: State<'_, ServerState>,
    port: u16,
) -> Result<String, String> {
    let mut server = state.lock().await;
    server.start(port).await
}

#[tauri::command]
pub async fn stop_tournament_server(
    state: State<'_, ServerState>,
) -> Result<String, String> {
    let mut server = state.lock().await;
    server.stop().await
}

#[tauri::command]
pub async fn get_server_status(
    state: State<'_, ServerState>,
) -> Result<ServerStatus, String> {
    let server = state.lock().await;
    Ok(server.get_status().await)
}

#[tauri::command]
pub async fn get_connected_players(
    state: State<'_, ServerState>,
) -> Result<Vec<PlayerInfo>, String> {
    let server = state.lock().await;
    Ok(server.get_connected_players().await)
}