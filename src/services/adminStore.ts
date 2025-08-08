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
  validateTurnTransition
} from '../utils/tournamentHelpers';

// Transform store data to overlay format
const transformToOverlayFormat = (state: any) => {
  // Convert arrays of AssetSelection to P1/P2 object format
  const mapsBannedByPlayer: Record<'P1' | 'P2', string[]> = { P1: [], P2: [] };
  const mapsPicked: Record<'P1' | 'P2', string | null> = { P1: null, P2: null };
  const agentsBannedByPlayer: Record<'P1' | 'P2', string[]> = { P1: [], P2: [] };
  
  // Process maps banned
  state.mapsBanned?.forEach((ban: AssetSelection) => {
    if (ban.player === 'P1' || ban.player === 'P2') {
      mapsBannedByPlayer[ban.player].push(ban.name);
    }
  });
  
  // Process maps picked
  state.mapsPicked?.forEach((pick: AssetSelection) => {
    if (pick.player === 'P1' || pick.player === 'P2') {
      mapsPicked[pick.player] = pick.name;
    }
  });
  
  // Process agents banned
  state.agentsBanned?.forEach((ban: AssetSelection) => {
    if (ban.player === 'P1' || ban.player === 'P2') {
      agentsBannedByPlayer[ban.player].push(ban.name);
    }
  });
  
  return {
    currentPhase: state.currentPhase,
    currentPlayer: state.currentPlayer,
    actionNumber: state.actionNumber,
    teamNames: state.teamNames,
    mapsBanned: mapsBannedByPlayer,
    mapsPicked,
    deciderMap: state.deciderMap,
    agentsBanned: agentsBannedByPlayer,
    agentPicks: state.agentPicks,
    timerState: state.timerState,
    timerSeconds: state.timerSeconds,
    // T7 explicit gating fields
    currentActionPending: state.pendingSelection || null,
    revealedActionNumbers: Array.from(state.revealedActions || [])
  };
};

