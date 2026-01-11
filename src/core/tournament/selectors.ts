// Pure selector functions for tournament state

import type {
  Player,
  TournamentPhase,
  ActionType,
  TurnInfo,
  AssetAvailability,
  TournamentState,
  PhaseProgress,
  ValidationResult,
  MapName,
  AgentName,
} from './types';

import {
  ALL_MAPS,
  ALL_AGENTS,
  PHASE_BOUNDARIES,
  ACTION_TYPE_MAP,
  TOTAL_ACTIONS,
} from './constants';

/**
 * Calculate current player based on action number and first player
 * Tournament follows strict P1 → P2 alternation throughout
 */
export function calculateCurrentPlayer(actionNumber: number, firstPlayer: Player): Player {
  if (actionNumber < 1 || actionNumber > TOTAL_ACTIONS) {
    throw new Error(`Invalid action number: ${actionNumber}. Must be 1-${TOTAL_ACTIONS}.`);
  }

  const isOddAction = actionNumber % 2 === 1;

  if (firstPlayer === 'P1') {
    return isOddAction ? 'P1' : 'P2';
  } else {
    return isOddAction ? 'P2' : 'P1';
  }
}

/**
 * Get current tournament phase based on action number
 * Streamlined to 3 phases: MAP_PHASE (1-9), AGENT_PHASE (10-17), CONCLUSION
 */
export function getCurrentPhase(actionNumber: number): TournamentPhase {
  if (actionNumber < 1) return 'MAP_PHASE';
  if (actionNumber <= PHASE_BOUNDARIES.MAP_PHASE.end) return 'MAP_PHASE';
  if (actionNumber <= PHASE_BOUNDARIES.AGENT_PHASE.end) return 'AGENT_PHASE';
  return 'CONCLUSION';
}

/**
 * Get action type for specific action number
 */
export function getActionType(actionNumber: number): ActionType {
  const actionType = ACTION_TYPE_MAP[actionNumber];
  if (!actionType) {
    throw new Error(`Invalid action number: ${actionNumber}`);
  }
  return actionType;
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
    case 'MAP_BAN': {
      const banNumber = Math.ceil(actionNumber / 2);
      description = `Turn ${actionNumber}: ${player} Map Ban ${banNumber}`;
      break;
    }
    case 'MAP_PICK': {
      const pickNumber = actionNumber - 6;
      description = `Turn ${actionNumber}: ${player} Map Pick ${pickNumber}`;
      break;
    }
    case 'DECIDER':
      description = `Turn ${actionNumber}: ${player} Decider Selection`;
      break;
    case 'AGENT_BAN': {
      const agentBanNumber = Math.ceil((actionNumber - 9) / 2);
      description = `Turn ${actionNumber}: ${player} Agent Ban ${agentBanNumber}`;
      break;
    }
    case 'AGENT_PICK': {
      const agentPickNumber = actionNumber - 15;
      description = `Turn ${actionNumber}: ${player} Agent Pick ${agentPickNumber}`;
      break;
    }
    default:
      description = `Turn ${actionNumber}: ${player} Unknown Action`;
  }

  return {
    actionNumber,
    player,
    phase,
    actionType,
    description,
  };
}

/**
 * Calculate available assets based on current tournament state
 */
export function getAvailableAssets(state: TournamentState): AssetAvailability {
  const { mapsBanned, mapsPicked, agentsBanned, agentPicks, actionNumber } = state;

  const bannedMapNames = mapsBanned.map((selection) => selection.name as MapName);
  const pickedMapNames = mapsPicked.map((selection) => selection.name as MapName);
  const bannedAgentNames = agentsBanned.map((selection) => selection.name as AgentName);
  const pickedAgentNames = [agentPicks.P1, agentPicks.P2].filter(Boolean) as AgentName[];

  const availableMaps = ALL_MAPS.filter(
    (map) => !bannedMapNames.includes(map) && !pickedMapNames.includes(map)
  ) as MapName[];

  const availableAgents = ALL_AGENTS.filter(
    (agent) => !bannedAgentNames.includes(agent) && !pickedAgentNames.includes(agent)
  ) as AgentName[];

  // For decider selection (action 9), only picked maps are available
  const deciderAvailableMaps = actionNumber === 9 ? pickedMapNames : availableMaps;

  return {
    maps: {
      available: actionNumber === 9 ? deciderAvailableMaps : availableMaps,
      banned: bannedMapNames,
      picked: pickedMapNames,
    },
    agents: {
      available: availableAgents,
      banned: bannedAgentNames,
      picked: pickedAgentNames,
    },
  };
}

/**
 * Check if current turn expects a map selection
 */
export function isMapPhase(actionNumber: number): boolean {
  return (
    actionNumber >= PHASE_BOUNDARIES.MAP_PHASE.start &&
    actionNumber <= PHASE_BOUNDARIES.MAP_PHASE.end
  );
}

/**
 * Check if current turn expects an agent selection
 */
