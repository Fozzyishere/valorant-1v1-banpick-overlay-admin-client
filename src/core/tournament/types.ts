// Core tournament types - framework agnostic

// ============================================
// Core enums and primitives
// ============================================

export type Player = 'P1' | 'P2';

export type TournamentPhase = 'MAP_PHASE' | 'AGENT_PHASE' | 'CONCLUSION';

export type ActionType = 'MAP_BAN' | 'MAP_PICK' | 'DECIDER' | 'AGENT_BAN' | 'AGENT_PICK';

// Asset types
export type MapName =
  | 'abyss'
  | 'ascent'
  | 'bind'
  | 'breeze'
  | 'corrode'
  | 'fracture'
  | 'haven'
  | 'icebox'
  | 'lotus'
  | 'pearl'
  | 'split'
  | 'sunset';

export type AgentName =
  | 'astra'
  | 'breach'
  | 'brimstone'
  | 'chamber'
  | 'clove'
  | 'cypher'
  | 'deadlock'
  | 'fade'
  | 'gekko'
  | 'harbor'
  | 'iso'
  | 'jett'
  | 'kayo'
  | 'killjoy'
  | 'neon'
  | 'omen'
  | 'phoenix'
  | 'raze'
  | 'reyna'
  | 'sage'
  | 'skye'
  | 'sova'
  | 'tejo'
  | 'viper'
  | 'vyse'
  | 'waylay'
  | 'yoru';

// ============================================
// Tournament action tracking
// ============================================

export interface TournamentAction {
  actionNumber: number; // 1-17
  player: Player;
  actionType: ActionType;
  selection: string; // MapName or AgentName
  timestamp: number;
}

export interface AssetSelection {
  name: string;
  player: Player;
}

// ============================================
// Pure tournament state (no side-effect fields)
// ============================================

export interface TournamentState {
  // Phase and turn tracking
  currentPhase: TournamentPhase;
  currentPlayer: Player | null;
  actionNumber: number; // 1-17 total actions
  firstPlayer: Player; // Tournament starter (P1 or P2)
  eventStarted: boolean; // Must be started before selections

  // Manual phase advancement gating
  phaseAdvancePending: TournamentPhase | null;

  // Team configuration
  teamNames: {
    P1: string;
    P2: string;
  };

  // Map state (Actions 1-9)
  mapsBanned: AssetSelection[]; // 6 items max
  mapsPicked: AssetSelection[]; // 2 items max
  deciderMap: string | null; // Selected from mapsPicked

  // Agent state (Actions 10-17)
  agentsBanned: AssetSelection[]; // 6 items max
  agentPicks: {
    P1: string | null;
    P2: string | null;
  };

  // OBS timing flow state
  pendingSelection: string | null; // Asset selected but not yet revealed
  revealedActions: Set<number>; // Actions that have been revealed on OBS

  // Action history for undo and debugging
  actionHistory: TournamentAction[];

  // UI state
  lastError: string | null;
}

// ============================================
// Configuration and validation types
// ============================================

export interface TournamentConfig {
  timerSeconds: number;
  firstPlayer: Player;
  teamNames: {
    P1: string;
    P2: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// Helper types for turn logic
// ============================================

export interface TurnInfo {
  actionNumber: number;
  player: Player;
  phase: TournamentPhase;
  actionType: ActionType;
  description: string; // e.g., "Turn 5: P2 Map Ban"
}

export interface AssetAvailability {
  maps: {
    available: MapName[];
    banned: MapName[];
    picked: MapName[];
  };
  agents: {
    available: AgentName[];
    banned: AgentName[];
    picked: AgentName[];
  };
}

// ============================================
// Phase progress tracking
// ============================================

export interface PhaseProgress {
  phase: TournamentPhase;
  currentAction: number;
  totalActionsInPhase: number;
  completedActionsInPhase: number;
  isComplete: boolean;
}
