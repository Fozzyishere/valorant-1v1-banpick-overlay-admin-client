// Pure tournament state machine - framework agnostic

import type {
  TournamentState,
  TournamentConfig,
  TournamentAction,
  AssetSelection,
  Player,
  ValidationResult,
} from './types';

import {
  calculateCurrentPlayer,
  getCurrentPhase,
  getActionType,
  canSelectAsset,
} from './selectors';

import { TOTAL_ACTIONS } from './constants';

/**
 * TournamentEngine - Pure state machine for tournament management
 *
 * All methods are static and pure:
 * - Take current state as first parameter
 * - Return new state (never mutate input)
 * - No side effects (no timers, no events, no I/O)
 *
 * The Zustand store wraps this engine and adds:
 * - Timer intervals (setInterval)
 * - Event emission (Tauri events)
 * - React integration
 */
export class TournamentEngine {
  /**
   * Create initial tournament state with default values
   */
  static createInitialState(config?: Partial<TournamentConfig>): TournamentState {
    const firstPlayer = config?.firstPlayer ?? 'P1';

    return {
      currentPhase: 'MAP_PHASE',
      currentPlayer: null, // Set when event starts
      actionNumber: 1,
      firstPlayer,
      eventStarted: false,
      phaseAdvancePending: null,

      teamNames: config?.teamNames ?? {
        P1: 'Player 1',
        P2: 'Player 2',
      },

      mapsBanned: [],
      mapsPicked: [],
      deciderMap: null,
      agentsBanned: [],
      agentPicks: {
        P1: null,
        P2: null,
      },

      pendingSelection: null,
      revealedActions: new Set(),
      actionHistory: [],
      lastError: null,
    };
  }

  /**
   * Start the tournament event - initializes action 1 with first player
   */
  static startEvent(state: TournamentState): TournamentState {
    const newCurrentPlayer = calculateCurrentPlayer(1, state.firstPlayer);
    const newPhase = getCurrentPhase(1);

    return {
      ...state,
      actionNumber: 1,
      currentPlayer: newCurrentPlayer,
      currentPhase: newPhase,
      phaseAdvancePending: null,
      eventStarted: true,
      // Clear all tournament data for fresh start
      mapsBanned: [],
      mapsPicked: [],
      deciderMap: null,
      agentsBanned: [],
      agentPicks: { P1: null, P2: null },
      actionHistory: [],
      pendingSelection: null,
      revealedActions: new Set(),
      lastError: null,
    };
  }

  /**
   * Select an asset (map or agent) for the current action
   * This is the core selection logic extracted from adminStore.selectAsset
   */
  static selectAsset(state: TournamentState, assetName: string): TournamentState {
    const { currentPlayer, actionNumber, revealedActions, actionHistory } = state;

    if (!currentPlayer) {
      return { ...state, lastError: 'No active player for selection' };
    }

    if (revealedActions.has(actionNumber)) {
      return {
        ...state,
        lastError: 'Selection for this turn already confirmed. Use RESET TURN to change it.',
      };
    }

    if (actionHistory.some((a) => a.actionNumber === actionNumber)) {
      return {
        ...state,
        lastError: 'Selection for this turn already recorded. Use RESET TURN to change it.',
      };
    }

    const validation = canSelectAsset(state, assetName);
    if (!validation.valid) {
      return { ...state, lastError: validation.error ?? 'Invalid selection' };
    }

    const actionType = getActionType(actionNumber);
    const timestamp = Date.now();

    const newAction: TournamentAction = {
      actionNumber,
      player: currentPlayer,
      actionType,
      selection: assetName,
      timestamp,
    };

    const assetSelection: AssetSelection = {
      name: assetName,
      player: currentPlayer,
    };

    let newState: TournamentState;

    switch (actionType) {
      case 'MAP_BAN':
        newState = {
          ...state,
          mapsBanned: [...state.mapsBanned, assetSelection],
        };
        break;

      case 'MAP_PICK':
        newState = {
          ...state,
          mapsPicked: [...state.mapsPicked, assetSelection],
        };
        break;

      case 'DECIDER': {
        // Validate that asset is from picked maps
        const pickedMapNames = state.mapsPicked.map((pick) => pick.name);
        if (!pickedMapNames.includes(assetName)) {
          return { ...state, lastError: 'Decider must be selected from picked maps' };
        }
        newState = {
          ...state,
          deciderMap: assetName,
        };
        break;
      }

      case 'AGENT_BAN':
        newState = {
          ...state,
          agentsBanned: [...state.agentsBanned, assetSelection],
        };
        break;

      case 'AGENT_PICK':
        newState = {
          ...state,
          agentPicks: {
            ...state.agentPicks,
            [currentPlayer]: assetName,
          },
        };
        break;

      default:
        return { ...state, lastError: `Invalid action type: ${actionType}` };
    }

    // Add to history, mark as revealed, clear pending
    return {
      ...newState,
      actionHistory: [...state.actionHistory, newAction],
      revealedActions: new Set([...revealedActions, actionNumber]),
      pendingSelection: null,
      lastError: null,
    };
  }