export function isAgentPhase(actionNumber: number): boolean {
  return (
    actionNumber >= PHASE_BOUNDARIES.AGENT_PHASE.start &&
    actionNumber <= PHASE_BOUNDARIES.AGENT_PHASE.end
  );
}

/**
 * Get the first turn of current phase for RESET functionality
 */
export function getPhaseStartAction(actionNumber: number): number {
  const phase = getCurrentPhase(actionNumber);

  switch (phase) {
    case 'MAP_PHASE':
      return PHASE_BOUNDARIES.MAP_PHASE.start;
    case 'AGENT_PHASE':
      return PHASE_BOUNDARIES.AGENT_PHASE.start;
    case 'CONCLUSION':
      return TOTAL_ACTIONS;
    default:
      return 1;
  }
}

/**
 * Calculate phase progress information
 */
export function getPhaseProgress(state: TournamentState): PhaseProgress {
  const { actionNumber, currentPhase } = state;

  let totalActionsInPhase: number;
  let phaseStartAction: number;

  switch (currentPhase) {
    case 'MAP_PHASE':
      phaseStartAction = PHASE_BOUNDARIES.MAP_PHASE.start;
      totalActionsInPhase = PHASE_BOUNDARIES.MAP_PHASE.end - PHASE_BOUNDARIES.MAP_PHASE.start + 1;
      break;
    case 'AGENT_PHASE':
      phaseStartAction = PHASE_BOUNDARIES.AGENT_PHASE.start;
      totalActionsInPhase =
        PHASE_BOUNDARIES.AGENT_PHASE.end - PHASE_BOUNDARIES.AGENT_PHASE.start + 1;
      break;
    case 'CONCLUSION':
      return {
        phase: 'CONCLUSION',
        currentAction: actionNumber,
        totalActionsInPhase: 0,
        completedActionsInPhase: 0,
        isComplete: true,
      };
    default:
      phaseStartAction = 1;
      totalActionsInPhase = TOTAL_ACTIONS;
  }

  const completedActionsInPhase = Math.max(0, actionNumber - phaseStartAction);
  const isComplete = completedActionsInPhase >= totalActionsInPhase;

  return {
    phase: currentPhase,
    currentAction: actionNumber,
    totalActionsInPhase,
    completedActionsInPhase,
    isComplete,
  };
}

/**
 * Validate if an asset can be selected in current state
 */
export function canSelectAsset(state: TournamentState, assetName: string): ValidationResult {
  const { actionNumber, currentPlayer, eventStarted, phaseAdvancePending, revealedActions } = state;

  // Event must be started
  if (!eventStarted) {
    return { valid: false, error: 'Event not started. Click START EVENT to begin.' };
  }

  // No active player
  if (!currentPlayer) {
    return { valid: false, error: 'No active player for selection.' };
  }

  // Phase advance pending
  if (phaseAdvancePending) {
    return { valid: false, error: 'Next phase is ready. Click ADVANCE PHASE to continue.' };
  }

  // Already revealed for this action
  if (revealedActions.has(actionNumber)) {
    return {
      valid: false,
      error: 'Selection for this turn already confirmed. Use RESET TURN to change it.',
    };
  }

  const actionType = getActionType(actionNumber);
  const availability = getAvailableAssets(state);

  // Validate asset based on action type
  switch (actionType) {
    case 'MAP_BAN':
    case 'MAP_PICK':
      if (!availability.maps.available.includes(assetName as MapName)) {
        return { valid: false, error: `Map "${assetName}" is not available for selection.` };
      }
      break;

    case 'DECIDER': {
      const pickedMapNames = state.mapsPicked.map((p) => p.name);
      if (!pickedMapNames.includes(assetName)) {
        return { valid: false, error: 'Decider must be selected from picked maps.' };
      }
      break;
    }

    case 'AGENT_BAN':
    case 'AGENT_PICK':
      if (!availability.agents.available.includes(assetName as AgentName)) {
        return { valid: false, error: `Agent "${assetName}" is not available for selection.` };
      }
      break;

    default:
      return { valid: false, error: `Invalid action type: ${actionType}` };
  }

  return { valid: true };
}

/**
 * Check if phase can be advanced
 */
export function canAdvancePhase(state: TournamentState): boolean {
  return state.phaseAdvancePending !== null;
}

/**
 * Validate turn transition to prevent invalid states
 */
export function validateTurnTransition(
  targetAction: number,
  maxCompletedAction: number
): ValidationResult {
  // Can't go to invalid action numbers
  if (targetAction < 1 || targetAction > TOTAL_ACTIONS) {
    return {
      valid: false,
      error: `Invalid target action: ${targetAction}. Must be 1-${TOTAL_ACTIONS}.`,
    };
  }

  // Can't skip ahead beyond next incomplete action
  if (targetAction > maxCompletedAction + 1) {
    return {
      valid: false,
      error: `Cannot skip to action ${targetAction}. Next available action is ${maxCompletedAction + 1}.`,
    };
  }

  return { valid: true };
}
