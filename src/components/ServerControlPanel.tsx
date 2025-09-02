import { useState, useEffect, useRef } from 'react';
import { serverService, ServerStatus, PlayerInfo, ServerError } from '../services/serverService';

export function ServerControlPanel() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverPort, setServerPort] = useState(3001);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Initialize server status polling
  useEffect(() => {
    let mounted = true;

    const initializeStatus = async () => {
      try {
        const status = await serverService.getServerStatus();
        if (mounted) {
          setServerStatus(status);
          if (status.running) {
            startPolling();
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to get initial server status');
          console.warn('Server status initialization failed:', err);
        }
      }
    };

    initializeStatus();

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        serverService.stopStatusPolling(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingInterval) return; // Already polling

    const interval = serverService.startStatusPolling(2000); // Poll every 2 seconds
    setPollingInterval(interval);
    pollingIntervalRef.current = interval;

    // Set up event listeners
    serverService.on('status-update', (status: ServerStatus) => {
      setServerStatus(status);
    });

    serverService.on('players-update', (players: PlayerInfo[]) => {
      setConnectedPlayers(players);
    });

    serverService.on('server-error', (error: ServerError) => {
      setError(error.message);
    });
  };

  const stopPolling = () => {
    if (pollingInterval) {
      serverService.stopStatusPolling(pollingInterval);
      setPollingInterval(null);
      pollingIntervalRef.current = null;
      setConnectedPlayers([]);
    }
  };

  const handleStartServer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const portValidation = serverService.validatePort(serverPort);
      if (!portValidation.valid) {
        setError(portValidation.error || 'Invalid port');
        setIsLoading(false);
        return;
      }

      await serverService.startServer(serverPort);
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serverService.stopServer();
      stopPolling();
      setServerStatus(prev => prev ? { ...prev, running: false, player_count: 0 } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartServer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await serverService.restartServer(serverPort);
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart server');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!serverStatus) return 'text-tokyo-text-dim';
    return serverStatus.running ? 'text-tokyo-teal' : 'text-tokyo-red';
  };

  const getStatusText = () => {
    if (!serverStatus) return 'Unknown';
    return serverStatus.running ? 'Running' : 'Stopped';
  };

  const formatPlayerName = (player: PlayerInfo) => {
    const playerRole = player.player_id || 'Unassigned';
    return `${playerRole}: ${player.name}`;
  };

  return (
    <div className="flex flex-col h-full items-stretch space-y-3">
      <h2 className="text-lg font-semibold text-tokyo-text tracking-tight">Tournament Server</h2>

      {/* Server Status Display */}
      <div className="text-xs bg-tokyo-surface-light border border-tokyo-border-light rounded p-2">
        <div className="text-tokyo-text-dim">Status:</div>
        <div className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
          {serverStatus?.running && (
            <span className="text-tokyo-text-dim ml-2">
              (Port {serverStatus.port})
            </span>
          )}
        </div>
      </div>

      {/* Port Configuration */}
      <div className="space-y-2">
        <label htmlFor="server-port" className="text-xs text-tokyo-text-dim">
          Server Port:
        </label>
        <input
          id="server-port"
          type="number"
          min="1024"
          max="65535"
          value={serverPort}
          onChange={(e) => setServerPort(parseInt(e.target.value) || 3001)}
          disabled={serverStatus?.running || isLoading}
          className="w-full px-3 py-2 text-sm bg-tokyo-background border border-tokyo-border rounded focus:outline-none focus:ring-2 focus:ring-tokyo-accent/50 focus:border-tokyo-accent disabled:bg-tokyo-border disabled:cursor-not-allowed"
          placeholder="3001"
        />
      </div>

      {/* Server Controls */}
      <div className="flex flex-col space-y-2 w-full">
        {!serverStatus?.running ? (
          <button
            onClick={handleStartServer}
            disabled={isLoading}
            className="px-4 py-2 bg-tokyo-teal hover:bg-tokyo-green disabled:bg-tokyo-border disabled:cursor-not-allowed text-tokyo-background rounded font-medium transition-colors"
          >
            {isLoading ? 'STARTING...' : 'START SERVER'}
          </button>
        ) : (
          <button
            onClick={handleStopServer}
            disabled={isLoading}
            className="px-4 py-2 bg-tokyo-red hover:bg-tokyo-pink disabled:bg-tokyo-border disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            {isLoading ? 'STOPPING...' : 'STOP SERVER'}
          </button>
        )}

        <button
          onClick={handleRestartServer}
          disabled={isLoading || !serverStatus}
          className="px-4 py-2 bg-tokyo-yellow hover:bg-tokyo-orange disabled:bg-tokyo-border disabled:cursor-not-allowed text-tokyo-background rounded font-medium transition-colors"
        >
          {isLoading ? 'RESTARTING...' : 'RESTART SERVER'}
        </button>
      </div>

      {/* Connected Players */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-tokyo-text">Connected Players</h3>
          <span className="text-xs px-2 py-1 bg-tokyo-surface-light border border-tokyo-border-light rounded text-tokyo-text-dim">
            {serverStatus?.player_count || 0}/2
          </span>
        </div>

        {connectedPlayers.length > 0 ? (
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {connectedPlayers.map((player) => (
              <div
                key={player.socket_id}
                className="flex items-center justify-between text-xs bg-tokyo-background border border-tokyo-border rounded px-2 py-1"
              >
                <span className="text-tokyo-text truncate flex-1 mr-2">
                  {formatPlayerName(player)}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    player.player_id === 'P1'
                      ? 'bg-tokyo-blue/20 text-tokyo-blue'
                      : player.player_id === 'P2'
                      ? 'bg-tokyo-orange/20 text-tokyo-orange'
                      : 'bg-tokyo-text-dim/20 text-tokyo-text-dim'
                  }`}
                >
                  {player.player_id || 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-tokyo-text-dim text-center py-2 bg-tokyo-surface-light border border-tokyo-border-light rounded">
            {serverStatus?.running ? 'No players connected' : 'Server not running'}
          </div>
        )}
      </div>

      {/* Connection Information */}
      {serverStatus?.running && (
        <div className="text-xs bg-tokyo-surface-light border border-tokyo-border-light rounded p-2">
          <div className="text-tokyo-text-dim mb-1">Connection URL:</div>
          <div 
            className="font-mono text-tokyo-text break-all cursor-pointer hover:text-tokyo-accent transition-colors"
            onClick={() => navigator.clipboard.writeText(`http://localhost:${serverStatus.port}`)}
            title="Click to copy"
          >
            http://localhost:{serverStatus.port}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-tokyo-red/10 border border-tokyo-red/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 fill-current text-tokyo-red mt-0.5 flex-shrink-0" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
            </svg>
            <div className="text-xs text-tokyo-red">
              <div className="font-medium mb-1">Server Error</div>
              <div>{error}</div>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-tokyo-red hover:text-tokyo-pink transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Server Info */}
      {serverStatus && (
        <div className="text-xs text-tokyo-text-dim">
          <div>Server ID: {serverStatus.server_id.substring(0, 8)}...</div>
        </div>
      )}
    </div>
  );
}