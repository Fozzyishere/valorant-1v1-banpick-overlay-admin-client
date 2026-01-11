// Timer state management

use serde::{Deserialize, Serialize};
use tokio::sync::watch;

/// TimerStatus types
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TimerStatus {
    Ready,
    Running,
    Paused,
    Finished,
}

impl Default for TimerStatus {
    fn default() -> Self {
        TimerStatus::Ready
    }
}

/// Serializable snapshot of timer state for events
#[derive(Clone, Debug, Serialize)]
pub struct TimerSnapshot {
    pub status: TimerStatus,
    pub seconds: u32,
    pub initial_seconds: u32,
}

/// Internal timer state with control channels
pub struct TimerState {
    pub status: TimerStatus,
    pub seconds: u32,
    pub initial_seconds: u32,

    /// Channel to signal timer loop to stop
    stop_signal: watch::Sender<bool>,
    stop_receiver: watch::Receiver<bool>,
}

impl TimerState {
    pub fn new(initial_seconds: u32) -> Self {
        let (tx, rx) = watch::channel(false);
        Self {
            status: TimerStatus::Ready,
            seconds: initial_seconds,
            initial_seconds,
            stop_signal: tx,
            stop_receiver: rx,
        }
    }

    /// Get a serializable snapshot of current state
    pub fn snapshot(&self) -> TimerSnapshot {
        TimerSnapshot {
            status: self.status,
            seconds: self.seconds,
            initial_seconds: self.initial_seconds,
        }
    }

    /// Get a clone of the stop receiver for the timer loop
    pub fn get_stop_receiver(&self) -> watch::Receiver<bool> {
        self.stop_receiver.clone()
    }

    /// Send stop signal to terminate running timer loop
    pub fn send_stop_signal(&self) {
        let _ = self.stop_signal.send(true);
    }

    /// Reset timer to initial or specified seconds
    pub fn reset(&mut self, seconds: Option<u32>) {
        self.send_stop_signal();

        let new_seconds = seconds.unwrap_or(self.initial_seconds);
        self.status = TimerStatus::Ready;
        self.seconds = new_seconds;
        self.initial_seconds = new_seconds;

        // Create new stop channel for next timer run
        let (tx, rx) = watch::channel(false);
        self.stop_signal = tx;
        self.stop_receiver = rx;
    }
}

// Timer duration constants (matching TypeScript)
pub const DEV_TIMER_SECONDS: u32 = 3;
pub const DEFAULT_TIMER_SECONDS: u32 = 30;

// Baisic tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_timer_state() {
        let state = TimerState::new(30);
        assert_eq!(state.status, TimerStatus::Ready);
        assert_eq!(state.seconds, 30);
        assert_eq!(state.initial_seconds, 30);
    }

    #[test]
    fn test_timer_reset_with_new_seconds() {
        let mut state = TimerState::new(30);
        state.seconds = 10;
        state.status = TimerStatus::Running;

        state.reset(Some(20));

        assert_eq!(state.seconds, 20);
        assert_eq!(state.initial_seconds, 20);
        assert_eq!(state.status, TimerStatus::Ready);
    }

    #[test]
    fn test_timer_reset_to_initial() {
        let mut state = TimerState::new(30);
        state.seconds = 10;
        state.status = TimerStatus::Paused;

        state.reset(None);

        assert_eq!(state.seconds, 30);
        assert_eq!(state.initial_seconds, 30);
        assert_eq!(state.status, TimerStatus::Ready);
    }

    #[test]
    fn test_snapshot() {
        let state = TimerState::new(25);
        let snapshot = state.snapshot();

        assert_eq!(snapshot.status, TimerStatus::Ready);
        assert_eq!(snapshot.seconds, 25);
        assert_eq!(snapshot.initial_seconds, 25);
    }
}