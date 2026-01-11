// TypeScript types for OBS Admin Client - Four Panel System
//
// NOTE: Core types have been moved to src/core/tournament/types.ts
// This file re-exports them for backward compatibility.
// New code should import directly from '@/core/tournament' or '../core/tournament'

// Re-export core types from the new location
export type {
  Player,
  TournamentPhase,
  ActionType,
  MapName,
  AgentName,
  TournamentAction,
  AssetSelection,
  TournamentConfig,
  ValidationResult,
  TurnInfo,
  AssetAvailability,
  PhaseProgress,
} from '../core/tournament/types';

// Import for use in local interfaces
import type { Player, TournamentState as CoreTournamentState } from '../core/tournament/types';
import type { TimerStatus } from '../core/timer/types';

// Re-export TimerStatus as TimerState for backward compatibility
export type TimerState = TimerStatus;

// Asset selection states for OBS timing flow (not in core - UI specific)
export type AssetSelectionState =
  | 'available'
  | 'selected-pending'
  | 'revealed'
  | 'banned'
  | 'picked'
  | 'disabled';

// Complete tournament state interface (extended with store-specific fields)
// This extends the core TournamentState with Zustand/timer-specific fields
export interface TournamentState extends CoreTournamentState {
  // Timer state
  timerState: TimerStatus;
  timerSeconds: number;

  // UI state
  isInitialized: boolean;
}

// Action creators interface
export interface TournamentActions {
  // Player setup
  setFirstPlayer: (player: Player) => void;
  setPlayerName: (player: Player, name: string) => void;

  // Turn control
  startEvent: () => void;
  nextTurn: () => void; // deprecated
  prevTurn: () => void; // deprecated
  autoAdvanceTurn: () => void; // internal: advance after timed confirmation
  advancePhase: () => void; // manual: proceed to next phase when pending
  resetTurn: () => void;

  // Asset selection with OBS timing flow
  selectAsset: (assetName: string) => void; // Immediate selection (internal use)
  attemptSelection: (assetName: string) => void; // Gated selection per timing rules
  selectAssetPending: (assetName: string) => void; // Select but don't reveal to OBS
  revealPendingSelection: () => void; // Reveal pending selection to OBS
  manualReveal: (assetName: string) => void; // Deprecated for T7 (kept for compatibility)

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Tournament management
  resetTournament: () => void;
  undoLastAction: () => void;

  // Error handling
  setError: (error: string | null) => void;
}

// Combined store type
export type TournamentStore = TournamentState & TournamentActions;
