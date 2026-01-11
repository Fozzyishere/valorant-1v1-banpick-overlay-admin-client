// Pure timer types - framework agnostic

export type TimerStatus = 'ready' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  seconds: number;
  initialSeconds: number;
}

/**
 * Payload received from Rust timer-tick events
 * Matches TimerTickPayload in src-tauri/src/timer/service.rs
 */
export interface RustTimerPayload {
  status: TimerStatus;
  seconds: number;
  initial_seconds: number;
  timestamp_ms: number;
}