  /**
   * Auto-advance to next turn after selection
   * Handles phase transitions by setting phaseAdvancePending
   */
  static autoAdvanceTurn(state: TournamentState): TournamentState {
    const targetAction = state.actionNumber + 1;

    // Don't advance beyond action 17 - gate entering CONCLUSION
    if (targetAction > TOTAL_ACTIONS) {
      return {
        ...state,
        phaseAdvancePending: 'CONCLUSION',
        pendingSelection: null,
        lastError: null,
      };
    }

    const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
    const newPhase = getCurrentPhase(targetAction);

    // If phase changes, gate advancement until admin approves
    if (newPhase !== state.currentPhase) {
      return {
        ...state,
        phaseAdvancePending: newPhase,
        pendingSelection: null,
        lastError: null,
      };
    }

    // Same-phase auto-advance
    return {
      ...state,
      actionNumber: targetAction,
      currentPlayer: newCurrentPlayer,
      currentPhase: newPhase,
      pendingSelection: null,
      lastError: null,
    };
  }

  /**
   * Manually advance to next phase when gated
   */
  static advancePhase(state: TournamentState): TournamentState {
    if (!state.phaseAdvancePending) {
      return state;
    }

    const targetAction = state.actionNumber + 1;

    // Entering CONCLUSION: no further actions
    if (state.phaseAdvancePending === 'CONCLUSION' || targetAction > TOTAL_ACTIONS) {
      return {
        ...state,
        currentPhase: 'CONCLUSION',
        currentPlayer: null,
        phaseAdvancePending: null,
        pendingSelection: null,
        lastError: null,
      };
    }

    const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);

