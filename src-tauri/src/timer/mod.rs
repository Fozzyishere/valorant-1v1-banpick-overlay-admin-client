// Timer module - centralized timer management for all windows
// Single source of truth eliminating sync drift between admin and overlay

pub mod commands;
pub mod service;
pub mod state;

// Re-export commonly used items
pub use commands::{get_timer_state, pause_timer, reset_timer, start_timer, TimerStateHandle};
pub use state::{TimerState, DEV_TIMER_SECONDS, DEFAULT_TIMER_SECONDS};