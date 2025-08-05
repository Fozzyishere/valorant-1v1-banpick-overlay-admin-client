import { useTournamentStore } from '../services/adminStore';

export function HeaderBar() {
  const { currentPhase, currentPlayer, actionNumber } = useTournamentStore();

  return (
    <div className="flex items-center justify-between h-full px-6 bg-gray-800">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold text-white">Tournament Admin</h1>
        <div className="text-sm text-gray-300">
          Phase: <span className="text-blue-400 font-medium">{currentPhase}</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-300">
        Current Turn: <span className="text-green-400 font-medium">
          Turn {actionNumber}: {currentPlayer || 'None'}
        </span>
      </div>
    </div>
  );
}