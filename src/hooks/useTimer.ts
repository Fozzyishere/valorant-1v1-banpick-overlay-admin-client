// useTimer hook - Convenience hook for timer store with derived state

import { useTimerStore } from '../store/timerStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useUIStore } from '../store/uiStore';
import { TimerEngine } from '../core/timer/TimerEngine';

// ============================================
// Timer State Hooks
// ============================================

/**
 * Get timer state
 */
export function useTimerState() {
  return {
    status: useTimerStore((state) => state.status),
    seconds: useTimerStore((state) => state.seconds),
    initialSeconds: useTimerStore((state) => state.initialSeconds),
  };
}

/**
 * Get timer actions
 */
export function useTimerActions() {
  return {
    startTimer: useTimerStore((state) => state.startTimer),
    pauseTimer: useTimerStore((state) => state.pauseTimer),
    resetTimer: useTimerStore((state) => state.resetTimer),
  };
}

// ============================================
// Derived State Hooks
// ============================================

/**
 * Get timer progress as percentage (0-100)
 */
export function useTimerProgress(): number {
  const seconds = useTimerStore((state) => state.seconds);
  const initialSeconds = useTimerStore((state) => state.initialSeconds);

  if (initialSeconds === 0) return 100;
  return ((initialSeconds - seconds) / initialSeconds) * 100;
}

/**
 * Get formatted time display
 */
export function useFormattedTime(): string {
  const snapshot = useTimerStore((state) => state.getSnapshot());
  return TimerEngine.formatTime(snapshot);
}

/**
 * Check timer status helpers
 */
export function useIsTimerRunning(): boolean {
  return useTimerStore((state) => state.status === 'running');
}

export function useIsTimerFinished(): boolean {
  return useTimerStore((state) => state.status === 'finished');
}

export function useIsTimerReady(): boolean {
  return useTimerStore((state) => state.status === 'ready');
}

export function useIsTimerPaused(): boolean {
  return useTimerStore((state) => state.status === 'paused');
}

// ============================================
// Timer Control with Validation
// ============================================

/**
 * Hook for starting timer with tournament validation
 */
export function useValidatedTimerStart() {
  const startTimer = useTimerStore((state) => state.startTimer);
  const clearRevealedAction = useTournamentStore((state) => state.clearRevealedAction);
  const setError = useUIStore((state) => state.setError);

  const validatedStart = () => {
    const tournamentState = useTournamentStore.getState();

    // Block if awaiting manual phase advancement
    if (tournamentState.phaseAdvancePending) {
      setError('Next phase is ready. Click ADVANCE PHASE to continue.');
      return false;
    }

    // Block if event hasn't started
    if (!tournamentState.eventStarted) {
      setError('Event not started. Click START EVENT to begin turn 1.');
      return false;
    }

    // Clear revealed flag for current action (allows re-selection if rewound)
    if (tournamentState.revealedActions.has(tournamentState.actionNumber)) {
      clearRevealedAction(tournamentState.actionNumber);
    }

    startTimer();
    return true;
  };

  return validatedStart;
}

/**
 * Hook for resetting timer and clearing pending selection
 */
export function useTimerReset() {
  const resetTimer = useTimerStore((state) => state.resetTimer);
  const setPendingSelection = useTournamentStore((state) => state.setPendingSelection);

  const resetWithClear = (seconds?: number) => {
    // Clear pending selection when timer resets
    setPendingSelection(null);
    resetTimer(seconds);
  };

  return resetWithClear;
}
