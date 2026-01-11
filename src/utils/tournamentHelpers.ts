// Tournament logic helpers for OBS Admin Client
//
// NOTE: Core logic has been moved to src/core/tournament/
// This file re-exports them for backward compatibility.
// New code should import directly from '@/core/tournament' or '../core/tournament'

// Re-export types from core
import type {
  Player,
  TournamentPhase,
  ActionType,
  TurnInfo,
  AssetAvailability,
  MapName,
  AgentName,
  AssetSelection,
  TournamentState,
} from '../core/tournament/types';

export type {
  Player,
  TournamentPhase,
  ActionType,
  TurnInfo,
  AssetAvailability,
  MapName,
  AgentName,
  AssetSelection,
};

// Re-export constants from core
export { ALL_MAPS, ALL_AGENTS } from '../core/tournament/constants';

// Re-export selectors from core
export {
  calculateCurrentPlayer,
  getCurrentPhase,
  getActionType,
  getTurnInfo,
  getPhaseStartAction,
  isMapPhase,
  isAgentPhase,
  validateTurnTransition,
} from '../core/tournament/selectors';

// Import getAvailableAssets for adapter function
import { getAvailableAssets as coreGetAvailableAssets } from '../core/tournament/selectors';

/**
 * Calculate available assets based on current tournament state
 *
 * @deprecated Use getAvailableAssets(state) from '@/core/tournament' instead.
 * This adapter function maintains backward compatibility with the old signature.
 */
export function getAvailableAssets(
  mapsBanned: AssetSelection[],
  mapsPicked: AssetSelection[],
  agentsBanned: AssetSelection[],
  agentPicks: { P1: string | null; P2: string | null },
  actionNumber: number
): AssetAvailability {
  // Build a minimal state object for the core function
  const state: Pick<
    TournamentState,
    'mapsBanned' | 'mapsPicked' | 'agentsBanned' | 'agentPicks' | 'actionNumber'
  > = {
    mapsBanned,
    mapsPicked,
    agentsBanned,
    agentPicks,
    actionNumber,
  };
  return coreGetAvailableAssets(state as TournamentState);
}

/**
 * Generate asset path for PNG files
 * (UI-specific helper, not in core)
 */
export function getAssetPath(
  assetName: string,
  assetType: 'map' | 'agent-icon' | 'agent-banner'
): string {
  const basePath = '/src/assets/img';

  switch (assetType) {
    case 'map':
      return `${basePath}/maps/${assetName}.png`;
    case 'agent-icon':
      return `${basePath}/agents-icon/${assetName}.png`;
    case 'agent-banner':
      return `${basePath}/agent-banner/${assetName}.png`;
    default:
      throw new Error(`Invalid asset type: ${assetType}`);
  }
}