    return {
      ...state,
      actionNumber: targetAction,
      currentPlayer: newCurrentPlayer,
      currentPhase: state.phaseAdvancePending,
      phaseAdvancePending: null,
      pendingSelection: null,
      lastError: null,
    };
  }

  /**
   * Reset current turn - clears pending selection and reverts current action if recorded
   */
  static resetTurn(state: TournamentState): TournamentState {
    const currentAction = state.actionNumber;
    let newState = { ...state };

    // Clear pending selection
    newState.pendingSelection = null;

    // Revert current action if present in history
    const actionToRevert = state.actionHistory.find((a) => a.actionNumber === currentAction);
    if (actionToRevert) {
      switch (actionToRevert.actionType) {
        case 'MAP_BAN':
          newState.mapsBanned = state.mapsBanned.filter(
            (ban) =>
              !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
          );
          break;
        case 'MAP_PICK':
          newState.mapsPicked = state.mapsPicked.filter(
            (pick) =>
              !(pick.name === actionToRevert.selection && pick.player === actionToRevert.player)
          );
          break;
        case 'DECIDER':
          newState.deciderMap = null;
          break;
        case 'AGENT_BAN':
          newState.agentsBanned = state.agentsBanned.filter(
            (ban) =>
              !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
          );
          break;
        case 'AGENT_PICK':
          newState.agentPicks = {
            ...state.agentPicks,
            [actionToRevert.player]: null,
          };
          break;
      }
      newState.actionHistory = state.actionHistory.filter((a) => a !== actionToRevert);
    }

    // Clear revealed flag for current action
    const newRevealed = new Set(state.revealedActions);
    newRevealed.delete(currentAction);
    newState.revealedActions = newRevealed;
    newState.lastError = null;

    return newState;
  }

  /**
   * Undo the last recorded action
   */
  static undoLastAction(state: TournamentState): TournamentState {
    if (state.actionHistory.length === 0) {
      return { ...state, lastError: 'No actions to undo' };
    }

    // Get last action and remove from history
    const lastAction = state.actionHistory[state.actionHistory.length - 1];
    const newHistory = state.actionHistory.slice(0, -1);

    // Reverse the action's effects
    let newState = { ...state, actionHistory: newHistory };

    switch (lastAction.actionType) {
      case 'MAP_BAN':
        newState.mapsBanned = state.mapsBanned.filter(
          (ban) => !(ban.name === lastAction.selection && ban.player === lastAction.player)
        );
        break;

      case 'MAP_PICK':
        newState.mapsPicked = state.mapsPicked.filter(
          (pick) => !(pick.name === lastAction.selection && pick.player === lastAction.player)
        );
        break;

      case 'DECIDER':
        newState.deciderMap = null;
        break;

      case 'AGENT_BAN':
        newState.agentsBanned = state.agentsBanned.filter(
          (ban) => !(ban.name === lastAction.selection && ban.player === lastAction.player)
        );
        break;

      case 'AGENT_PICK':
        newState.agentPicks = {
          ...state.agentPicks,
          [lastAction.player]: null,
        };
        break;
    }

    // Also remove from revealed set if present
    const newRevealed = new Set(state.revealedActions);
    newRevealed.delete(lastAction.actionNumber);
    newState.revealedActions = newRevealed;

    newState.lastError = null;
    return newState;
  }

  /**
   * Reset tournament to initial state (keeps team config)
   */
  static resetTournament(state: TournamentState): TournamentState {
    return {
      currentPhase: 'MAP_PHASE',
      currentPlayer: null,
      actionNumber: 1,
      firstPlayer: state.firstPlayer,
      eventStarted: false,
      phaseAdvancePending: null,

      // Keep team names
      teamNames: { ...state.teamNames },

      // Clear tournament data
      mapsBanned: [],
      mapsPicked: [],
      deciderMap: null,
      agentsBanned: [],
      agentPicks: { P1: null, P2: null },

      // Clear OBS timing state
      pendingSelection: null,
      revealedActions: new Set(),

      // Clear history
      actionHistory: [],
      lastError: null,
    };
  }

  /**
   * Set the first player for the tournament
   */
  static setFirstPlayer(state: TournamentState, player: Player): TournamentState {
    const newCurrentPlayer = state.eventStarted
      ? calculateCurrentPlayer(state.actionNumber, player)
      : state.currentPlayer;

    return {
      ...state,
      firstPlayer: player,
      currentPlayer: newCurrentPlayer,
      lastError: null,
    };
  }

  /**
   * Set a player's display name
   */
  static setPlayerName(state: TournamentState, player: Player, name: string): TournamentState {
    return {
      ...state,
      teamNames: {
        ...state.teamNames,
        [player]: name,
      },
      lastError: null,
    };
  }

  /**
   * Set pending selection (selected but not yet revealed)
   */
  static setPendingSelection(state: TournamentState, assetName: string | null): TournamentState {
    return {
      ...state,
      pendingSelection: assetName,
      lastError: null,
    };
  }

  /**
   * Clear revealed flag for a specific action (useful when rewinding)
   */
  static clearRevealedAction(state: TournamentState, actionNumber: number): TournamentState {
    const newRevealed = new Set(state.revealedActions);
    newRevealed.delete(actionNumber);
    return {
      ...state,
      revealedActions: newRevealed,
    };
  }

  /**
   * Set error message
   */
  static setError(state: TournamentState, error: string | null): TournamentState {
    return {
      ...state,
      lastError: error,
    };
  }

  /**
   * Validate if selection can be attempted (pre-timer checks)
   */
  static canAttemptSelection(state: TournamentState): ValidationResult {
    if (state.phaseAdvancePending) {
      return { valid: false, error: 'Next phase is ready. Click ADVANCE PHASE to continue.' };
    }
    if (!state.eventStarted) {
      return { valid: false, error: 'Event not started. Click START EVENT to begin turn 1.' };
    }
    if (state.pendingSelection) {
      return {
        valid: false,
        error: 'A selection is already pending. Reset the turn to change it.',
      };
    }
    return { valid: true };
  }
}
