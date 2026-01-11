// Tournament Store Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from './tournamentStore';

describe('tournamentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTournamentStore.setState(useTournamentStore.getInitialState());
  });

  describe('initial state', () => {
    it('should have correct initial phase', () => {
      const state = useTournamentStore.getState();
      expect(state.currentPhase).toBe('MAP_PHASE');
    });

    it('should not have event started', () => {
      const state = useTournamentStore.getState();
      expect(state.eventStarted).toBe(false);
    });

    it('should have default team names', () => {
      const state = useTournamentStore.getState();
      expect(state.teamNames.P1).toBe('Player 1');
      expect(state.teamNames.P2).toBe('Player 2');
    });

    it('should have empty tournament data', () => {
      const state = useTournamentStore.getState();
      expect(state.mapsBanned).toHaveLength(0);
      expect(state.mapsPicked).toHaveLength(0);
      expect(state.agentsBanned).toHaveLength(0);
      expect(state.deciderMap).toBeNull();
    });
  });

  describe('player setup', () => {
    it('should set first player', () => {
      useTournamentStore.getState().setFirstPlayer('P2');
      const state = useTournamentStore.getState();
      expect(state.firstPlayer).toBe('P2');
    });

    it('should set player name', () => {
      useTournamentStore.getState().setPlayerName('P1', 'Team Alpha');
      const state = useTournamentStore.getState();
      expect(state.teamNames.P1).toBe('Team Alpha');
    });
  });

  describe('event lifecycle', () => {
    it('should start event correctly', () => {
      useTournamentStore.getState().startEvent();
      const state = useTournamentStore.getState();

      expect(state.eventStarted).toBe(true);
      expect(state.actionNumber).toBe(1);
      expect(state.currentPlayer).toBe('P1');
      expect(state.currentPhase).toBe('MAP_PHASE');
    });

    it('should respect first player setting when starting event', () => {
      useTournamentStore.getState().setFirstPlayer('P2');
      useTournamentStore.getState().startEvent();
      const state = useTournamentStore.getState();

      expect(state.currentPlayer).toBe('P2');
    });

    it('should reset tournament correctly', () => {
      // Start and make some changes
      useTournamentStore.getState().startEvent();
      useTournamentStore.getState().setPlayerName('P1', 'Modified');

      // Reset
      useTournamentStore.getState().resetTournament();
      const state = useTournamentStore.getState();

      expect(state.eventStarted).toBe(false);
      expect(state.actionNumber).toBe(1);
      expect(state.mapsBanned).toHaveLength(0);
      // Team name should be preserved
      expect(state.teamNames.P1).toBe('Modified');
    });
  });

  describe('asset selection', () => {
    beforeEach(() => {
      useTournamentStore.getState().startEvent();
    });

    it('should select map for banning', () => {
      useTournamentStore.getState().selectAsset('ascent');
      const state = useTournamentStore.getState();

      expect(state.mapsBanned).toHaveLength(1);
      expect(state.mapsBanned[0]).toEqual({ name: 'ascent', player: 'P1' });
    });

    it('should mark action as revealed after selection', () => {
      useTournamentStore.getState().selectAsset('ascent');
      const state = useTournamentStore.getState();

      expect(state.revealedActions.has(1)).toBe(true);
    });

    it('should add action to history', () => {
      useTournamentStore.getState().selectAsset('ascent');
      const state = useTournamentStore.getState();

      expect(state.actionHistory).toHaveLength(1);
      expect(state.actionHistory[0].selection).toBe('ascent');
      expect(state.actionHistory[0].actionType).toBe('MAP_BAN');
    });

    it('should prevent duplicate selection for same turn', () => {
      useTournamentStore.getState().selectAsset('ascent');
      useTournamentStore.getState().selectAsset('bind');
      const state = useTournamentStore.getState();

      // Should still only have one selection
      expect(state.mapsBanned).toHaveLength(1);
      expect(state.lastError).toContain('already confirmed');
    });
  });

  describe('turn advancement', () => {
    beforeEach(() => {
      useTournamentStore.getState().startEvent();
      useTournamentStore.getState().selectAsset('ascent');
    });

    it('should auto-advance to next turn', () => {
      useTournamentStore.getState().autoAdvanceTurn();
      const state = useTournamentStore.getState();

      expect(state.actionNumber).toBe(2);
      expect(state.currentPlayer).toBe('P2');
    });

    it('should gate phase transition', () => {
      // beforeEach already did: startEvent() and selectAsset('ascent') for action 1
      // So action 1 is already complete, we need to advance and continue from action 2

      // First, auto-advance from action 1 (already done in beforeEach)
      useTournamentStore.getState().autoAdvanceTurn();
      expect(useTournamentStore.getState().actionNumber).toBe(2);

      // Maps for remaining actions: 2-6 are bans, 7-8 are picks, 9 is decider
      const mapBans = ['bind', 'haven', 'split', 'icebox', 'breeze']; // Actions 2-6 (5 more bans)
      const mapPicks = ['sunset', 'pearl']; // Actions 7-8

      // Complete map bans (actions 2-6)
      for (const map of mapBans) {
        useTournamentStore.getState().selectAsset(map);
        useTournamentStore.getState().autoAdvanceTurn();
      }
      expect(useTournamentStore.getState().actionNumber).toBe(7);

      // Complete map picks (actions 7-8)
      for (const map of mapPicks) {
        useTournamentStore.getState().selectAsset(map);
        useTournamentStore.getState().autoAdvanceTurn();
      }
      expect(useTournamentStore.getState().actionNumber).toBe(9);

      // Action 9 is DECIDER - must select from picked maps
      useTournamentStore.getState().selectAsset('sunset'); // One of the picked maps
      useTournamentStore.getState().autoAdvanceTurn();

      // After action 9 completes and auto-advances, should have phase advance pending
      const state = useTournamentStore.getState();
      expect(state.phaseAdvancePending).toBe('AGENT_PHASE');
    });
  });

  describe('undo functionality', () => {
    beforeEach(() => {
      useTournamentStore.getState().startEvent();
      useTournamentStore.getState().selectAsset('ascent');
    });

    it('should undo last action', () => {
      useTournamentStore.getState().undoLastAction();
      const state = useTournamentStore.getState();

      expect(state.mapsBanned).toHaveLength(0);
      expect(state.actionHistory).toHaveLength(0);
    });

    it('should show error when nothing to undo', () => {
      useTournamentStore.getState().undoLastAction();
      useTournamentStore.getState().undoLastAction();
      const state = useTournamentStore.getState();

      expect(state.lastError).toContain('No actions to undo');
    });
  });

  describe('reset turn', () => {
    beforeEach(() => {
      useTournamentStore.getState().startEvent();
      useTournamentStore.getState().selectAsset('ascent');
    });

    it('should reset current turn', () => {
      useTournamentStore.getState().resetTurn();
      const state = useTournamentStore.getState();

      expect(state.mapsBanned).toHaveLength(0);
      expect(state.pendingSelection).toBeNull();
      expect(state.revealedActions.has(1)).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('should return state without actions', () => {
      const snapshot = useTournamentStore.getState().getSnapshot();

      expect(snapshot).toHaveProperty('currentPhase');
      expect(snapshot).toHaveProperty('teamNames');
      expect(snapshot).not.toHaveProperty('startEvent');
      expect(snapshot).not.toHaveProperty('selectAsset');
    });
  });
});
