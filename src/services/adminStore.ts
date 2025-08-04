// Zustand store for OBS Admin Client - Tournament Management

import { create } from 'zustand';
import type { 
  TournamentStore,
  Player,
  TournamentAction,
  AssetSelection
} from '../types/admin.types';
import {
  calculateCurrentPlayer,
  getCurrentPhase,
  getActionType,
  validateTurnTransition,
  getPhaseStartAction,
  isMapPhase,
  isAgentPhase,
  getAvailableAssets
} from '../utils/tournamentHelpers';

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  // Initial tournament state
  currentPhase: 'MAP_BAN',
  currentPlayer: 'P1',
  actionNumber: 1,
  firstPlayer: 'P1',
  
  // Team configuration
  teamNames: {
    P1: 'Player 1',
    P2: 'Player 2'
  },
  
  // Tournament data
  mapsBanned: [],
  mapsPicked: [],
  deciderMap: null,
  agentsBanned: [],
  agentPicks: {
    P1: null,
    P2: null
  },
  
  // Independent timer state
  timerState: 'ready',
  timerSeconds: 30,
  timerInterval: null,
  
  // History and UI state
  actionHistory: [],
  isInitialized: true,
  lastError: null,

  // Player setup actions
  setFirstPlayer: (player: Player) => {
    set((state) => {
      const newCurrentPlayer = calculateCurrentPlayer(state.actionNumber, player);
      return {
        firstPlayer: player,
        currentPlayer: newCurrentPlayer,
        lastError: null
      };
    });
  },

  setPlayerName: (player: Player, name: string) => {
    set((state) => ({
      teamNames: {
        ...state.teamNames,
        [player]: name.trim() || `Player ${player.slice(1)}`
      },
      lastError: null
    }));
  },

  // Turn control actions
  nextTurn: () => {
    set((state) => {
      const targetAction = state.actionNumber + 1;
      
      // Don't advance beyond action 17
      if (targetAction > 17) {
        return {
          ...state,
          currentPhase: 'CONCLUSION',
          currentPlayer: null,
          lastError: null
        };
      }
      
      // Validate transition
      const maxCompleted = state.actionHistory.length;
      const validation = validateTurnTransition(state.actionNumber, targetAction, maxCompleted);
      
      if (!validation.valid) {
        return { ...state, lastError: validation.error };
      }
      
      // Calculate new state
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);
      
      return {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        lastError: null
      };
    });
  },

  prevTurn: () => {
    set((state) => {
      const targetAction = state.actionNumber - 1;
      
      // Don't go below action 1
      if (targetAction < 1) {
        return { ...state, lastError: 'Cannot go before action 1' };
      }
      
      // Calculate new state
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);
      
      return {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        lastError: null
      };
    });
  },

  resetTurn: () => {
    set((state) => {
      const phaseStartAction = getPhaseStartAction(state.actionNumber);
      
      // If already at phase start, reset to action 1
      const targetAction = state.actionNumber === phaseStartAction ? 1 : phaseStartAction;
      
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);
      
      return {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        lastError: null
      };
    });
  },

  // Asset selection action
  selectAsset: (assetName: string) => {
    set((state) => {
      const currentAction = state.actionNumber;
      const currentPlayer = state.currentPlayer;
      
      if (!currentPlayer) {
        return { ...state, lastError: 'No active player for selection' };
      }
      
      const actionType = getActionType(currentAction);
      const timestamp = Date.now();
      
      // Create new action record
      const newAction: TournamentAction = {
        actionNumber: currentAction,
        player: currentPlayer,
        actionType,
        selection: assetName,
        timestamp
      };
      
      // Create asset selection record
      const assetSelection: AssetSelection = {
        name: assetName,
        player: currentPlayer
      };
      
      // Update state based on action type
      let newState = { ...state };
      
      switch (actionType) {
        case 'MAP_BAN':
          newState.mapsBanned = [...state.mapsBanned, assetSelection];
          break;
          
        case 'MAP_PICK':
          newState.mapsPicked = [...state.mapsPicked, assetSelection];
          break;
          
        case 'DECIDER':
          // Validate that asset is from picked maps
          const pickedMapNames = state.mapsPicked.map(pick => pick.name);
          if (!pickedMapNames.includes(assetName)) {
            return { ...state, lastError: 'Decider must be selected from picked maps' };
          }
          newState.deciderMap = assetName;
          break;
          
        case 'AGENT_BAN':
          newState.agentsBanned = [...state.agentsBanned, assetSelection];
          break;
          
        case 'AGENT_PICK':
          newState.agentPicks = {
            ...state.agentPicks,
            [currentPlayer]: assetName
          };
          break;
          
        default:
          return { ...state, lastError: `Invalid action type: ${actionType}` };
      }
      
      // Add to history
      newState.actionHistory = [...state.actionHistory, newAction];
      newState.lastError = null;
      
      return newState;
    });
  },

  // Timer controls (independent system)
  startTimer: () => {
    set((state) => {
      // Clear existing interval if any
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      
      // Start countdown from current seconds
      const interval = setInterval(() => {
        set((currentState) => {
          const newSeconds = currentState.timerSeconds - 1;
          
          if (newSeconds <= 0) {
            // Timer finished
            if (currentState.timerInterval) {
              clearInterval(currentState.timerInterval);
            }
            return {
              ...currentState,
              timerSeconds: 0,
              timerState: 'finished',
              timerInterval: null
            };
          }
          
          return {
            ...currentState,
            timerSeconds: newSeconds
          };
        });
      }, 1000);
      
      return {
        ...state,
        timerState: 'running',
        timerInterval: interval,
        lastError: null
      };
    });
  },

  pauseTimer: () => {
    set((state) => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      
      const newState = state.timerState === 'running' ? 'paused' : 'running';
      
      if (newState === 'running') {
        // Resume timer
        get().startTimer();
        return state; // startTimer will update the state
      }
      
      return {
        ...state,
        timerState: 'paused',
        timerInterval: null,
        lastError: null
      };
    });
  },

  resetTimer: () => {
    set((state) => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      
      return {
        ...state,
        timerState: 'ready',
        timerSeconds: 30,
        timerInterval: null,
        lastError: null
      };
    });
  },

  // Tournament management
  resetTournament: () => {
    set((state) => {
      // Clear timer interval
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      
      return {
        // Reset tournament state
        currentPhase: 'MAP_BAN',
        currentPlayer: state.firstPlayer, // Preserve first player selection
        actionNumber: 1,
        
        // Keep team names and first player
        teamNames: state.teamNames,
        firstPlayer: state.firstPlayer,
        
        // Clear tournament data
        mapsBanned: [],
        mapsPicked: [],
        deciderMap: null,
        agentsBanned: [],
        agentPicks: { P1: null, P2: null },
        
        // Reset timer
        timerState: 'ready',
        timerSeconds: 30,
        timerInterval: null,
        
        // Clear history
        actionHistory: [],
        isInitialized: true,
        lastError: null
      };
    });
  },

  undoLastAction: () => {
    set((state) => {
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
            ban => !(ban.name === lastAction.selection && ban.player === lastAction.player)
          );
          break;
          
        case 'MAP_PICK':
          newState.mapsPicked = state.mapsPicked.filter(
            pick => !(pick.name === lastAction.selection && pick.player === lastAction.player)
          );
          break;
          
        case 'DECIDER':
          newState.deciderMap = null;
          break;
          
        case 'AGENT_BAN':
          newState.agentsBanned = state.agentsBanned.filter(
            ban => !(ban.name === lastAction.selection && ban.player === lastAction.player)
          );
          break;
          
        case 'AGENT_PICK':
          newState.agentPicks = {
            ...state.agentPicks,
            [lastAction.player]: null
          };
          break;
      }
      
      newState.lastError = null;
      return newState;
    });
  },

  // Error handling
  setError: (error: string | null) => {
    set({ lastError: error });
  }
}));