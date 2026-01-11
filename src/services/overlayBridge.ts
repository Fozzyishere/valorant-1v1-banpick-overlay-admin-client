// Overlay Bridge - Single responsibility: overlay communication
// Subscribes to tournament and timer stores, emits Tauri events to overlay

import { emitTo, listen } from '@tauri-apps/api/event';
import { tournamentStore } from '../store/tournamentStore';
import { timerStore } from '../store/timerStore';
import type { TournamentState } from '../core/tournament/types';
import type { TimerState } from '../core/timer/types';
import type { AssetSelection } from '../core/tournament/types';

// Overlay window label (must match tauri.conf.json)
const OVERLAY_WINDOW_LABEL = 'overlay';

// ============================================
// Overlay Data Format
// ============================================

export interface OverlayData {
  currentPhase: TournamentState['currentPhase'];
  currentPlayer: TournamentState['currentPlayer'];
  actionNumber: number;
  teamNames: TournamentState['teamNames'];
  mapsBanned: Record<'P1' | 'P2', string[]>;
  mapsPicked: Record<'P1' | 'P2', string | null>;
  deciderMap: string | null;
  agentsBanned: Record<'P1' | 'P2', string[]>;
  agentPicks: TournamentState['agentPicks'];
  timerState: TimerState['status'];
  timerSeconds: number;
  currentActionPending: string | null;
  revealedActionNumbers: number[];
}

// ============================================
// Transform Functions
// ============================================

/**
 * Transform tournament and timer state to overlay format
 */
export function transformToOverlayFormat(
  tournamentState: TournamentState,
  timerState: TimerState
): OverlayData {
  // Convert arrays of AssetSelection to P1/P2 object format
  const mapsBannedByPlayer: Record<'P1' | 'P2', string[]> = { P1: [], P2: [] };
  const mapsPicked: Record<'P1' | 'P2', string | null> = { P1: null, P2: null };
  const agentsBannedByPlayer: Record<'P1' | 'P2', string[]> = { P1: [], P2: [] };

  // Process maps banned
  tournamentState.mapsBanned?.forEach((ban: AssetSelection) => {
    if (ban.player === 'P1' || ban.player === 'P2') {
      mapsBannedByPlayer[ban.player].push(ban.name);
    }
  });

  // Process maps picked
  tournamentState.mapsPicked?.forEach((pick: AssetSelection) => {
    if (pick.player === 'P1' || pick.player === 'P2') {
      mapsPicked[pick.player] = pick.name;
    }
  });

  // Process agents banned
  tournamentState.agentsBanned?.forEach((ban: AssetSelection) => {
    if (ban.player === 'P1' || ban.player === 'P2') {
      agentsBannedByPlayer[ban.player].push(ban.name);
    }
  });

  return {
    currentPhase: tournamentState.currentPhase,
    currentPlayer: tournamentState.currentPlayer,
    actionNumber: tournamentState.actionNumber,
    teamNames: tournamentState.teamNames,
    mapsBanned: mapsBannedByPlayer,
    mapsPicked,
    deciderMap: tournamentState.deciderMap,
    agentsBanned: agentsBannedByPlayer,
    agentPicks: tournamentState.agentPicks,
    timerState: timerState.status,
    timerSeconds: timerState.seconds,
    currentActionPending: tournamentState.pendingSelection || null,
    revealedActionNumbers: Array.from(tournamentState.revealedActions || []),
  };
}

// ============================================
// Tauri Event Emission
// ============================================

/**
 * Emit tournament update event to overlay window
 */
async function emitToOverlay(data: OverlayData): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      await emitTo(OVERLAY_WINDOW_LABEL, 'tournament-update', data);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('window not found'))) {
        console.error('Error emitting overlay update:', error);
      }
    }
  }
}

// ============================================
// Bridge State
// ============================================

let isInitialized = false;
let unsubscribeTournament: (() => void) | null = null;
let unsubscribeTimer: (() => void) | null = null;
let unsubscribeStateRequest: (() => void) | null = null;

/**
 * Get current combined state and emit to overlay
 */
function emitCurrentState(): void {
  const tournamentState = tournamentStore.getState().getSnapshot();
  const timerState = timerStore.getState().getSnapshot();
  const overlayData = transformToOverlayFormat(tournamentState, timerState);
  emitToOverlay(overlayData);
}

// ============================================
// Bridge Initialization
// ============================================

/**
 * Initialize the overlay bridge
 * Sets up subscriptions to both stores and emits updates on changes
 */
export async function initializeOverlayBridge(): Promise<void> {
  if (isInitialized) {
    console.warn('OverlayBridge already initialized');
    return;
  }

  // Subscribe to tournament store changes
  unsubscribeTournament = tournamentStore.subscribe(
    (state) => state.getSnapshot(),
    () => {
      emitCurrentState();
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
  );

  // Subscribe to timer store changes
  unsubscribeTimer = timerStore.subscribe(
    (state) => state.getSnapshot(),
    () => {
      emitCurrentState();
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
  );

  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    unsubscribeStateRequest = await listen('overlay-request-state', () => {
      emitCurrentState();
    });
  }

  // Emit initial state
  emitCurrentState();

  isInitialized = true;
}

/**
 * Cleanup the overlay bridge
 */
export function destroyOverlayBridge(): void {
  if (unsubscribeTournament) {
    unsubscribeTournament();
    unsubscribeTournament = null;
  }

  if (unsubscribeTimer) {
    unsubscribeTimer();
    unsubscribeTimer = null;
  }

  if (unsubscribeStateRequest) {
    unsubscribeStateRequest();
    unsubscribeStateRequest = null;
  }

  isInitialized = false;
}

/**
 * Check if bridge is initialized
 */
export function isBridgeInitialized(): boolean {
  return isInitialized;
}

/**
 * Force emit current state (useful for manual refresh)
 */
export function forceEmit(): void {
  emitCurrentState();
}

// ============================================
// Cross-Store Coordination
// ============================================

/**
 * Setup timer-tournament coordination
 * When timer finishes, auto-reveal pending selection and advance turn
 */
export function setupTimerCoordination(): void {
  timerStore.getState().setOnTimerFinished(() => {
    const tournamentState = tournamentStore.getState();

    // If there's a pending selection, reveal it
    if (tournamentState.pendingSelection) {
      tournamentStore.getState().selectAsset(tournamentState.pendingSelection);
    }

    // If selection is already revealed for this action, auto-advance
    const currentState = tournamentStore.getState();
    if (currentState.revealedActions.has(currentState.actionNumber)) {
      tournamentStore.getState().autoAdvanceTurn();
    }
  });
}

// ============================================
// Combined Initialization
// ============================================

/**
 * Initialize all bridge functionality
 */
export function initializeBridge(): void {
  initializeOverlayBridge();
  setupTimerCoordination();
}
