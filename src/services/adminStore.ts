// Zustand store for OBS Admin Client - Tournament Management
//
// ============================================
// BACKWARD COMPATIBILITY FACADE
// ============================================
//
// This file now serves as a facade for backward compatibility.
// The actual store implementation has been split into:
//   - src/store/tournamentStore.ts (tournament state)
//   - src/store/timerStore.ts (timer state)
//   - src/store/uiStore.ts (UI state)
//   - src/services/overlayBridge.ts (overlay communication)
//
// New code should import from:
//   - import { useTournamentStore } from '../store/tournamentStore'
//   - import { useTimerStore } from '../store/timerStore'
//   - import { useUIStore } from '../store/uiStore'
//
// Or use the convenience hooks:
//   - import { useTournamentState, useTimerState } from '../hooks'
// ============================================

import { create } from 'zustand';
import type { TournamentStore, Player } from '../types/admin.types';

// Import from new stores
import { useTournamentStore as useNewTournamentStore } from '../store/tournamentStore';
import { useTimerStore } from '../store/timerStore';
import { initializeBridge, forceEmit } from './overlayBridge';

// ============================================
// Auto-advance de-dupe guard
// ============================================
// When the timer finishes, both `selectAsset()` and the timer-finished callback can attempt to
// auto-advance the turn. We guard against double-advancing by scheduling at most one advance
// per action number, and skipping if the action already changed by the time the task runs.
let autoAdvanceScheduledForAction: number | null = null;
let autoAdvanceTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleAutoAdvanceOnceForCurrentAction() {
  const scheduledAction = useNewTournamentStore.getState().actionNumber;

  // Already scheduled for this action; do nothing.
  if (autoAdvanceScheduledForAction === scheduledAction && autoAdvanceTimeout) return;

  // Cancel any prior pending advance (stale action).
  if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout);

  autoAdvanceScheduledForAction = scheduledAction;
  autoAdvanceTimeout = setTimeout(() => {
    const currentAction = useNewTournamentStore.getState().actionNumber;

    // If the turn already advanced via some other path, do not advance again.
    if (currentAction !== scheduledAction) {
      autoAdvanceScheduledForAction = null;
      autoAdvanceTimeout = null;
      return;
    }

    autoAdvanceScheduledForAction = null;
    autoAdvanceTimeout = null;
    useTournamentStore.getState().autoAdvanceTurn();
  }, 0);
}

// ============================================
// Facade store subscriptions (keep facade in sync)
// ============================================
// The facade store only updates when `set(syncFromNewStores())` is called.
// Without subscriptions, timer ticks update `useTimerStore` but *not* the facade,
// making consumers of `useTournamentStore()` (facade) appear frozen.
let facadeSubscriptionsInitialized = false;
let unsubscribeFacadeTimer: (() => void) | null = null;
let unsubscribeFacadeTournament: (() => void) | null = null;
function destroyFacadeSubscriptions() {
  if (unsubscribeFacadeTimer) {
    unsubscribeFacadeTimer();
    unsubscribeFacadeTimer = null;
  }
  if (unsubscribeFacadeTournament) {
    unsubscribeFacadeTournament();
    unsubscribeFacadeTournament = null;
  }
  facadeSubscriptionsInitialized = false;
}

function ensureFacadeSubscriptionsInitialized(
  set: (
    partial: Partial<TournamentStore> | ((state: TournamentStore) => Partial<TournamentStore>)
  ) => void,
  syncFromNewStores: () => Omit<
    TournamentStore,
    keyof import('../types/admin.types').TournamentActions
  >
) {
  if (facadeSubscriptionsInitialized) return;

  // Sync on any timer changes that affect what the facade exposes.
  unsubscribeFacadeTimer = useTimerStore.subscribe(
    (state) => [state.status, state.seconds] as const,
    () => set(syncFromNewStores())
  );

  // Sync on tournament changes too (in case something updates the split store directly).
  unsubscribeFacadeTournament = useNewTournamentStore.subscribe(
    (state) =>
      [
        state.currentPhase,
        state.currentPlayer,
        state.actionNumber,
        state.firstPlayer,
        state.eventStarted,
        state.phaseAdvancePending,
        state.teamNames,
        state.mapsBanned,
        state.mapsPicked,
        state.deciderMap,
        state.agentsBanned,
        state.agentPicks,
        state.pendingSelection,
        state.revealedActions,
        state.actionHistory,
        state.lastError,
      ] as const,
    () => set(syncFromNewStores())
  );

  facadeSubscriptionsInitialized = true;
}

