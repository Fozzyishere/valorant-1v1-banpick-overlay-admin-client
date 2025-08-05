// Tournament logic helpers for OBS Admin Client

import type { 
  Player, 
  TournamentPhase, 
  ActionType, 
  TurnInfo, 
  AssetAvailability,
  MapName,
  AgentName,
  AssetSelection
} from '../types/admin.types';

// All available maps and agents
export const ALL_MAPS: MapName[] = [
  'abyss', 'ascent', 'bind', 'breeze', 'corrode', 'fracture',
  'haven', 'icebox', 'lotus', 'pearl', 'split', 'sunset'
];

export const ALL_AGENTS: AgentName[] = [
  'astra', 'breach', 'brimstone', 'chamber', 'clove', 'cypher',
  'deadlock', 'fade', 'gekko', 'harbor', 'iso', 'jett', 'kayo',
  'killjoy', 'neon', 'omen', 'phoenix', 'raze', 'reyna', 'sage',
  'skye', 'sova', 'tejo', 'viper', 'vyse', 'waylay', 'yoru'
];

/**
 * Calculate current player based on action number and first player
 * Tournament follows strict P1 → P2 alternation throughout
 */
export function calculateCurrentPlayer(actionNumber: number, firstPlayer: Player): Player {
  if (actionNumber < 1 || actionNumber > 17) {
    throw new Error(`Invalid action number: ${actionNumber}. Must be 1-17.`);
  }
  
  // If first player is P1: odd actions = P1, even actions = P2
  // If first player is P2: odd actions = P2, even actions = P1
  const isOddAction = actionNumber % 2 === 1;
  
  if (firstPlayer === 'P1') {
    return isOddAction ? 'P1' : 'P2';
  } else {
    return isOddAction ? 'P2' : 'P1';
  }
}

/**
 * Get current tournament phase based on action number
 */
export function getCurrentPhase(actionNumber: number): TournamentPhase {
  if (actionNumber < 1) return 'MAP_BAN';
  if (actionNumber <= 6) return 'MAP_BAN';      // Actions 1-6: Map bans
  if (actionNumber <= 8) return 'MAP_PICK';     // Actions 7-8: Map picks
  if (actionNumber === 9) return 'MAP_PICK';    // Action 9: Decider (still map phase)
  if (actionNumber <= 15) return 'AGENT_BAN';   // Actions 10-15: Agent bans
  if (actionNumber <= 17) return 'AGENT_PICK';  // Actions 16-17: Agent picks
  return 'CONCLUSION';                          // After action 17
}

/**
 * Get action type for specific action number
 */
export function getActionType(actionNumber: number): ActionType {
  if (actionNumber <= 6) return 'MAP_BAN';
  if (actionNumber <= 8) return 'MAP_PICK';
  if (actionNumber === 9) return 'DECIDER';
  if (actionNumber <= 15) return 'AGENT_BAN';
  if (actionNumber <= 17) return 'AGENT_PICK';
  throw new Error(`Invalid action number: ${actionNumber}`);
}

/**
 * Generate complete turn information for display
 */
export function getTurnInfo(actionNumber: number, firstPlayer: Player): TurnInfo {
  const player = calculateCurrentPlayer(actionNumber, firstPlayer);
  const phase = getCurrentPhase(actionNumber);
  const actionType = getActionType(actionNumber);
  
  // Generate description based on action type and sequence
  let description: string;
  
  switch (actionType) {
    case 'MAP_BAN':
      const banNumber = Math.ceil(actionNumber / 2);
      description = `Turn ${actionNumber}: ${player} Map Ban ${banNumber}`;
      break;
    case 'MAP_PICK':
      const pickNumber = actionNumber - 6;
      description = `Turn ${actionNumber}: ${player} Map Pick ${pickNumber}`;
      break;
    case 'DECIDER':
      description = `Turn ${actionNumber}: ${player} Decider Selection`;
      break;
    case 'AGENT_BAN':
      const agentBanNumber = Math.ceil((actionNumber - 9) / 2);
      description = `Turn ${actionNumber}: ${player} Agent Ban ${agentBanNumber}`;
      break;
    case 'AGENT_PICK':
      const agentPickNumber = actionNumber - 15;
      description = `Turn ${actionNumber}: ${player} Agent Pick ${agentPickNumber}`;
      break;
    default:
      description = `Turn ${actionNumber}: ${player} Unknown Action`;
  }
  
  return {
    actionNumber,
    player,
    phase,
    actionType,
    description
  };
}

