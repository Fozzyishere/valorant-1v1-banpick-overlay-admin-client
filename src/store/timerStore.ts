// Timer Store - Rust Backend Integration

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { TimerState, TimerStatus, RustTimerPayload } from '../core/timer/types';
import { DEFAULT_TIMER_SECONDS } from '../core/tournament/constants';

// ============================================
// Store State & Actions Interface
// ============================================

export interface TimerStoreState extends TimerState {
  // Actions
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: (seconds?: number) => Promise<void>;

  // Callback registration for timer events
  onTimerFinished: (() => void) | null;
  setOnTimerFinished: (callback: (() => void) | null) => void;

  // Internal: update from Rust events
  _updateFromRust: (payload: RustTimerPayload) => void;

  // Utility
  getSnapshot: () => TimerState;
}

// ============================================
// Store Implementation
// ============================================

const INITIAL_SECONDS = DEFAULT_TIMER_SECONDS;

export const useTimerStore = create<TimerStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    status: 'ready' as TimerStatus,
    seconds: INITIAL_SECONDS,
    initialSeconds: INITIAL_SECONDS,
    onTimerFinished: null,

    // ----------------------------------------
    // Timer Controls
    // ----------------------------------------

    startTimer: async () => {
      try {
        await invoke('start_timer');
      } catch (error) {
        console.error('Failed to start timer:', error);
        throw error;
      }
    },

    pauseTimer: async () => {
      try {
        await invoke('pause_timer');
      } catch (error) {
        console.error('Failed to pause timer:', error);
        throw error;
      }
    },

    resetTimer: async (seconds?: number) => {
      try {
        await invoke('reset_timer', { seconds: seconds ?? INITIAL_SECONDS });
      } catch (error) {
        console.error('Failed to reset timer:', error);
        throw error;
      }
    },

    // ----------------------------------------
    // Callback Registration
    // ----------------------------------------

    setOnTimerFinished: (callback) => {
      set({ onTimerFinished: callback });
    },

    // ----------------------------------------
    // Internal: Update from Rust Events
    // ----------------------------------------

    _updateFromRust: (payload: RustTimerPayload) => {
      set({
        status: payload.status,
        seconds: payload.seconds,
        initialSeconds: payload.initial_seconds,
      });
    },

    // ----------------------------------------
    // Utility
    // ----------------------------------------

    getSnapshot: (): TimerState => {
      const state = get();
      return {
        status: state.status,
        seconds: state.seconds,
        initialSeconds: state.initialSeconds,
      };
    },
  }))
);

// ============================================
// Rust Event Subscriptions
// ============================================

let tickUnlisten: UnlistenFn | null = null;
let finishedUnlisten: UnlistenFn | null = null;
let isInitialized = false;

/**
 * Initialize event listeners for Rust timer events
 * Call this once during app startup
 */
export async function initializeTimerEventListeners(): Promise<void> {
  if (isInitialized) {
    console.warn('Timer event listeners already initialized');
    return;
  }

  try {
    tickUnlisten = await listen<RustTimerPayload>('timer-tick', (event) => {
      useTimerStore.getState()._updateFromRust(event.payload);
    });

    finishedUnlisten = await listen('timer-finished', () => {
      const callback = useTimerStore.getState().onTimerFinished;
      if (callback) {
        // Defer to allow state to settle
        setTimeout(callback, 0);
      }
    });

    const initialState = await invoke<{
      status: TimerStatus;
      seconds: number;
      initial_seconds: number;
    }>('get_timer_state');

    useTimerStore.getState()._updateFromRust({
      ...initialState,
      timestamp_ms: Date.now(),
    });

    isInitialized = true;
    console.log('Timer event listeners initialized');
  } catch (error) {
    console.error('Failed to initialize timer event listeners:', error);
    throw error;
  }
}

/**
 * Cleanup event listeners
 * Call this during app teardown
 */
export async function cleanupTimerEventListeners(): Promise<void> {
  if (tickUnlisten) {
    tickUnlisten();
    tickUnlisten = null;
  }
  if (finishedUnlisten) {
    finishedUnlisten();
    finishedUnlisten = null;
  }
  isInitialized = false;
  console.log('Timer event listeners cleaned up');
}

// ============================================
// Vanilla Store Access (for overlayBridge)
// ============================================

export const timerStore = useTimerStore;

// ============================================
// Selector Helpers
// ============================================

export const selectTimerStatus = (state: TimerStoreState): TimerStatus => state.status;
export const selectTimerSeconds = (state: TimerStoreState): number => state.seconds;
export const selectIsTimerRunning = (state: TimerStoreState): boolean =>
  state.status === 'running';
export const selectIsTimerFinished = (state: TimerStoreState): boolean =>
  state.status === 'finished';
export const selectIsTimerReady = (state: TimerStoreState): boolean => state.status === 'ready';