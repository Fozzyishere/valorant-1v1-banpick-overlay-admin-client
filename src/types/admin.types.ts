// TypeScript types for OBS Admin Client - Four Panel System

// Core tournament types
export type Player = 'P1' | 'P2';
export type TournamentPhase = 'MAP_BAN' | 'MAP_PICK' | 'AGENT_BAN' | 'AGENT_PICK' | 'CONCLUSION';
export type ActionType = 'MAP_BAN' | 'MAP_PICK' | 'DECIDER' | 'AGENT_BAN' | 'AGENT_PICK';

// Timer states
export type TimerState = 'ready' | 'running' | 'paused' | 'finished';

// Asset types
export type MapName = 'abyss' | 'ascent' | 'bind' | 'breeze' | 'corrode' | 'fracture' | 
                     'haven' | 'icebox' | 'lotus' | 'pearl' | 'split' | 'sunset';

export type AgentName = 'astra' | 'breach' | 'brimstone' | 'chamber' | 'clove' | 'cypher' | 
                       'deadlock' | 'fade' | 'gekko' | 'harbor' | 'iso' | 'jett' | 'kayo' | 
                       'killjoy' | 'neon' | 'omen' | 'phoenix' | 'raze' | 'reyna' | 'sage' | 
                       'skye' | 'sova' | 'tejo' | 'viper' | 'vyse' | 'waylay' | 'yoru';

// Tournament action tracking
export interface TournamentAction {
  actionNumber: number; // 1-17
  player: Player;
  actionType: ActionType;
  selection: string; // MapName or AgentName
  timestamp: number;
}

// Asset selection tracking
export interface AssetSelection {
  name: string;
  player: Player;
}

// Complete tournament state interface
export interface TournamentState {
  // Phase and turn tracking
  currentPhase: TournamentPhase;
  currentPlayer: Player | null;
  actionNumber: number; // 1-17 total actions
  firstPlayer: Player; // Tournament starter (P1 or P2)
  
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
  
  // Independent timer state
  timerState: TimerState;
  timerSeconds: number; // Current countdown value
  timerInterval: NodeJS.Timeout | null; // For cleanup
  
  // Action history for undo and debugging
  actionHistory: TournamentAction[];
  
  // UI state
  isInitialized: boolean;
  lastError: string | null;
}

// Action creators interface
export interface TournamentActions {
  // Player setup
  setFirstPlayer: (player: Player) => void;
  setPlayerName: (player: Player, name: string) => void;
  
  // Turn control
  startEvent: () => void;
  nextTurn: () => void;
  prevTurn: () => void;
  resetTurn: () => void;
  
  // Asset selection
  selectAsset: (assetName: string) => void;
  
  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  
  // Tournament management
  resetTournament: () => void;
  undoLastAction: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
}

// Combined store type
export type TournamentStore = TournamentState & TournamentActions;

// Helper types for turn logic
export interface TurnInfo {
  actionNumber: number;
  player: Player;
  phase: TournamentPhase;
  actionType: ActionType;
  description: string; // e.g., "Turn 5: P2 Map Ban"
}

// Asset availability types
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