// Overlay-specific types
import type { TournamentPhase, Player } from '../core/tournament/types';
import type { TimerStatus } from '../core/timer/types';

// Re-export for convenience
export type { TournamentPhase, Player, TimerStatus };

// ============================================
// Payload received from admin via Tauri events
// ============================================

export interface OverlayPayload {
  currentPhase: TournamentPhase;
  currentPlayer: Player | null;
  actionNumber: number;
  teamNames: { P1: string; P2: string };
  mapsBanned: { P1: string[]; P2: string[] };
  mapsPicked: { P1: string | null; P2: string | null };
  deciderMap: string | null;
  agentsBanned: { P1: string[]; P2: string[] };
  agentPicks: { P1: string | null; P2: string | null };
  timerState: TimerStatus;
  timerSeconds: number;
  currentActionPending: string | null;
  revealedActionNumbers: number[];
}

// ============================================
// Internal overlay asset representation
// ============================================

export type AssetType = 'map' | 'agent-icon' | 'agent-banner';
export type SlotType = 'ban1' | 'ban2' | 'ban3' | 'pick' | 'decider';

export interface PositionedAsset {
  id: string;
  type: AssetType;
  asset: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  revealed: boolean;
  player: Player | 'shared';
  slot: string;
}

// ============================================
// Coordinate definitions
// ============================================

export interface SlotCoordinate {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TeamNamePosition {
  x: number;
  y: number;
  fontSize: string;
}

export interface BanSlotCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PickSlotCoordinates {
  p1: BanSlotCoordinate;
  p2: BanSlotCoordinate;
  decider?: BanSlotCoordinate;
}

export interface AgentPickCoordinates {
  p1: BanSlotCoordinate;
  p2: BanSlotCoordinate;
}

export interface PhaseCoordinates {
  teamNames: {
    p1: TeamNamePosition;
    p2: TeamNamePosition;
  };
  p1MapBans?: BanSlotCoordinate[];
  p2MapBans?: BanSlotCoordinate[];
  mapPicks?: PickSlotCoordinates;
  p1AgentBans?: BanSlotCoordinate[];
  p2AgentBans?: BanSlotCoordinate[];
  agentPicks?: AgentPickCoordinates;
}

// ============================================
// State change detection
// ============================================

export interface StateChanges {
  phaseChanged: boolean;
  previousPhase: TournamentPhase | null;
  newPhase: TournamentPhase;
  teamNamesChanged: boolean;
  timerChanged: boolean;
  assetsChanged: boolean;
  isNewTournament: boolean;
}
