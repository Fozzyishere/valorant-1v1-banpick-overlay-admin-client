// Tauri commands for timer control
// Called from TypeScript via invoke()

use std::sync::Arc;

use tauri::{AppHandle, State};
use tokio::sync::Mutex;

use super::service::{emit_timer_state, run_timer_loop};
use super::state::{TimerSnapshot, TimerState, TimerStatus};

/// Type alias for the managed timer state
pub type TimerStateHandle = Arc<Mutex<TimerState>>;

#[tauri::command]
pub async fn start_timer(
    app: AppHandle,
    state: State<'_, TimerStateHandle>,
) -> Result<TimerSnapshot, String> {
    let mut guard = state.lock().await;

    // Validate current state
    if guard.status != TimerStatus::Ready && guard.status != TimerStatus::Paused {
        return Err(format!(
            "Cannot start timer in {:?} state. Must be 'ready' or 'paused'.",
            guard.status
        ));
    }

    // Update status to running
    guard.status = TimerStatus::Running;
    let snapshot = guard.snapshot();

    // Emit initial state to all windows
    emit_timer_state(&app, &snapshot);

    // Clone state handle for the timer loop
    let state_clone = state.inner().clone();

    // Release lock before spawning
    drop(guard);

    // Spawn the timer loop in background
    tauri::async_runtime::spawn(run_timer_loop(app, state_clone));

    Ok(snapshot)
}

#[tauri::command]
pub async fn pause_timer(
    app: AppHandle,
    state: State<'_, TimerStateHandle>,
) -> Result<TimerSnapshot, String> {
    let mut guard = state.lock().await;

    // Validate current state
    if guard.status != TimerStatus::Running {
        return Err(format!(
            "Cannot pause timer in {:?} state. Must be 'running'.",
            guard.status
        ));
    }

    // Stop the running loop
    guard.send_stop_signal();
    guard.status = TimerStatus::Paused;

    let snapshot = guard.snapshot();
    emit_timer_state(&app, &snapshot);

    Ok(snapshot)
}

#[tauri::command]
pub async fn reset_timer(
    app: AppHandle,
    state: State<'_, TimerStateHandle>,
    seconds: Option<u32>,
) -> Result<TimerSnapshot, String> {
    let mut guard = state.lock().await;

    // Reset handles stopping any running timer
    guard.reset(seconds);

    let snapshot = guard.snapshot();
    emit_timer_state(&app, &snapshot);

    Ok(snapshot)
}

/// Get current timer state
/// Useful for initial sync when overlay opens
#[tauri::command]
pub async fn get_timer_state(state: State<'_, TimerStateHandle>) -> Result<TimerSnapshot, String> {
    let guard = state.lock().await;
    Ok(guard.snapshot())
}