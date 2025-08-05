import { useTournamentStore } from '../services/adminStore';
import { getAvailableAssets, isMapPhase, isAgentPhase, ALL_MAPS, ALL_AGENTS } from '../utils/tournamentHelpers';

export function InformationPanel() {
  const {
    actionNumber,
    mapsBanned,
    mapsPicked,
    agentsBanned,
    agentPicks,
    selectAsset
  } = useTournamentStore();

  const availability = getAvailableAssets(
    mapsBanned,
    mapsPicked,
    agentsBanned,
    agentPicks,
    actionNumber
  );

  const isMapActive = isMapPhase(actionNumber);
  const isAgentActive = isAgentPhase(actionNumber);

  const handleAssetClick = (assetName: string) => {
    selectAsset(assetName);
  };

  const getAssetState = (assetName: string, type: 'map' | 'agent') => {
    if (type === 'map') {
      if (availability.maps.banned.includes(assetName as any)) return 'banned';
      if (availability.maps.picked.includes(assetName as any)) return 'picked';
      if (actionNumber === 9 && !availability.maps.picked.includes(assetName as any)) return 'disabled';
      return 'available';
    } else {
      if (availability.agents.banned.includes(assetName as any)) return 'banned';
      if (availability.agents.picked.includes(assetName as any)) return 'picked';
      return 'available';
    }
  };

  const getAssetClasses = (state: string, isActive: boolean) => {
    const baseClasses = "p-2 border rounded text-center text-sm font-medium transition-all cursor-pointer";
    
    if (!isActive) {
      return `${baseClasses} bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed`;
    }
    
    switch (state) {
      case 'banned':
        return `${baseClasses} bg-red-900/30 border-red-700 text-red-400 line-through cursor-not-allowed`;
      case 'picked':
        return `${baseClasses} bg-green-900/30 border-green-700 text-green-400 cursor-not-allowed`;
      case 'disabled':
        return `${baseClasses} bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed`;
      case 'available':
      default:
        return `${baseClasses} bg-blue-900/20 border-blue-600 text-blue-300 hover:bg-blue-800/30 hover:border-blue-500`;
    }
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      <h2 className="text-lg font-semibold text-white">Asset Selection</h2>
      
      {/* Map Selection Grid */}
      <div className="flex-1">
        <h3 className={`text-md font-medium mb-3 ${isMapActive ? 'text-blue-400' : 'text-gray-500'}`}>
          Maps {isMapActive ? '(Active)' : ''}
        </h3>
        <div className="grid grid-cols-3 gap-2 h-40 overflow-y-auto">
          {ALL_MAPS.map((mapName) => {
            const state = getAssetState(mapName, 'map');
            const canClick = isMapActive && (state === 'available' || (actionNumber === 9 && state === 'picked'));
            
            return (
              <div
                key={mapName}
                className={getAssetClasses(state, isMapActive)}
                onClick={() => canClick && handleAssetClick(mapName)}
              >
                <div className="text-xs capitalize">{mapName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Selection Grid */}
      <div className="flex-1">
        <h3 className={`text-md font-medium mb-3 ${isAgentActive ? 'text-blue-400' : 'text-gray-500'}`}>
          Agents {isAgentActive ? '(Active)' : ''}
        </h3>
        <div className="grid grid-cols-4 gap-1 h-40 overflow-y-auto">
          {ALL_AGENTS.map((agentName) => {
            const state = getAssetState(agentName, 'agent');
            const canClick = isAgentActive && state === 'available';
            
            return (
              <div
                key={agentName}
                className={getAssetClasses(state, isAgentActive)}
                onClick={() => canClick && handleAssetClick(agentName)}
              >
                <div className="text-xs capitalize">{agentName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}