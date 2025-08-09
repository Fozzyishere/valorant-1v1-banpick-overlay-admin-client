import { useTournamentStore } from '../services/adminStore';
import { getTurnInfo } from '../utils/tournamentHelpers';

export function TurnControlPanel() {
  const {
    firstPlayer,
    teamNames,
    actionNumber,
    eventStarted,
    setFirstPlayer,
    setPlayerName,
    resetTournament
  } = useTournamentStore();

  const turnInfo = getTurnInfo(actionNumber, firstPlayer);

  return (
    <div className="flex flex-col space-y-6">
      <h2 className="text-lg font-semibold text-tokyo-text tracking-tight">Turn Control</h2>
      
      {/* Player Setup Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-tokyo-text-muted">Player Setup</h3>
          {eventStarted && (
            <div className="flex items-center space-x-1 text-xs text-tokyo-orange">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M10 2C8.9 2 8 2.9 8 4v2c-1.1 0-2 0.9-2 2v8c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2V8c0-1.1-0.9-2-2-2V4c0-1.1-0.9-2-2-2zm2 6V4c0-1.1-0.9-2-2-2s-2 0.9-2 2v4h4z"/>
              </svg>
              <span>Settings Locked</span>
            </div>
          )}
        </div>
        
        {/* First Player Selection */}
        <div>
          <label className="text-sm text-tokyo-text-dim mb-2 block">
            First Player:
            {eventStarted && <span className="ml-2 text-xs text-tokyo-orange">(Locked)</span>}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="firstPlayer"
                value="P1"
                checked={firstPlayer === 'P1'}
                onChange={() => setFirstPlayer('P1')}
                disabled={eventStarted}
                className={`mr-2 ${eventStarted ? 'cursor-not-allowed opacity-50' : ''}`}
              />
              <span className={`text-tokyo-text ${eventStarted ? 'opacity-50' : ''}`}>P1</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="firstPlayer"
                value="P2"
                checked={firstPlayer === 'P2'}
                onChange={() => setFirstPlayer('P2')}
                disabled={eventStarted}
                className={`mr-2 ${eventStarted ? 'cursor-not-allowed opacity-50' : ''}`}
              />
              <span className={`text-tokyo-text ${eventStarted ? 'opacity-50' : ''}`}>P2</span>
            </label>
          </div>
        </div>
        
        {/* Player Name Inputs */}
        <div className="space-y-2">
          <div>
            <label className="text-sm text-tokyo-text-dim block mb-1">
              P1 Name:
              {eventStarted && <span className="ml-2 text-xs text-tokyo-orange">(Locked)</span>}
            </label>
            <input
              type="text"
              value={teamNames.P1}
              onChange={(e) => setPlayerName('P1', e.target.value)}
              disabled={eventStarted}
              className={`w-full px-2 py-1 border rounded text-sm transition-colors ${
                eventStarted 
                  ? 'bg-tokyo-surface border-tokyo-border text-tokyo-text-dim cursor-not-allowed opacity-60' 
                  : 'bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text hover:border-tokyo-border focus:border-tokyo-blue focus:ring-1 focus:ring-tokyo-blue'
              }`}
              placeholder="Player 1"
            />
          </div>
          <div>
            <label className="text-sm text-tokyo-text-dim block mb-1">
              P2 Name:
              {eventStarted && <span className="ml-2 text-xs text-tokyo-orange">(Locked)</span>}
            </label>
            <input
              type="text"
              value={teamNames.P2}
              onChange={(e) => setPlayerName('P2', e.target.value)}
              disabled={eventStarted}
              className={`w-full px-2 py-1 border rounded text-sm transition-colors ${
                eventStarted 
                  ? 'bg-tokyo-surface border-tokyo-border text-tokyo-text-dim cursor-not-allowed opacity-60' 
                  : 'bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text hover:border-tokyo-border focus:border-tokyo-blue focus:ring-1 focus:ring-tokyo-blue'
              }`}
              placeholder="Player 2"
            />
          </div>
        </div>
      </div>
      
      {/* Current Turn Display */}
      <div className="bg-tokyo-surface-light p-3 rounded">
        <div className="text-sm text-tokyo-text-dim mb-1">Current:</div>
        <div className="text-tokyo-text font-medium">{turnInfo.description}</div>
      </div>
      
      {/* Simplified Controls */}
      <div className="space-y-3">
        <div className="text-xs text-tokyo-text-dim">
          Turn progression happens automatically upon confirming a selection.
        </div>
        {eventStarted && (
          <div className="bg-tokyo-orange/10 border border-tokyo-orange/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 fill-current text-tokyo-orange mt-0.5 flex-shrink-0" viewBox="0 0 20 20">
                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
              </svg>
              <div className="text-xs text-tokyo-orange">
                <div className="font-medium mb-1">Tournament In Progress</div>
                <div>Player settings are locked. Use "RESET TOURNAMENT" to unlock and configure players.</div>
              </div>
            </div>
          </div>
        )}
        <div>
          <button
            onClick={resetTournament}
            className="w-full px-4 py-2 bg-tokyo-red hover:bg-tokyo-pink text-white rounded text-sm font-medium transition-colors"
          >
            RESET TOURNAMENT
          </button>
        </div>
      </div>
      
      {/* Error moved to Timer Panel */}
    </div>
  );
}