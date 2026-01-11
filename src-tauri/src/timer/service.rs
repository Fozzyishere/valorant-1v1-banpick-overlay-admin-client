// Timer service - async timer loop and event emission

use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio::time::interval;

use super::state::{TimerSnapshot, TimerState, TimerStatus};

/// Payload sent with timer-tick events
/// Matches the RustTimerPayload TypeScript interface
#[derive(Clone, serde::Serialize)]
pub struct TimerTickPayload {
    pub status: String,
    pub seconds: u32,
    pub initial_seconds: u32,
    pub timestamp_ms: u64,
}

impl From<&TimerSnapshot> for TimerTickPayload {
    fn from(snapshot: &TimerSnapshot) -> Self {
        let timestamp_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        Self {
            status: match snapshot.status {
                TimerStatus::Ready => "ready".to_string(),
                TimerStatus::Running => "running".to_string(),
                TimerStatus::Paused => "paused".to_string(),
                TimerStatus::Finished => "finished".to_string(),
            },
            seconds: snapshot.seconds,
            initial_seconds: snapshot.initial_seconds,
            timestamp_ms,
        }
    }
}

/// Emit current timer state to all windows
pub fn emit_timer_state(app: &AppHandle, snapshot: &TimerSnapshot) {
    let payload = TimerTickPayload::from(snapshot);
    if let Err(e) = app.emit("timer-tick", &payload) {
        eprintln!("Failed to emit timer-tick event: {}", e);
    }
}

/// Async timer loop that runs in background
/// Decrements timer every second and emits events
pub async fn run_timer_loop(app: AppHandle, state: Arc<Mutex<TimerState>>) {
    let mut stop_rx = {
        let guard = state.lock().await;
        guard.get_stop_receiver()
    };

    // Create 1-second interval ticker
    let mut ticker = interval(Duration::from_secs(1));

    // Skip the first immediate tick (interval fires immediately on creation)
    ticker.tick().await;

    loop {
        tokio::select! {
            _ = ticker.tick() => {
                let mut guard = state.lock().await;
                if guard.status != TimerStatus::Running {
                    break;
                }
                if guard.seconds > 0 {
                    guard.seconds -= 1;
                    if guard.seconds == 0 {
                        guard.status = TimerStatus::Finished;
                    }
                    let snapshot = guard.snapshot();
                    emit_timer_state(&app, &snapshot);
                    if guard.seconds == 0 {
                        if let Err(e) = app.emit("timer-finished", ()) {
                            eprintln!("Failed to emit timer-finished event: {}", e);
                        }
                        break;
                    }
                }
            }

            // Handle stop signal (pause/reset)
            result = stop_rx.changed() => {
                if result.is_ok() {
                    // Stop signal received, exit loop
                    break;
                }
            }
        }
    }
}