// Tauri event emission for overlay updates
const emitOverlayUpdate = async (state: any) => {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const overlayData = transformToOverlayFormat(state);
      await (window as any).__TAURI__.event.emit('tournament-update', overlayData);
    } catch (error) {
      console.error('Error emitting overlay update:', error);
    }
  }
};

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  // Initial tournament state
  currentPhase: 'MAP_BAN',
  currentPlayer: 'P1',
  actionNumber: 1,
  firstPlayer: 'P1',
  eventStarted: false,
  
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
  
  // OBS timing flow state
  pendingSelection: null,
  revealedActions: new Set(),
  
  // Independent timer state
  timerState: 'ready',
  timerSeconds: 3,
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
    set((state) => {
      const newState = {
        ...state,
        teamNames: {
          ...state.teamNames,
          [player]: name.trim() || `Player ${player.slice(1)}`
        },
        lastError: null
      };
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  // Turn control actions
  nextTurn: () => {
    set((state) => {
      // Enforce gating: cannot advance while timer running or selection not revealed
      if (state.timerState === 'running' || state.pendingSelection) {
        return { ...state, lastError: 'Complete and reveal this turn before advancing.' };
      }

      if (!state.revealedActions.has(state.actionNumber)) {
        return { ...state, lastError: 'Complete and reveal this turn before advancing.' };
      }

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
      const validation = validateTurnTransition(targetAction, maxCompleted);
      
      if (!validation.valid) {
        return { ...state, lastError: validation.error };
      }
      
      // Calculate new state
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);
      
      const newState: TournamentStore = {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        // Prepare for next turn
        pendingSelection: null,
        timerState: 'ready',
        timerSeconds: 3,
        lastError: null
      };
      
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  prevTurn: () => {
    set((state) => {
      const targetAction = state.actionNumber - 1;
      
      // Don't go below action 1
      if (targetAction < 1) {
        return { ...state, lastError: 'Cannot go before action 1' };
      }

      // Roll back effects of the turn we are going back to (targetAction)
      const actionToRevert = state.actionHistory.find(a => a.actionNumber === targetAction);
      let newState: any = { ...state };

      if (actionToRevert) {
        switch (actionToRevert.actionType) {
          case 'MAP_BAN':
            newState.mapsBanned = state.mapsBanned.filter(
              ban => !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
            );
            break;
          case 'MAP_PICK':
            newState.mapsPicked = state.mapsPicked.filter(
              pick => !(pick.name === actionToRevert.selection && pick.player === actionToRevert.player)
            );
            break;
          case 'DECIDER':
            newState.deciderMap = null;
            break;
          case 'AGENT_BAN':
            newState.agentsBanned = state.agentsBanned.filter(
              ban => !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
            );
            break;
          case 'AGENT_PICK':
            newState.agentPicks = {
              ...state.agentPicks,
              [actionToRevert.player]: null
            };
            break;
        }

        // Remove from history and revealed set
        newState.actionHistory = state.actionHistory.filter(a => a !== actionToRevert);
        const newRevealed = new Set(state.revealedActions);
        newRevealed.delete(targetAction);
        newState.revealedActions = newRevealed;
      }

      // Clear pending and reset timer for safety
      if (newState.timerInterval) clearInterval(newState.timerInterval);
      newState.pendingSelection = null;
      newState.timerState = 'ready';
      newState.timerSeconds = 3;
      
      // Calculate new turn pointers
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);

      newState.actionNumber = targetAction;
      newState.currentPlayer = newCurrentPlayer;
      newState.currentPhase = newPhase;
      newState.lastError = null;
      
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  startEvent: () => {
    set((state) => {
      // Initialize tournament to action 1 with selected first player
      const newCurrentPlayer = calculateCurrentPlayer(1, state.firstPlayer);
      const newPhase = getCurrentPhase(1);
      
      const newState = {
        ...state,
        actionNumber: 1,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        eventStarted: true,
        // Clear all tournament data
        mapsBanned: [],
        mapsPicked: [],
        deciderMap: null,
        agentsBanned: [],
        agentPicks: { P1: null, P2: null },
        actionHistory: [],
        // Keep team setup configuration
        lastError: null
      };
      
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  resetTurn: () => {
    set((state) => {
      // Clear any pending selection and revert any revealed for current action
      const currentAction = state.actionNumber;
      let newState: any = { ...state };
      
      // Clear timer
      if (newState.timerInterval) clearInterval(newState.timerInterval);
      newState.timerState = 'ready';
      newState.timerSeconds = 30;
      
      // Clear pending
      newState.pendingSelection = null;

      // Revert current action if present in history
      const actionToRevert = state.actionHistory.find(a => a.actionNumber === currentAction);
      if (actionToRevert) {
        switch (actionToRevert.actionType) {
          case 'MAP_BAN':
            newState.mapsBanned = state.mapsBanned.filter(
              ban => !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
            );
            break;
          case 'MAP_PICK':
            newState.mapsPicked = state.mapsPicked.filter(
              pick => !(pick.name === actionToRevert.selection && pick.player === actionToRevert.player)
            );
            break;
          case 'DECIDER':
            newState.deciderMap = null;
            break;
          case 'AGENT_BAN':
            newState.agentsBanned = state.agentsBanned.filter(
              ban => !(ban.name === actionToRevert.selection && ban.player === actionToRevert.player)
            );
            break;
          case 'AGENT_PICK':
            newState.agentPicks = {
              ...state.agentPicks,
              [actionToRevert.player]: null
            };
            break;
        }
        newState.actionHistory = state.actionHistory.filter(a => a !== actionToRevert);
        const newRevealed = new Set(state.revealedActions);
        newRevealed.delete(currentAction);
        newState.revealedActions = newRevealed;
      }

      newState.lastError = null;
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  // Asset selection action (internal immediate selection + reveal)
  selectAsset: (assetName: string) => {
    set((state) => {
      const currentPlayer = state.currentPlayer;
      
      if (!currentPlayer) {
        return { ...state, lastError: 'No active player for selection' };
      }
      
      // Prevent multiple confirmations for the same turn
      if (state.revealedActions.has(state.actionNumber)) {
        return { ...state, lastError: 'Selection for this turn already confirmed. Use RESET TURN to change it.' };
      }

      // Also prevent duplicates in history for same action number
      if (state.actionHistory.some(a => a.actionNumber === state.actionNumber)) {
        return { ...state, lastError: 'Selection for this turn already recorded. Use RESET TURN to change it.' };
      }

      const actionType = getActionType(state.actionNumber);
      const timestamp = Date.now();
      
      // Create new action record
      const newAction: TournamentAction = {
        actionNumber: state.actionNumber,
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
      
      // Mark as revealed for overlay
      newState.revealedActions = new Set([...state.revealedActions, state.actionNumber]);
      newState.pendingSelection = null;
      
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  // Selection attempt with gating rules
  attemptSelection: (assetName: string) => {
    set((state) => {
      // Event must be started
      if (!state.eventStarted) {
        return { ...state, lastError: 'Event not started. Click START EVENT to begin turn 1.' };
      }
      // Timer must have started
      if (state.timerState === 'ready') {
        return { ...state, lastError: 'Start the timer before selecting a result for this turn.' };
      }
      // If already revealed for this turn, block further selections
      if (state.revealedActions.has(state.actionNumber)) {
        return { ...state, lastError: 'Selection for this turn already confirmed. Use RESET TURN to change it.' };
      }
      // Pending cannot be changed unless reset
      if (state.pendingSelection) {
        return { ...state, lastError: 'A selection is already pending. Reset the turn to change it.' };
      }
      // If timer finished, select immediately; else set pending
      if (state.timerState === 'finished') {
        // Immediate reveal path, lock selection to avoid double-commit
        const newState = { ...state, pendingSelection: assetName, lastError: null } as TournamentStore;
        setTimeout(() => get().selectAsset(assetName), 0);
        return newState;
      }
      if (state.timerState === 'running' || state.timerState === 'paused') {
        return { ...state, pendingSelection: assetName, lastError: null };
      }
      return state;
    });
  },

  // OBS timing flow asset selection
  selectAssetPending: (assetName: string) => {
    set((state) => {
      return {
        ...state,
        pendingSelection: assetName,
        lastError: null
      };
    });
  },

  revealPendingSelection: () => {
    set((state) => {
      if (!state.pendingSelection) {
        return { ...state, lastError: 'No pending selection to reveal' };
      }
      
      // Use the standard selectAsset logic with the pending selection
      get().selectAsset(state.pendingSelection);
      return state; // selectAsset will handle the state update
    });
  },

  manualReveal: (_assetName: string) => {
    // Deprecated in T7; no-op
  },

  // Timer controls (independent system)
  startTimer: () => {
    set((state) => {
      // Block if event hasn't started
      if (!state.eventStarted) {
        return { ...state, lastError: 'Event not started. Click START EVENT to begin turn 1.' };
      }
      // Clear existing interval if any
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      
      // Start countdown from current seconds
      const interval = setInterval(() => {
        set((currentState) => {
          const newSeconds = currentState.timerSeconds - 1;
          
          if (newSeconds <= 0) {
            // Timer finished - auto-reveal pending selection
            if (currentState.timerInterval) {
              clearInterval(currentState.timerInterval);
            }
            
            // Auto-reveal pending selection if exists (immediate commit)
            if (currentState.pendingSelection) {
              const toReveal = currentState.pendingSelection;
              setTimeout(() => get().selectAsset(toReveal), 0);
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
      if (state.timerState !== 'running') {
        return state;
      }
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
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
      const clearedPending = state.pendingSelection ? 'Timer reset; pending selection cleared. Re-start timer and select again.' : null;
      return {
        ...state,
        timerState: 'ready',
        timerSeconds: 3,
        timerInterval: null,
        pendingSelection: null,
        lastError: clearedPending
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
        currentPlayer: null,
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
        
        // Clear OBS timing state
        pendingSelection: null,
        revealedActions: new Set(),
        
        // Reset timer
        timerState: 'ready',
        timerSeconds: 3,
        timerInterval: null,
        
        // Clear history
        actionHistory: [],
        isInitialized: true,
        lastError: null,
        
        // Event gating
        eventStarted: false
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