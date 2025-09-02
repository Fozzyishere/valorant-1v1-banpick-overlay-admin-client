// Tournament Commands - Tauri interface for tournament control

use tauri::State;

use crate::commands::server::ServerState;
use crate::services::tournament_service::TournamentState;

#[tauri::command]
pub async fn broadcast_tournament_state(
    state: State<'_, ServerState>,
    tournament_state: TournamentState,
) -> Result<(), String> {
    let server = state.lock().await;
    server.broadcast_tournament_state(tournament_state).await
}

// Legacy command - kept for compatibility
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}