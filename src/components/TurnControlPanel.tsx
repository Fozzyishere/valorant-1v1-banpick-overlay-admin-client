import { useTournamentStore } from '../services/adminStore';
import { getTurnInfo } from '../utils/tournamentHelpers';

export function TurnControlPanel() {
  const {
    firstPlayer,
    teamNames,
    actionNumber,
    setFirstPlayer,
    setPlayerName,
    startEvent,
    nextTurn,
    prevTurn,
    resetTurn,
    resetTournament,
    lastError
  } = useTournamentStore();

  const turnInfo = getTurnInfo(actionNumber, firstPlayer);

  return (
    <div className="flex flex-col space-y-6">
      <h2 className="text-lg font-semibold text-white">Turn Control</h2>
      
      {/* Player Setup Section */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-300">Player Setup</h3>
        
        {/* First Player Selection */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">First Player:</label>
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
              <span className="text-white">P1</span>
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
              <span className="text-white">P2</span>
            </label>
          </div>
        </div>
        
        {/* Player Name Inputs */}
        <div className="space-y-2">
          <div>
            <label className="text-sm text-gray-400 block mb-1">P1 Name:</label>
            <input
              type="text"
              value={teamNames.P1}
              onChange={(e) => setPlayerName('P1', e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              placeholder="Player 1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">P2 Name:</label>
            <input
              type="text"
              value={teamNames.P2}
              onChange={(e) => setPlayerName('P2', e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              placeholder="Player 2"
            />
          </div>
        </div>
      </div>
      
      {/* Current Turn Display */}
      <div className="bg-gray-700 p-3 rounded">
        <div className="text-sm text-gray-400 mb-1">Current:</div>
        <div className="text-white font-medium">{turnInfo.description}</div>
      </div>
      
      {/* Event Control */}
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Event Control:</label>
          <button
            onClick={startEvent}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
          >
            START EVENT
          </button>
        </div>
        
        {/* Turn Navigation */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Turn Navigation:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={prevTurn}
              disabled={actionNumber === 1}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              PREV
            </button>
            
            <button
              onClick={nextTurn}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              NEXT
            </button>
          </div>
        </div>
        
        {/* Reset Controls */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Reset Options:</label>
          <div className="space-y-2">
            <button
              onClick={resetTurn}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors"
            >
              RESET TURN
            </button>
            
            <button
              onClick={resetTournament}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
            >
              RESET TOURNAMENT
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {lastError && (
        <div className="bg-red-900/30 border border-red-700 p-2 rounded">
          <div className="text-red-400 text-sm">{lastError}</div>
        </div>
      )}
    </div>
  );
}