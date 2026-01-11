// useTournament hook - Convenience hook combining tournament store with selectors

import { useTournamentStore } from '../store/tournamentStore';
import { useTimerStore } from '../store/timerStore';
import { useUIStore } from '../store/uiStore';
import {
  getTurnInfo,
  getAvailableAssets,
  getPhaseProgress,
  isMapPhase,
  isAgentPhase,
  canSelectAsset,
} from '../core/tournament/selectors';
import { TournamentEngine } from '../core/tournament/TournamentEngine';
import type { TurnInfo, AssetAvailability, PhaseProgress } from '../core/tournament/types';

// ============================================
// Derived State Hooks
// ============================================

/**
 * Get current turn information
 */
export function useTurnInfo(): TurnInfo | null {
  const actionNumber = useTournamentStore((state) => state.actionNumber);
  const firstPlayer = useTournamentStore((state) => state.firstPlayer);
  const eventStarted = useTournamentStore((state) => state.eventStarted);

  if (!eventStarted || actionNumber < 1 || actionNumber > 17) {
    return null;
  }

  return getTurnInfo(actionNumber, firstPlayer);
}

/**
 * Get available assets for current turn
 */
export function useAvailableAssets(): AssetAvailability {
  const snapshot = useTournamentStore((state) => state.getSnapshot());
  return getAvailableAssets(snapshot);
}

/**
 * Get phase progress information
 */
export function usePhaseProgress(): PhaseProgress {
  const snapshot = useTournamentStore((state) => state.getSnapshot());
  return getPhaseProgress(snapshot);
}

/**
 * Check if current phase is map phase
 */
export function useIsMapPhase(): boolean {
  const actionNumber = useTournamentStore((state) => state.actionNumber);
  return isMapPhase(actionNumber);
}

/**
 * Check if current phase is agent phase
 */
export function useIsAgentPhase(): boolean {
  const actionNumber = useTournamentStore((state) => state.actionNumber);
  return isAgentPhase(actionNumber);
}

// ============================================
// Selection Flow Hooks
// ============================================

/**
 * Hook for attempting asset selection with proper validation
 * Combines timer and tournament state for selection gating
 */
export function useAttemptSelection() {
  const tournamentStore = useTournamentStore();
  const timerStatus = useTimerStore((state) => state.status);
  const setError = useUIStore((state) => state.setError);

  const attemptSelection = (assetName: string) => {
    const tournamentState = tournamentStore.getSnapshot();

    // Pre-timer validation
    const canAttempt = TournamentEngine.canAttemptSelection(tournamentState);
    if (!canAttempt.valid) {
      setError(canAttempt.error ?? 'Cannot make selection');
      return false;
    }

    // Timer must have started
    if (timerStatus === 'ready') {
      setError('Start the timer before selecting a result for this turn.');
      return false;
    }

    // Validate asset can be selected
    const validation = canSelectAsset(tournamentState, assetName);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid selection');
      return false;
    }

    // If timer finished, select immediately
    if (timerStatus === 'finished') {
      tournamentStore.selectAsset(assetName);
      return true;
    }

    // If timer running/paused, set as pending
    if (timerStatus === 'running' || timerStatus === 'paused') {
      tournamentStore.setPendingSelection(assetName);
      return true;
    }

    return false;
  };

  return attemptSelection;
}

// ============================================
// Combined State Hooks
// ============================================

/**
 * Get all tournament actions for component use
 */
export function useTournamentActions() {
  return {
    startEvent: useTournamentStore((state) => state.startEvent),
    resetTournament: useTournamentStore((state) => state.resetTournament),
    setFirstPlayer: useTournamentStore((state) => state.setFirstPlayer),
    setPlayerName: useTournamentStore((state) => state.setPlayerName),
    autoAdvanceTurn: useTournamentStore((state) => state.autoAdvanceTurn),
    advancePhase: useTournamentStore((state) => state.advancePhase),
    resetTurn: useTournamentStore((state) => state.resetTurn),
    selectAsset: useTournamentStore((state) => state.selectAsset),
    setPendingSelection: useTournamentStore((state) => state.setPendingSelection),
    undoLastAction: useTournamentStore((state) => state.undoLastAction),
    setError: useTournamentStore((state) => state.setError),
  };
}

/**
 * Get essential tournament state for components
 */
export function useTournamentState() {
  return {
    currentPhase: useTournamentStore((state) => state.currentPhase),
    currentPlayer: useTournamentStore((state) => state.currentPlayer),
    actionNumber: useTournamentStore((state) => state.actionNumber),
    firstPlayer: useTournamentStore((state) => state.firstPlayer),
    eventStarted: useTournamentStore((state) => state.eventStarted),
    phaseAdvancePending: useTournamentStore((state) => state.phaseAdvancePending),
    teamNames: useTournamentStore((state) => state.teamNames),
    pendingSelection: useTournamentStore((state) => state.pendingSelection),
    revealedActions: useTournamentStore((state) => state.revealedActions),
    lastError: useTournamentStore((state) => state.lastError),
  };
}

/**
 * Get tournament data (bans, picks, etc.)
 */
export function useTournamentData() {
  return {
    mapsBanned: useTournamentStore((state) => state.mapsBanned),
    mapsPicked: useTournamentStore((state) => state.mapsPicked),
    deciderMap: useTournamentStore((state) => state.deciderMap),
    agentsBanned: useTournamentStore((state) => state.agentsBanned),
    agentPicks: useTournamentStore((state) => state.agentPicks),
    actionHistory: useTournamentStore((state) => state.actionHistory),
  };
}