// Cleanup subscriptions during Vite HMR to avoid duplicate subscriptions.
// (No-op in production builds.)
(import.meta as any)?.hot?.dispose?.(() => {
  destroyFacadeSubscriptions();
});

// Initialize overlay bridge on module load
let bridgeInitialized = false;
function ensureBridgeInitialized() {
  if (!bridgeInitialized && typeof window !== 'undefined') {
    initializeBridge();
    bridgeInitialized = true;
  }
}

// ============================================
// FACADE STORE
// ============================================
// This store combines the new split stores into the old interface
// for backward compatibility with existing components.

export const useTournamentStore = create<TournamentStore>((set, get) => {
  // Ensure bridge is initialized
  ensureBridgeInitialized();

  // Subscribe to new stores and sync state
  const syncFromNewStores = (): Omit<
    TournamentStore,
    keyof import('../types/admin.types').TournamentActions
  > => {
    const tournamentState = useNewTournamentStore.getState();
    const timerState = useTimerStore.getState();

    return {
      // Tournament state
      currentPhase: tournamentState.currentPhase,
      currentPlayer: tournamentState.currentPlayer,
      actionNumber: tournamentState.actionNumber,
      firstPlayer: tournamentState.firstPlayer,
      eventStarted: tournamentState.eventStarted,
      phaseAdvancePending: tournamentState.phaseAdvancePending,
      teamNames: tournamentState.teamNames,
      mapsBanned: tournamentState.mapsBanned,
      mapsPicked: tournamentState.mapsPicked,
      deciderMap: tournamentState.deciderMap,
      agentsBanned: tournamentState.agentsBanned,
      agentPicks: tournamentState.agentPicks,
      pendingSelection: tournamentState.pendingSelection,
      revealedActions: tournamentState.revealedActions,
      actionHistory: tournamentState.actionHistory,
      lastError: tournamentState.lastError,

      // Timer state
      timerState: timerState.status,
      timerSeconds: timerState.seconds,

      // UI state
      isInitialized: true,
    };
  };

  // Initial state from new stores
  const initialState = syncFromNewStores();

  // Keep facade in sync with underlying stores (timer ticks, direct store updates, etc.)
  ensureFacadeSubscriptionsInitialized(set, syncFromNewStores);

  return {
    ...initialState,

    // ----------------------------------------
    // Player Setup Actions (delegate to new store)
    // ----------------------------------------

    setFirstPlayer: (player: Player) => {
      useNewTournamentStore.getState().setFirstPlayer(player);
      set(syncFromNewStores());
    },

    setPlayerName: (player: Player, name: string) => {
      useNewTournamentStore.getState().setPlayerName(player, name);
      set(syncFromNewStores());
      forceEmit();
    },

    // ----------------------------------------
    // Turn Control Actions
    // ----------------------------------------

    nextTurn: () => {
      // Deprecated: explicit NEXT turn navigation removed
    },

    prevTurn: () => {
      // Deprecated: explicit PREV turn navigation removed
    },

    autoAdvanceTurn: () => {
      useNewTournamentStore.getState().autoAdvanceTurn();
      useTimerStore.getState().resetTimer();
      set(syncFromNewStores());
    },

    advancePhase: () => {
      useNewTournamentStore.getState().advancePhase();
      useTimerStore.getState().resetTimer();
      set(syncFromNewStores());
    },

    startEvent: () => {
      useNewTournamentStore.getState().startEvent();
      useTimerStore.getState().resetTimer();
      set(syncFromNewStores());
      forceEmit();
    },

    resetTurn: () => {
      useNewTournamentStore.getState().resetTurn();
      useTimerStore.getState().resetTimer();
      set(syncFromNewStores());
      forceEmit();
    },

    // ----------------------------------------
    // Asset Selection Actions
    // ----------------------------------------

    selectAsset: (assetName: string) => {
      const before = useNewTournamentStore.getState();
      const actionNumberBefore = before.actionNumber;

      useNewTournamentStore.getState().selectAsset(assetName);

      const after = useNewTournamentStore.getState();
      set(syncFromNewStores());
      forceEmit();

      // If the timer already finished, only auto-advance when the selection actually succeeded.
      // Success is represented by the current action being marked revealed.
      const timerState = useTimerStore.getState();
      const selectionWasRevealed =
        after.actionNumber === actionNumberBefore && after.revealedActions.has(actionNumberBefore);
      if (timerState.status === 'finished' && selectionWasRevealed) {
        scheduleAutoAdvanceOnceForCurrentAction();
      }
    },

    attemptSelection: (assetName: string) => {
      const tournamentState = useNewTournamentStore.getState();
      const timerState = useTimerStore.getState();

      // Phase advance pending blocks further selections
      if (tournamentState.phaseAdvancePending) {
        useNewTournamentStore
          .getState()
          .setError('Next phase is ready. Click ADVANCE PHASE to continue.');
        set(syncFromNewStores());
        return;
      }

      // Event must be started
      if (!tournamentState.eventStarted) {
        useNewTournamentStore
          .getState()
          .setError('Event not started. Click START EVENT to begin turn 1.');
        set(syncFromNewStores());
        return;
      }

      // Timer must have started
      if (timerState.status === 'ready') {
        useNewTournamentStore
          .getState()
          .setError('Start the timer before selecting a result for this turn.');
        set(syncFromNewStores());
        return;
      }

      // Pending cannot be changed unless reset
      if (tournamentState.pendingSelection) {
        useNewTournamentStore
          .getState()
          .setError('A selection is already pending. Reset the turn to change it.');
        set(syncFromNewStores());
        return;
      }

      // If timer finished, select immediately
      if (timerState.status === 'finished') {
        get().selectAsset(assetName);
        return;
      }

      // If timer running/paused, set as pending
      if (timerState.status === 'running' || timerState.status === 'paused') {
        useNewTournamentStore.getState().setPendingSelection(assetName);
        set(syncFromNewStores());
        forceEmit();
      }
    },

    selectAssetPending: (assetName: string) => {
      useNewTournamentStore.getState().setPendingSelection(assetName);
      set(syncFromNewStores());
    },

    revealPendingSelection: () => {
      const pendingSelection = useNewTournamentStore.getState().pendingSelection;
      if (!pendingSelection) {
        useNewTournamentStore.getState().setError('No pending selection to reveal');
        set(syncFromNewStores());
        return;
      }
      get().selectAsset(pendingSelection);
    },

    manualReveal: (_assetName: string) => {
      // Deprecated in T7; no-op
    },

    // ----------------------------------------
    // Timer Controls (delegate to timer store)
    // ----------------------------------------

    startTimer: () => {
      const tournamentState = useNewTournamentStore.getState();

      // Block if awaiting manual phase advancement
      if (tournamentState.phaseAdvancePending) {
        useNewTournamentStore
          .getState()
          .setError('Next phase is ready. Click ADVANCE PHASE to continue.');
        set(syncFromNewStores());
        return;
      }

      // Block if event hasn't started
      if (!tournamentState.eventStarted) {
        useNewTournamentStore
          .getState()
          .setError('Event not started. Click START EVENT to begin turn 1.');
        set(syncFromNewStores());
        return;
      }

      // Clear revealed flag for current action if re-starting
      if (tournamentState.revealedActions.has(tournamentState.actionNumber)) {
        useNewTournamentStore.getState().clearRevealedAction(tournamentState.actionNumber);
      }

      useTimerStore.getState().startTimer();
      set(syncFromNewStores());
      forceEmit();
    },

    pauseTimer: () => {
      useTimerStore.getState().pauseTimer();
      set(syncFromNewStores());
      forceEmit();
    },

    resetTimer: () => {
      useTimerStore.getState().resetTimer();
      useNewTournamentStore.getState().setPendingSelection(null);
      set(syncFromNewStores());
      forceEmit();
    },

    // ----------------------------------------
    // Tournament Management
    // ----------------------------------------

    resetTournament: () => {
      useTimerStore.getState().resetTimer();
      useNewTournamentStore.getState().resetTournament();
      set(syncFromNewStores());
      forceEmit();
    },

    undoLastAction: () => {
      useNewTournamentStore.getState().undoLastAction();
      set(syncFromNewStores());
    },

    // ----------------------------------------
    // Error Handling
    // ----------------------------------------

    setError: (error: string | null) => {
      useNewTournamentStore.getState().setError(error);
      set(syncFromNewStores());
    },
  };
});

// ============================================
// Setup timer coordination for auto-advance
// ============================================
// When timer finishes, reveal pending selection and auto-advance

if (typeof window !== 'undefined') {
  useTimerStore.getState().setOnTimerFinished(() => {
    const tournamentState = useNewTournamentStore.getState();

    // If there's a pending selection, reveal it
    if (tournamentState.pendingSelection) {
      useTournamentStore.getState().selectAsset(tournamentState.pendingSelection);
    }

    // If selection is already revealed for this action, auto-advance
    const currentState = useNewTournamentStore.getState();
    if (currentState.revealedActions.has(currentState.actionNumber)) {
      scheduleAutoAdvanceOnceForCurrentAction();
    }
  });
}
