// Pure timer state machine
import type { TimerState } from './types';

/**
 * TimerEngine - Utility functions for timer state
 * This class now primarily provides utility functions like
 * formatTime() and getProgress() for UI display.
 *
 * The tick/start/pause/reset logic is now handled by:
 * - src-tauri/src/timer/state.rs (Rust state)
 * - src-tauri/src/timer/service.rs (Rust timer loop)
 * - src-tauri/src/timer/commands.rs (Tauri commands)
 */
export class TimerEngine {
  static createInitialState(seconds: number): TimerState {
    return {
      status: 'ready',
      seconds,
      initialSeconds: seconds,
    };
  }

  static tick(state: TimerState): TimerState {
    // Only tick if running
    if (state.status !== 'running') {
      return state;
    }

    const newSeconds = state.seconds - 1;

    if (newSeconds <= 0) {
      return {
        ...state,
        seconds: 0,
        status: 'finished',
      };
    }

    return {
      ...state,
      seconds: newSeconds,
    };
  }

  static start(state: TimerState): TimerState {
    // Can only start from ready or paused
    if (state.status !== 'ready' && state.status !== 'paused') {
      return state;
    }

    return {
      ...state,
      status: 'running',
    };
  }

  static pause(state: TimerState): TimerState {
    // Can only pause if running
    if (state.status !== 'running') {
      return state;
    }

    return {
      ...state,
      status: 'paused',
    };
  }

  static reset(state: TimerState, seconds?: number): TimerState {
    const newSeconds = seconds ?? state.initialSeconds;

    return {
      status: 'ready',
      seconds: newSeconds,
      initialSeconds: newSeconds,
    };
  }

  static isFinished(state: TimerState): boolean {
    return state.status === 'finished';
  }

  static isRunning(state: TimerState): boolean {
    return state.status === 'running';
  }

  static isReady(state: TimerState): boolean {
    return state.status === 'ready';
  }

  static getProgress(state: TimerState): number {
    if (state.initialSeconds === 0) return 100;
    return ((state.initialSeconds - state.seconds) / state.initialSeconds) * 100;
  }

  static formatTime(state: TimerState): string {
    const totalSeconds = state.seconds;

    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return totalSeconds.toString();
  }
}
