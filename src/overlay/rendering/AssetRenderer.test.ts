// AssetRenderer tests (pure calculation functions)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetRenderer } from './AssetRenderer';
import type { OverlayPayload } from '../types';

// Mock overlayState
vi.mock('../state', () => ({
  overlayState: {
    isAssetRevealed: vi.fn(() => false),
    markAssetRevealed: vi.fn(),
    isAssetAnimated: vi.fn(() => false),
    markAssetAnimated: vi.fn(),
    isAssetFailed: vi.fn(() => false),
    markAssetFailed: vi.fn(),
    clearAssetFailed: vi.fn(),
    getRetryCount: vi.fn(() => 0),
    incrementRetryCount: vi.fn(() => 1),
  },
}));

// Mock utils
vi.mock('../utils/domHelpers', () => ({
  getElementById: vi.fn(() => null),
  setCssProperties: vi.fn(),
}));

describe('AssetRenderer', () => {
  let renderer: AssetRenderer;

  const createPayload = (overrides: Partial<OverlayPayload> = {}): OverlayPayload => ({
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
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    renderer = new AssetRenderer('asset-container');
  });

  describe('calculatePositionedAssets()', () => {
    describe('MAP_PHASE', () => {
      it('should return empty array when no selections', () => {
        const payload = createPayload();
        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(0);
      });

      it('should include P1 map bans', () => {
        const payload = createPayload({
          mapsBanned: { P1: ['ascent', 'bind'], P2: [] },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(2);
        expect(assets[0].id).toBe('p1-map-ban-1');
        expect(assets[0].asset).toBe('ascent');
        expect(assets[0].player).toBe('P1');
        expect(assets[0].type).toBe('map');
        expect(assets[1].id).toBe('p1-map-ban-2');
        expect(assets[1].asset).toBe('bind');
      });

      it('should include P2 map bans', () => {
        const payload = createPayload({
          mapsBanned: { P1: [], P2: ['haven', 'lotus'] },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(2);
        expect(assets[0].id).toBe('p2-map-ban-1');
        expect(assets[0].asset).toBe('haven');
        expect(assets[0].player).toBe('P2');
      });

      it('should include map picks', () => {
        const payload = createPayload({
          mapsPicked: { P1: 'split', P2: 'pearl' },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(2);
        expect(assets.find((a) => a.id === 'p1-map-pick')?.asset).toBe('split');
        expect(assets.find((a) => a.id === 'p2-map-pick')?.asset).toBe('pearl');
      });

      it('should include decider map', () => {
        const payload = createPayload({
          deciderMap: 'icebox',
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        const decider = assets.find((a) => a.id === 'decider-map');
        expect(decider).toBeDefined();
        expect(decider?.asset).toBe('icebox');
        expect(decider?.player).toBe('shared');
        expect(decider?.slot).toBe('decider');
      });
    });

    describe('AGENT_PHASE', () => {
      it('should include agent bans', () => {
        const payload = createPayload({
          currentPhase: 'AGENT_PHASE',
          agentsBanned: { P1: ['jett', 'reyna'], P2: ['sage'] },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(3);
        expect(assets.find((a) => a.id === 'p1-agent-ban-1')?.asset).toBe('jett');
        expect(assets.find((a) => a.id === 'p1-agent-ban-2')?.asset).toBe('reyna');
        expect(assets.find((a) => a.id === 'p2-agent-ban-1')?.asset).toBe('sage');
      });

      it('should include agent picks as banners', () => {
        const payload = createPayload({
          currentPhase: 'AGENT_PHASE',
          agentPicks: { P1: 'chamber', P2: 'omen' },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(2);
        const p1Pick = assets.find((a) => a.id === 'p1-agent-pick');
        expect(p1Pick?.type).toBe('agent-banner');
        expect(p1Pick?.asset).toBe('chamber');
      });

      it('should not include map assets in agent phase', () => {
        const payload = createPayload({
          currentPhase: 'AGENT_PHASE',
          mapsBanned: { P1: ['ascent'], P2: [] },
          mapsPicked: { P1: 'bind', P2: null },
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets).toHaveLength(0);
      });
    });

    describe('CONCLUSION', () => {
      it('should include both map and agent assets', () => {
        const payload = createPayload({
          currentPhase: 'CONCLUSION',
          mapsBanned: { P1: ['ascent'], P2: ['bind'] },
          mapsPicked: { P1: 'haven', P2: 'lotus' },
          deciderMap: 'split',
          agentsBanned: { P1: ['jett'], P2: ['sage'] },
          agentPicks: { P1: 'chamber', P2: 'omen' },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        // 2 map bans + 2 map picks + 1 decider + 2 agent bans + 2 agent picks = 9
        expect(assets).toHaveLength(9);
      });
    });

    describe('reveal logic', () => {
      it('should reveal assets when timer is finished', () => {
        const payload = createPayload({
          mapsBanned: { P1: ['ascent'], P2: [] },
          timerState: 'finished',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets[0].revealed).toBe(true);
      });

      it('should reveal assets in CONCLUSION phase regardless of timer', () => {
        const payload = createPayload({
          currentPhase: 'CONCLUSION',
          mapsBanned: { P1: ['ascent'], P2: [] },
          timerState: 'ready',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets[0].revealed).toBe(true);
      });

      it('should not reveal assets when timer is running', () => {
        const payload = createPayload({
          mapsBanned: { P1: ['ascent'], P2: [] },
          timerState: 'running',
        });

        const assets = renderer.calculatePositionedAssets(payload);

        expect(assets[0].revealed).toBe(false);
      });
    });
  });
});
