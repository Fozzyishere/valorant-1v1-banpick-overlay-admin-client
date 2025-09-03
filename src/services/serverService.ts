import { invoke } from '@tauri-apps/api/core';

// Network port constants
const MIN_PORT = 1024;  // Minimum non-privileged port
const MAX_PORT = 65535; // Maximum valid port number

// Types matching Rust backend
export interface ServerStatus {
  running: boolean;
  port: number;
  player_count: number;
  server_id: string;
}

export interface PlayerInfo {
  name: string;
  socket_id: string;
  player_id: string | null; // "P1" or "P2"
  connected: boolean;
  connection_time: number;
}

export interface TournamentState {
  current_phase: string;
  current_player: string | null;
  action_number: number;
  first_player: string;
  event_started: boolean | null;
  team_names: Record<string, string>;
  maps_banned: Array<{ name: string; player: string }>;
  maps_picked: Array<{ name: string; player: string }>;
  decider_map: string | null;
  agents_banned: Array<{ name: string; player: string }>;
  agent_picks: Record<string, string | null>;
  timer_state: string;
  timer_seconds: number;
  pending_selection: string | null;
  revealed_actions: number[];
  action_history: Array<{
    action_number: number;
    player: string;
    action_type: string;
    selection: string;
    timestamp: number;
  }>;
}

export interface ServerError {
  message: string;
  code?: string;
}

export interface TimerControlEvent {
  action: string;        // "PAUSE" | "RESUME" | "STOP" | "EXTEND"
  timeRemaining?: number;
}

export interface TournamentResults {
  winner?: string;       // "P1" | "P2"
  finalMap: string;
  finalAgents: Record<string, string>; // P1/P2 -> agent
  duration: number;      // Tournament duration in seconds
  summary: string;
}

class ServerService {
  private listeners: Map<string, Function[]> = new Map();

  // Server lifecycle management
  async startServer(port: number = 3001): Promise<string> {
    try {
      const result = await invoke<string>('start_tournament_server', { port });
      this.emit('server-started', { port });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const serverError: ServerError = {
        message: errorMessage,
        code: 'START_FAILED'
      };
      this.emit('server-error', serverError);
      throw new Error(`Failed to start server: ${errorMessage}`);
    }
  }

  async stopServer(): Promise<string> {
    try {
      const result = await invoke<string>('stop_tournament_server');
      this.emit('server-stopped');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const serverError: ServerError = {
        message: errorMessage,
        code: 'STOP_FAILED'
      };
      this.emit('server-error', serverError);
      throw new Error(`Failed to stop server: ${errorMessage}`);
    }
  }

  async getServerStatus(): Promise<ServerStatus> {
    try {
      return await invoke<ServerStatus>('get_server_status');
    } catch (error) {
      throw new Error(`Failed to get server status: ${error}`);
    }
  }

  async getConnectedPlayers(): Promise<PlayerInfo[]> {
    try {
      return await invoke<PlayerInfo[]>('get_connected_players');
    } catch (error) {
      throw new Error(`Failed to get connected players: ${error}`);
    }
  }

  async broadcastTournamentState(state: TournamentState): Promise<void> {
    try {
      await invoke('broadcast_tournament_state', { tournamentState: state });
    } catch (error) {
      throw new Error(`Failed to broadcast tournament state: ${error}`);
    }
  }

  async sendTurnStart(tournamentState: TournamentState, targetPlayer: string, timeLimit: number): Promise<void> {
    try {
      await invoke('send_turn_start', { 
        tournamentState, 
        targetPlayer, 
        timeLimit 
      });
    } catch (error) {
      throw new Error(`Failed to send turn start: ${error}`);
    }
  }

  async sendTimerControl(control: TimerControlEvent): Promise<void> {
    try {
      await invoke('send_timer_control', { control });
    } catch (error) {
      throw new Error(`Failed to send timer control: ${error}`);
    }
  }

  async sendTournamentStart(tournamentState: TournamentState): Promise<void> {
    try {
      await invoke('send_tournament_start', { tournamentState });
    } catch (error) {
      throw new Error(`Failed to send tournament start: ${error}`);
    }
  }

  async sendTournamentEnd(results: TournamentResults): Promise<void> {
    try {
      await invoke('send_tournament_end', { results });
    } catch (error) {
      throw new Error(`Failed to send tournament end: ${error}`);
    }
  }

  // Status polling for real-time updates
  startStatusPolling(intervalMs: number = 1000): number {
    return setInterval(async () => {
      try {
        const status = await this.getServerStatus();
        this.emit('status-update', status);

        const players = await this.getConnectedPlayers();
        this.emit('players-update', players);
      } catch (error) {
        console.warn('Status polling error:', error);
      }
    }, intervalMs);
  }

  stopStatusPolling(intervalId: number): void {
    clearInterval(intervalId);
  }

  // Event system for real-time updates
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Server service event callback error:', error);
        }
      });
    }
  }

  async isServerRunning(): Promise<boolean> {
    try {
      const status = await this.getServerStatus();
      return status.running;
    } catch (error) {
      return false;
    }
  }

  async getPlayerCount(): Promise<number> {
    try {
      const status = await this.getServerStatus();
      return status.player_count;
    } catch (error) {
      return 0;
    }
  }

  async restartServer(port: number = 3001): Promise<string> {
    try {
      // Stop first if running
      const isRunning = await this.isServerRunning();
      if (isRunning) {
        await this.stopServer();
        // Wait a bit before restarting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return await this.startServer(port);
    } catch (error) {
      throw new Error(`Failed to restart server: ${error}`);
    }
  }

  // Validate server configuration
  validatePort(port: number): { valid: boolean; error?: string } {
    if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
      return {
        valid: false,
        error: `Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`
      };
    }
    return { valid: true };
  }
}

export const serverService = new ServerService();

// Types are already exported above as interfaces