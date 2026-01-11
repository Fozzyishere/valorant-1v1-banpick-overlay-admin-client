// Overlay state management

import type { OverlayPayload, StateChanges } from '../types';

// ============================================
// Default initial state
// ============================================

const DEFAULT_STATE: OverlayPayload = {
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
};

// ============================================
// OverlayState Class
// ============================================

export class OverlayState {
  private state: OverlayPayload = { ...DEFAULT_STATE };

  /** Assets that are visible on overlay */
  private revealedAssets: Set<string> = new Set();

  /** Assets that have already played their reveal animation */
  private animatedAssets: Set<string> = new Set();

  /** Slot overlays that have already played their reveal animation */
  private animatedSlotOverlays: Set<string> = new Set();

  /** Assets that failed to load */
  private failedAssets: Set<string> = new Set();

  /** Track retry attempts for failed assets */
  private retryAttempts: Map<string, number> = new Map();

  // ============================================
  // State Access
  // ============================================

  getState(): OverlayPayload {
    return this.state;
  }

  getRevealedAssets(): Set<string> {
    return this.revealedAssets;
  }

  getAnimatedAssets(): Set<string> {
    return this.animatedAssets;
  }

  getAnimatedSlotOverlays(): Set<string> {
    return this.animatedSlotOverlays;
  }

  getFailedAssets(): Set<string> {
    return this.failedAssets;
  }

  getRetryAttempts(): Map<string, number> {
    return this.retryAttempts;
  }

  // ============================================
  // State Updates
  // ============================================

  /**
   * Update state with new payload and detect changes
   */
  update(payload: Partial<OverlayPayload>): StateChanges {
    const previousState = this.state;
    const newState = { ...this.state, ...payload };

    // Detect fresh tournament start
    const isNewTournament = this.isTournamentAtInitialState(newState);
    if (isNewTournament) {
      this.resetForNewTournament();
    }

    const changes = this.detectChanges(previousState, newState);
    this.state = newState;

    return changes;
  }

  /**
   * Detect what changed between states
   */
  private detectChanges(previous: OverlayPayload, next: OverlayPayload): StateChanges {
    return {
      phaseChanged: previous.currentPhase !== next.currentPhase,
      previousPhase: previous.currentPhase !== next.currentPhase ? previous.currentPhase : null,
      newPhase: next.currentPhase,
      teamNamesChanged:
        previous.teamNames.P1 !== next.teamNames.P1 || previous.teamNames.P2 !== next.teamNames.P2,
      timerChanged:
        previous.timerState !== next.timerState || previous.timerSeconds !== next.timerSeconds,
      assetsChanged: this.hasAssetsChanged(previous, next),
      isNewTournament: this.isTournamentAtInitialState(next),
    };
  }

  /**
   * Check if any assets have changed
   */
  private hasAssetsChanged(previous: OverlayPayload, next: OverlayPayload): boolean {
    // Compare map bans
    if (JSON.stringify(previous.mapsBanned) !== JSON.stringify(next.mapsBanned)) return true;
    if (JSON.stringify(previous.mapsPicked) !== JSON.stringify(next.mapsPicked)) return true;
    if (previous.deciderMap !== next.deciderMap) return true;

    // Compare agent selections
    if (JSON.stringify(previous.agentsBanned) !== JSON.stringify(next.agentsBanned)) return true;
    if (JSON.stringify(previous.agentPicks) !== JSON.stringify(next.agentPicks)) return true;

    // Compare revealed actions
    if (
      JSON.stringify(previous.revealedActionNumbers) !== JSON.stringify(next.revealedActionNumbers)
    )
      return true;

    return false;
  }

  // ============================================
  // Asset Tracking
  // ============================================

  isAssetRevealed(assetId: string): boolean {
    return this.revealedAssets.has(assetId);
  }

  markAssetRevealed(assetId: string): void {
    this.revealedAssets.add(assetId);
  }

  isAssetAnimated(assetId: string): boolean {
    return this.animatedAssets.has(assetId);
  }

  markAssetAnimated(assetId: string): void {
    this.animatedAssets.add(assetId);
  }

  isSlotOverlayAnimated(slotId: string): boolean {
    return this.animatedSlotOverlays.has(slotId);
  }

  markSlotOverlayAnimated(slotId: string): void {
    this.animatedSlotOverlays.add(slotId);
  }

  // ============================================
  // Failed Asset Tracking
  // ============================================

  isAssetFailed(assetId: string): boolean {
    return this.failedAssets.has(assetId);
  }

  markAssetFailed(assetId: string): void {
    this.failedAssets.add(assetId);
  }

  clearAssetFailed(assetId: string): void {
    this.failedAssets.delete(assetId);
    this.retryAttempts.delete(assetId);
  }

  getRetryCount(assetId: string): number {
    return this.retryAttempts.get(assetId) ?? 0;
  }

  incrementRetryCount(assetId: string): number {
    const count = (this.retryAttempts.get(assetId) ?? 0) + 1;
    this.retryAttempts.set(assetId, count);
    return count;
  }

  // ============================================
  // Reset Functions
  // ============================================

  /**
   * Check if tournament is at initial state (fresh start)
   */
  isTournamentAtInitialState(state: OverlayPayload): boolean {
    const noMapBans = !state.mapsBanned?.P1?.length && !state.mapsBanned?.P2?.length;
    const noMapPicks = !state.mapsPicked?.P1 && !state.mapsPicked?.P2;
    const noDecider = !state.deciderMap;
    const noAgentBans = !state.agentsBanned?.P1?.length && !state.agentsBanned?.P2?.length;
    const noAgentPicks = !state.agentPicks?.P1 && !state.agentPicks?.P2;

    return (
      state.actionNumber === 1 &&
      noMapBans &&
      noMapPicks &&
      noDecider &&
      noAgentBans &&
      noAgentPicks
    );
  }

  /**
   * Reset all tracking state for new tournament
   */
  resetForNewTournament(): void {
    this.revealedAssets.clear();
    this.animatedAssets.clear();
    this.animatedSlotOverlays.clear();
    this.failedAssets.clear();
    this.retryAttempts.clear();
  }

  /**
   * Reset asset reveal state for phase transitions
   * Preserves revealed assets (they should stay visible)
   */
  resetAssetRevealState(): void {
    // Preserve revealed assets across phase transitions
    // Only clear pending/animation state if needed
  }

  // ============================================
  // Diagnostics
  // ============================================

  getDiagnostics(): object {
    return {
      revealedAssets: Array.from(this.revealedAssets),
      animatedAssets: Array.from(this.animatedAssets),
      failedAssets: Array.from(this.failedAssets),
      retryAttempts: Object.fromEntries(this.retryAttempts),
      tournamentPhase: this.state.currentPhase,
      timerState: this.state.timerState,
    };
  }
}

// ============================================
// Singleton instance
// ============================================

export const overlayState = new OverlayState();
