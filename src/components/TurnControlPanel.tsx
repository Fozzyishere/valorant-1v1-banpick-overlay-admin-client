import { useTournamentStore } from '../services/adminStore';
import { getTurnInfo } from '../utils/tournamentHelpers';

export function TurnControlPanel() {
  const {
    firstPlayer,
    teamNames,
    actionNumber,
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
        <h3 className="text-md font-medium text-tokyo-text-muted">Player Setup</h3>
        
        {/* First Player Selection */}
        <div>
          <label className="text-sm text-tokyo-text-dim mb-2 block">First Player:</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="firstPlayer"
                value="P1"
                checked={firstPlayer === 'P1'}
                onChange={() => setFirstPlayer('P1')}
                className="mr-2"
              />
              <span className="text-tokyo-text">P1</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="firstPlayer"
                value="P2"
                checked={firstPlayer === 'P2'}
                onChange={() => setFirstPlayer('P2')}
                className="mr-2"
              />
              <span className="text-tokyo-text">P2</span>
            </label>
          </div>
        </div>
        
        {/* Player Name Inputs */}
        <div className="space-y-2">
          <div>
            <label className="text-sm text-tokyo-text-dim block mb-1">P1 Name:</label>
            <input
              type="text"
              value={teamNames.P1}
              onChange={(e) => setPlayerName('P1', e.target.value)}
              className="w-full px-2 py-1 bg-tokyo-surface-light border border-tokyo-border-light rounded text-tokyo-text text-sm"
              placeholder="Player 1"
            />
          </div>
          <div>
            <label className="text-sm text-tokyo-text-dim block mb-1">P2 Name:</label>
            <input
              type="text"
              value={teamNames.P2}
              onChange={(e) => setPlayerName('P2', e.target.value)}
              className="w-full px-2 py-1 bg-tokyo-surface-light border border-tokyo-border-light rounded text-tokyo-text text-sm"
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