/**
 * Calculate available assets based on current tournament state
 */
export function getAvailableAssets(
  mapsBanned: AssetSelection[],
  mapsPicked: AssetSelection[],
  agentsBanned: AssetSelection[],
  agentPicks: { P1: string | null; P2: string | null },
  actionNumber: number
): AssetAvailability {
  // Extract banned/picked asset names
  const bannedMapNames = mapsBanned.map(selection => selection.name as MapName);
  const pickedMapNames = mapsPicked.map(selection => selection.name as MapName);
  const bannedAgentNames = agentsBanned.map(selection => selection.name as AgentName);
  const pickedAgentNames = [agentPicks.P1, agentPicks.P2].filter(Boolean) as AgentName[];
  
  // Calculate available maps
  const availableMaps = ALL_MAPS.filter(map => 
    !bannedMapNames.includes(map) && !pickedMapNames.includes(map)
  );
  
  // Calculate available agents
  const availableAgents = ALL_AGENTS.filter(agent =>
    !bannedAgentNames.includes(agent) && !pickedAgentNames.includes(agent)
  );
  
  // For decider selection (action 9), only picked maps are available
  const deciderAvailableMaps = actionNumber === 9 ? pickedMapNames : availableMaps;
  
  return {
    maps: {
      available: actionNumber === 9 ? deciderAvailableMaps : availableMaps,
      banned: bannedMapNames,
      picked: pickedMapNames
    },
    agents: {
      available: availableAgents,
      banned: bannedAgentNames,
      picked: pickedAgentNames
    }
  };
}

/**
 * Validate turn transition to prevent invalid states
 */
export function validateTurnTransition(
  targetAction: number,
  maxCompletedAction: number
): { valid: boolean; error?: string } {
  // Can't go to invalid action numbers
  if (targetAction < 1 || targetAction > 17) {
    return { 
      valid: false, 
      error: `Invalid target action: ${targetAction}. Must be 1-17.` 
    };
  }
  
  // Can't skip ahead beyond next incomplete action
  if (targetAction > maxCompletedAction + 1) {
    return { 
      valid: false, 
      error: `Cannot skip to action ${targetAction}. Next available action is ${maxCompletedAction + 1}.` 
    };
  }
  
  // Can't go backwards beyond action 1
  if (targetAction < 1) {
    return { 
      valid: false, 
      error: 'Cannot go before action 1.' 
    };
  }
  
  return { valid: true };
}

/**
 * Get the first turn of current phase for RESET TURN functionality
 */
export function getPhaseStartAction(actionNumber: number): number {
  const phase = getCurrentPhase(actionNumber);
  
  switch (phase) {
    case 'MAP_BAN': return 1;      // Actions 1-6
    case 'MAP_PICK': return 7;     // Actions 7-9
    case 'AGENT_BAN': return 10;   // Actions 10-15
    case 'AGENT_PICK': return 16;  // Actions 16-17
    case 'CONCLUSION': return 17;  // Tournament complete
    default: return 1;
  }
}

/**
 * Check if current turn expects a map or agent selection
 */
export function isMapPhase(actionNumber: number): boolean {
  return actionNumber >= 1 && actionNumber <= 9;
}

export function isAgentPhase(actionNumber: number): boolean {
  return actionNumber >= 10 && actionNumber <= 17;
}

/**
 * Generate asset path for PNG files
 */
export function getAssetPath(assetName: string, assetType: 'map' | 'agent-icon' | 'agent-banner'): string {
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