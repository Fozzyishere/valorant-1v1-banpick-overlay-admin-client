// Tournament Commands - Tauri interface for tournament control

use tauri::State;

use crate::commands::server::ServerState;
use crate::services::tournament_service::TournamentState;
use crate::services::socket_server::{TimerControlEvent, TournamentResults};

#[tauri::command]
pub async fn broadcast_tournament_state(
    state: State<'_, ServerState>,
    tournament_state: TournamentState,
) -> Result<(), String> {
    let server = state.lock().await;
    server.broadcast_tournament_state(tournament_state).await
}

#[tauri::command]
pub async fn send_turn_start(
    state: State<'_, ServerState>,
    tournament_state: TournamentState,
    target_player: String,
    time_limit: i32,
) -> Result<(), String> {
    let server = state.lock().await;
    server.send_turn_start(&tournament_state, &target_player, time_limit).await
}

#[tauri::command]
pub async fn send_timer_control(
    state: State<'_, ServerState>,
    control: TimerControlEvent,
) -> Result<(), String> {
    let server = state.lock().await;
    server.send_timer_control(control).await
}

#[tauri::command]
pub async fn send_tournament_start(
    state: State<'_, ServerState>,
    tournament_state: TournamentState,
) -> Result<(), String> {
    let server = state.lock().await;
    server.send_tournament_start(&tournament_state).await
}

#[tauri::command]
pub async fn send_tournament_end(
    state: State<'_, ServerState>,
    results: TournamentResults,
) -> Result<(), String> {
    let server = state.lock().await;
    server.send_tournament_end(&results).await
}

// Legacy command - kept for compatibility
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}