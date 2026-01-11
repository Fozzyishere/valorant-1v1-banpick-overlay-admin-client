// Core tournament module barrel export

// Types
export type {
  Player,
  TournamentPhase,
  ActionType,
  MapName,
  AgentName,
  TournamentAction,
  AssetSelection,
  TournamentState,
  TournamentConfig,
  ValidationResult,
  TurnInfo,
  AssetAvailability,
  PhaseProgress,
} from './types';

// Constants
export {
  ALL_MAPS,
  ALL_AGENTS,
  TOTAL_ACTIONS,
  PHASE_BOUNDARIES,
  ACTION_TYPE_MAP,
  DEFAULT_TIMER_SECONDS,
  DEV_TIMER_SECONDS,
  MAX_MAP_BANS,
  MAX_MAP_PICKS,
  MAX_AGENT_BANS,
  MAX_AGENT_PICKS,
} from './constants';

// Selectors (pure functions)
export {
  calculateCurrentPlayer,
  getCurrentPhase,
  getActionType,
  getTurnInfo,
  getAvailableAssets,
  isMapPhase,
  isAgentPhase,
  getPhaseStartAction,
  getPhaseProgress,
  canSelectAsset,
  canAdvancePhase,
  validateTurnTransition,
} from './selectors';

// Engine (pure state machine)
export { TournamentEngine } from './TournamentEngine';
