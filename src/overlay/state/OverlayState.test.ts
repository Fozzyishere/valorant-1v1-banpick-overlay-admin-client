// OverlayState tests

import { describe, it, expect, beforeEach } from 'vitest';
import { OverlayState } from './OverlayState';
import type { OverlayPayload } from '../types';

describe('OverlayState', () => {
  let state: OverlayState;

  const createInitialPayload = (): OverlayPayload => ({
    currentPhase: 'MAP_PHASE',
    currentPlayer: null,
    actionNumber: 1,
    teamNames: { P1: 'Player 1', P2: 'Player 2' },
    mapsBanned: { P1: [], P2: [] },
    mapsPicked: { P1: null, P2: null },
    deciderMap: null,
    agentsBanned: { P1: [], P2: [] },
    agentPicks: { P1: null, P2: null },
    timerState: 'ready',
    timerSeconds: 30,
    currentActionPending: null,
    revealedActionNumbers: [],
  });

  beforeEach(() => {
    state = new OverlayState();
  });

  describe('initial state', () => {
    it('should have default state values', () => {
      const current = state.getState();
      expect(current.currentPhase).toBe('MAP_PHASE');
      expect(current.actionNumber).toBe(1);
      expect(current.teamNames.P1).toBe('Player 1');
      expect(current.teamNames.P2).toBe('Player 2');
    });

    it('should have empty tracking sets', () => {
      expect(state.getRevealedAssets().size).toBe(0);
      expect(state.getAnimatedAssets().size).toBe(0);
      expect(state.getFailedAssets().size).toBe(0);
    });
  });

  describe('update()', () => {
    it('should update state with partial payload', () => {
      state.update({ teamNames: { P1: 'Team A', P2: 'Team B' } });

      const current = state.getState();
      expect(current.teamNames.P1).toBe('Team A');
      expect(current.teamNames.P2).toBe('Team B');
    });

    it('should detect phase changes', () => {
      const changes = state.update({ currentPhase: 'AGENT_PHASE' });

      expect(changes.phaseChanged).toBe(true);
      expect(changes.previousPhase).toBe('MAP_PHASE');
      expect(changes.newPhase).toBe('AGENT_PHASE');
    });

    it('should not detect phase change when phase is same', () => {
      const changes = state.update({ currentPhase: 'MAP_PHASE' });

      expect(changes.phaseChanged).toBe(false);
      expect(changes.previousPhase).toBe(null);
    });

    it('should detect team name changes', () => {
      const changes = state.update({ teamNames: { P1: 'New Name', P2: 'Player 2' } });

      expect(changes.teamNamesChanged).toBe(true);
    });

    it('should detect timer changes', () => {
      const changes = state.update({ timerSeconds: 15 });

      expect(changes.timerChanged).toBe(true);
    });

    it('should detect asset changes', () => {
      const changes = state.update({
        mapsBanned: { P1: ['ascent'], P2: [] },
      });

      expect(changes.assetsChanged).toBe(true);
    });
  });

  describe('isTournamentAtInitialState()', () => {
    it('should return true for initial state', () => {
      const payload = createInitialPayload();
      expect(state.isTournamentAtInitialState(payload)).toBe(true);
    });

    it('should return false if action number is not 1', () => {
      const payload = createInitialPayload();
      payload.actionNumber = 2;
      expect(state.isTournamentAtInitialState(payload)).toBe(false);
    });

    it('should return false if there are map bans', () => {
      const payload = createInitialPayload();
      payload.mapsBanned.P1 = ['ascent'];
      expect(state.isTournamentAtInitialState(payload)).toBe(false);
    });

    it('should return false if there are map picks', () => {
      const payload = createInitialPayload();
      payload.mapsPicked.P1 = 'bind';
      expect(state.isTournamentAtInitialState(payload)).toBe(false);
    });

    it('should return false if there is a decider', () => {
      const payload = createInitialPayload();
      payload.deciderMap = 'haven';
      expect(state.isTournamentAtInitialState(payload)).toBe(false);
    });

    it('should return false if there are agent picks', () => {
      const payload = createInitialPayload();
      payload.agentPicks.P1 = 'jett';
      expect(state.isTournamentAtInitialState(payload)).toBe(false);
    });
  });

  describe('asset tracking', () => {
    it('should track revealed assets', () => {
      expect(state.isAssetRevealed('test-asset')).toBe(false);

      state.markAssetRevealed('test-asset');

      expect(state.isAssetRevealed('test-asset')).toBe(true);
    });

    it('should track animated assets', () => {
      expect(state.isAssetAnimated('test-asset')).toBe(false);

      state.markAssetAnimated('test-asset');

      expect(state.isAssetAnimated('test-asset')).toBe(true);
    });

    it('should track slot overlay animations', () => {
      expect(state.isSlotOverlayAnimated('test-slot')).toBe(false);

      state.markSlotOverlayAnimated('test-slot');

      expect(state.isSlotOverlayAnimated('test-slot')).toBe(true);
    });
  });

  describe('failed asset tracking', () => {
    it('should track failed assets', () => {
      expect(state.isAssetFailed('test-asset')).toBe(false);

      state.markAssetFailed('test-asset');

      expect(state.isAssetFailed('test-asset')).toBe(true);
    });

    it('should track retry counts', () => {
      expect(state.getRetryCount('test-asset')).toBe(0);

      expect(state.incrementRetryCount('test-asset')).toBe(1);
      expect(state.incrementRetryCount('test-asset')).toBe(2);
      expect(state.getRetryCount('test-asset')).toBe(2);
    });

    it('should clear failed asset state', () => {
      state.markAssetFailed('test-asset');
      state.incrementRetryCount('test-asset');

      state.clearAssetFailed('test-asset');

      expect(state.isAssetFailed('test-asset')).toBe(false);
      expect(state.getRetryCount('test-asset')).toBe(0);
    });
  });

  describe('resetForNewTournament()', () => {
    it('should clear all tracking sets', () => {
      state.markAssetRevealed('asset-1');
      state.markAssetAnimated('asset-2');
      state.markSlotOverlayAnimated('slot-1');
      state.markAssetFailed('asset-3');
      state.incrementRetryCount('asset-3');

      state.resetForNewTournament();

      expect(state.getRevealedAssets().size).toBe(0);
      expect(state.getAnimatedAssets().size).toBe(0);
      expect(state.getAnimatedSlotOverlays().size).toBe(0);
      expect(state.getFailedAssets().size).toBe(0);
      expect(state.getRetryAttempts().size).toBe(0);
    });
  });

  describe('getDiagnostics()', () => {
    it('should return current state diagnostics', () => {
      // First update to a non-initial state (so reset doesn't trigger)
      state.update({
        actionNumber: 5,
        mapsBanned: { P1: ['ascent'], P2: [] },
        currentPhase: 'AGENT_PHASE',
        timerState: 'running',
      });

      // Now add tracking
      state.markAssetRevealed('asset-1');
      state.markAssetFailed('asset-2');

      const diagnostics = state.getDiagnostics();

      expect(diagnostics).toEqual({
        revealedAssets: ['asset-1'],
        animatedAssets: [],
        failedAssets: ['asset-2'],
        retryAttempts: {},
        tournamentPhase: 'AGENT_PHASE',
        timerState: 'running',
      });
    });
  });

  describe('new tournament detection', () => {
    it('should reset state when tournament resets to initial', () => {
      // Set up some state
      state.markAssetRevealed('asset-1');
      state.update({
        actionNumber: 5,
        mapsBanned: { P1: ['ascent'], P2: ['bind'] },
      });

      // Reset to initial state
      state.update({
        actionNumber: 1,
        mapsBanned: { P1: [], P2: [] },
        mapsPicked: { P1: null, P2: null },
        deciderMap: null,
        agentsBanned: { P1: [], P2: [] },
        agentPicks: { P1: null, P2: null },
      });

      // Tracking should be cleared
      expect(state.getRevealedAssets().size).toBe(0);
    });
  });
});
