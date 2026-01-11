import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Prevent side effects from bridge initialization during these unit tests.
vi.mock('./overlayBridge', () => ({
  initializeBridge: () => {},
  forceEmit: () => {},
}));

import { useTimerStore } from '../store/timerStore';
import { useTournamentStore } from './adminStore';

describe('adminStore facade timer sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset tournament between tests for isolation
    useTournamentStore.getState().resetTournament();
    // Ensure a known starting point for the timer
    useTimerStore.getState().resetTimer(3);
  });

  afterEach(() => {
    // Clean up any running intervals
    useTimerStore.getState().resetTimer(3);
    useTournamentStore.getState().resetTournament();
    vi.useRealTimers();
  });

  it('updates facade timerSeconds as the timer store ticks', () => {
    const initial = useTournamentStore.getState().timerSeconds;
    expect(initial).toBe(3);

    // Start the timer via the timer store (not through the facade)
    useTimerStore.getState().startTimer();

    vi.advanceTimersByTime(1000);
    expect(useTournamentStore.getState().timerSeconds).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(useTournamentStore.getState().timerSeconds).toBe(1);
  });

  it('does not auto-advance when timer is finished but selection is rejected', () => {
    // Start event so selections are allowed (engine validates eventStarted/currentPlayer)
    useTournamentStore.getState().startEvent();

    // Finish the timer first
    useTimerStore.getState().resetTimer(1);
    useTimerStore.getState().startTimer();
    vi.advanceTimersByTime(1000);
    vi.runOnlyPendingTimers(); // run timer-finished callback
    expect(useTimerStore.getState().status).toBe('finished');

    const actionBefore = useTournamentStore.getState().actionNumber;
    expect(actionBefore).toBe(1);

    // Attempt an invalid selection; engine should reject and NOT mark revealedActions
    useTournamentStore.getState().selectAsset('not-a-real-asset');

    // Flush any scheduled auto-advance tasks (setTimeout(0))
    vi.runOnlyPendingTimers();

    const stateAfter = useTournamentStore.getState();
    expect(stateAfter.actionNumber).toBe(1);
    expect(stateAfter.revealedActions.has(1)).toBe(false);
    expect(stateAfter.lastError).toBeTruthy();
  });
});
