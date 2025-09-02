// Zustand store for OBS Admin Client - Tournament Management

import { create } from 'zustand';
import type { 
  TournamentStore,
  Player,
  TournamentAction,
  AssetSelection
} from '../types/admin.types';
import { serverService, TournamentState } from './serverService';
import {
  calculateCurrentPlayer,
  getCurrentPhase,
  getActionType
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

// Tauri event emission for overlay updates AND Socket.IO broadcasting
const emitOverlayUpdate = async (state: any) => {
  // Existing overlay update for OBS integration
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const overlayData = transformToOverlayFormat(state);
      await (window as any).__TAURI__.event.emit('tournament-update', overlayData);
    } catch (error) {
      console.error('Error emitting overlay update:', error);
    }
  }

  try {
    // Transform admin state to Socket.IO format
    const tournamentState: TournamentState = {
      current_phase: state.currentPhase,
      current_player: state.currentPlayer,
      action_number: state.actionNumber,
      first_player: state.firstPlayer,
      event_started: state.eventStarted,
      team_names: {
        P1: state.teamNames?.P1 || 'Team 1',
        P2: state.teamNames?.P2 || 'Team 2'
      },
      maps_banned: state.mapsBanned.map((ban: AssetSelection) => ({
        name: ban.name,
        player: ban.player
      })),
      maps_picked: state.mapsPicked.map((pick: AssetSelection) => ({
        name: pick.name,
        player: pick.player
      })),
      decider_map: state.deciderMap,
      agents_banned: state.agentsBanned.map((ban: AssetSelection) => ({
        name: ban.name,
        player: ban.player
      })),
      agent_picks: {
        P1: state.agentPicks.P1,
        P2: state.agentPicks.P2
      },
      timer_state: state.timerState,
      timer_seconds: state.timerSeconds,
      pending_selection: state.pendingSelection,
      revealed_actions: state.revealedActions,
      action_history: state.actionHistory.map((action: TournamentAction) => ({
        action_number: action.actionNumber,
        player: action.player,
        action_type: action.actionType,
        selection: action.selection,
        timestamp: action.timestamp
      }))
    };

    // Broadcast to connected players via Socket.IO server
    await serverService.broadcastTournamentState(tournamentState);
  } catch (error) {
    // TODO: Implement proper error handling for Socket.IO broadcast failures
    console.warn('Socket.IO broadcast failed (server may not be running):', error);
  }
};

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  // Initial tournament state
  currentPhase: 'MAP_PHASE',
  currentPlayer: 'P1',
  actionNumber: 1,
  firstPlayer: 'P1',
  eventStarted: false,
  // Manual phase advancement gating
  phaseAdvancePending: null,
  
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
      // Allow empty string so user can clear the input before typing a new name
      const newState = {
        ...state,
        teamNames: {
          ...state.teamNames,
          [player]: name
        },
        lastError: null
      } as TournamentStore;
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  // Turn control actions
  nextTurn: () => {
    // Deprecated: explicit NEXT turn navigation removed in favor of confirm-on-selection
  },

  prevTurn: () => {
    // Deprecated: explicit PREV turn navigation removed in favor of confirm-on-selection
  },

  // Auto-advance after successful, revealed selection when timer completes
  autoAdvanceTurn: () => {
    set((state) => {
      const targetAction = state.actionNumber + 1;
      // Don't advance beyond action 17
      if (targetAction > 17) {
        // Gate entering CONCLUSION until manual advance
        const gated: TournamentStore = {
          ...state,
          phaseAdvancePending: 'CONCLUSION',
          pendingSelection: null,
          timerState: 'ready',
          timerSeconds: 3,
          lastError: null
        } as TournamentStore;
        emitOverlayUpdate(gated);
        return gated;
      }
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = getCurrentPhase(targetAction);
      // If phase changes, gate advancement until admin approves
      // With streamlined phases, transitions happen at: action 9→10 (MAP_PHASE→AGENT_PHASE)
      if (newPhase !== state.currentPhase) {
        const gated: TournamentStore = {
          ...state,
          phaseAdvancePending: newPhase,
          pendingSelection: null,
          timerState: 'ready',
          timerSeconds: 3,
          lastError: null
        } as TournamentStore;
        emitOverlayUpdate(gated);
        return gated;
      }
      // Same-phase auto-advance as usual
      const adv: TournamentStore = {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        pendingSelection: null,
        timerState: 'ready',
        timerSeconds: 3,
        lastError: null
      } as TournamentStore;
      emitOverlayUpdate(adv);
      return adv;
    });
  },

  // Manual phase advancement when gated
  advancePhase: () => {
    set((state) => {
      if (!state.phaseAdvancePending) return state;
      const targetAction = state.actionNumber + 1;
      // Entering CONCLUSION: no further actions
      if (state.phaseAdvancePending === 'CONCLUSION' || targetAction > 17) {
        const finished: TournamentStore = {
          ...state,
          currentPhase: 'CONCLUSION',
          currentPlayer: null,
          phaseAdvancePending: null,
          pendingSelection: null,
          timerState: 'ready',
          timerSeconds: 3,
          lastError: null
        } as TournamentStore;
        emitOverlayUpdate(finished);
        return finished;
      }
      const newCurrentPlayer = calculateCurrentPlayer(targetAction, state.firstPlayer);
      const newPhase = state.phaseAdvancePending;
      const adv: TournamentStore = {
        ...state,
        actionNumber: targetAction,
        currentPlayer: newCurrentPlayer,
        currentPhase: newPhase,
        phaseAdvancePending: null,
        pendingSelection: null,
        timerState: 'ready',
        timerSeconds: 3,
        lastError: null
      } as TournamentStore;
      emitOverlayUpdate(adv);
      return adv;
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
        phaseAdvancePending: null,
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
      }

      // Always clear revealed flag for current action on reset
      {
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
      
      // If timer already finished, auto-advance turn immediately
      if (state.timerState === 'finished') {
        // Defer to allow state commit
        setTimeout(() => get().autoAdvanceTurn(), 0);
      }

      emitOverlayUpdate(newState);
      return newState;
    });
  },

  // Selection attempt with gating rules
  attemptSelection: (assetName: string) => {
    set((state) => {
      // Phase advance pending blocks further selections
      if (state.phaseAdvancePending) {
        return { ...state, lastError: 'Next phase is ready. Click ADVANCE PHASE to continue.' };
      }
      // Event must be started
      if (!state.eventStarted) {
        return { ...state, lastError: 'Event not started. Click START EVENT to begin turn 1.' };
      }
      // Timer must have started
      if (state.timerState === 'ready') {
        return { ...state, lastError: 'Start the timer before selecting a result for this turn.' };
      }
      // If rewound/reset, ensure previously revealed flag is cleared for this action
      if (state.revealedActions.has(state.actionNumber)) {
        const newRevealed = new Set(state.revealedActions);
        newRevealed.delete(state.actionNumber);
        return { ...state, revealedActions: newRevealed, lastError: null } as TournamentStore;
      }
      // If already revealed for this turn, block further selections
      // (handled above)
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
      // Block if awaiting manual phase advancement
      if (state.phaseAdvancePending) {
        return { ...state, lastError: 'Next phase is ready. Click ADVANCE PHASE to continue.' };
      }
      // Block if event hasn't started
      if (!state.eventStarted) {
        return { ...state, lastError: 'Event not started. Click START EVENT to begin turn 1.' };
      }
      // If this action was previously revealed (e.g., after rewind), clear it on new timing cycle
      const clearedRevealed = new Set(state.revealedActions);
      if (clearedRevealed.has(state.actionNumber)) {
        clearedRevealed.delete(state.actionNumber);
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
        
        const finishedState = {
              ...currentState,
              timerSeconds: 0,
              timerState: 'finished',
              timerInterval: null
            } as TournamentStore;
            emitOverlayUpdate(finishedState);

        // If selection already revealed for this action, auto-advance after timer end
        if (finishedState.revealedActions.has(finishedState.actionNumber)) {
          setTimeout(() => get().autoAdvanceTurn(), 0);
        }
            return finishedState;
          }
          
          const tickingState = {
            ...currentState,
            timerSeconds: newSeconds
          } as TournamentStore;
          emitOverlayUpdate(tickingState);
          return tickingState;
        });
      }, 1000);
      
      const newState = {
        ...state,
        timerState: 'running',
        timerInterval: interval,
        lastError: null
      } as TournamentStore;
      newState.revealedActions = clearedRevealed;
      emitOverlayUpdate(newState);
      return newState;
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
      
      const newState = {
        ...state,
        timerState: 'paused',
        timerInterval: null,
        lastError: null
      } as TournamentStore;
      emitOverlayUpdate(newState);
      return newState;
    });
  },

  resetTimer: () => {
    set((state) => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      const clearedPending = state.pendingSelection ? 'Timer reset; pending selection cleared. Re-start timer and select again.' : null;
      const newState = {
        ...state,
        timerState: 'ready',
        timerSeconds: 3,
        timerInterval: null,
        pendingSelection: null,
        lastError: clearedPending
      } as TournamentStore;
      emitOverlayUpdate(newState);
      return newState;
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
        currentPhase: 'MAP_PHASE',
        currentPlayer: null,
        actionNumber: 1,
        phaseAdvancePending: null,
        
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