// Tournament Store - Single responsibility: tournament state management
// Delegates pure logic to TournamentEngine

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { TournamentEngine } from '../core/tournament/TournamentEngine';
import type { TournamentState, Player } from '../core/tournament/types';

// ============================================
// Store State & Actions Interface
// ============================================

export interface TournamentStoreState extends TournamentState {
  // Actions - Tournament lifecycle
  startEvent: () => void;
  resetTournament: () => void;

  // Actions - Player setup
  setFirstPlayer: (player: Player) => void;
  setPlayerName: (player: Player, name: string) => void;

  // Actions - Turn/Phase management
  autoAdvanceTurn: () => void;
  advancePhase: () => void;
  resetTurn: () => void;

  // Actions - Asset selection
  selectAsset: (assetName: string) => void;
  setPendingSelection: (assetName: string | null) => void;
  clearRevealedAction: (actionNumber: number) => void;

  // Actions - History
  undoLastAction: () => void;

  // Actions - Error handling
  setError: (error: string | null) => void;

  // Utility - Get raw state for bridge
  getSnapshot: () => TournamentState;
}

// ============================================
// Store Implementation
// ============================================

export const useTournamentStore = create<TournamentStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initialize with TournamentEngine's default state
    ...TournamentEngine.createInitialState(),

    // ----------------------------------------
    // Tournament Lifecycle
    // ----------------------------------------

    startEvent: () => {
      set((state) => TournamentEngine.startEvent(state));
    },

    resetTournament: () => {
      set((state) => TournamentEngine.resetTournament(state));
    },

    // ----------------------------------------
    // Player Setup
    // ----------------------------------------

    setFirstPlayer: (player: Player) => {
      set((state) => TournamentEngine.setFirstPlayer(state, player));
    },

    setPlayerName: (player: Player, name: string) => {
      set((state) => TournamentEngine.setPlayerName(state, player, name));
    },

    // ----------------------------------------
    // Turn/Phase Management
    // ----------------------------------------

    autoAdvanceTurn: () => {
      set((state) => TournamentEngine.autoAdvanceTurn(state));
    },

    advancePhase: () => {
      set((state) => TournamentEngine.advancePhase(state));
    },

    resetTurn: () => {
      set((state) => TournamentEngine.resetTurn(state));
    },

    // ----------------------------------------
    // Asset Selection
    // ----------------------------------------

    selectAsset: (assetName: string) => {
      set((state) => TournamentEngine.selectAsset(state, assetName));
    },

    setPendingSelection: (assetName: string | null) => {
      set((state) => TournamentEngine.setPendingSelection(state, assetName));
    },

    clearRevealedAction: (actionNumber: number) => {
      set((state) => TournamentEngine.clearRevealedAction(state, actionNumber));
    },

    // ----------------------------------------
    // History
    // ----------------------------------------

    undoLastAction: () => {
      set((state) => TournamentEngine.undoLastAction(state));
    },

    // ----------------------------------------
    // Error Handling
    // ----------------------------------------

    setError: (error: string | null) => {
      set((state) => TournamentEngine.setError(state, error));
    },

    // ----------------------------------------
    // Utility
    // ----------------------------------------

    getSnapshot: (): TournamentState => {
      const state = get();
      // Return only TournamentState fields (exclude actions)
      return {
        currentPhase: state.currentPhase,
        currentPlayer: state.currentPlayer,
        actionNumber: state.actionNumber,
        firstPlayer: state.firstPlayer,
        eventStarted: state.eventStarted,
        phaseAdvancePending: state.phaseAdvancePending,
        teamNames: state.teamNames,
        mapsBanned: state.mapsBanned,
        mapsPicked: state.mapsPicked,
        deciderMap: state.deciderMap,
        agentsBanned: state.agentsBanned,
        agentPicks: state.agentPicks,
        pendingSelection: state.pendingSelection,
        revealedActions: state.revealedActions,
        actionHistory: state.actionHistory,
        lastError: state.lastError,
      };
    },
  }))
);

// ============================================
// Vanilla Store Access (for overlayBridge)
// ============================================

export const tournamentStore = useTournamentStore;
