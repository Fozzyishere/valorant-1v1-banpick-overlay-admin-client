import { useTournamentStore } from '../services/adminStore';
import { getAvailableAssets, isMapPhase, isAgentPhase, ALL_MAPS, ALL_AGENTS } from '../utils/tournamentHelpers';
import type { AssetSelectionState } from '../types/admin.types';

export function InformationPanel() {
  const {
    actionNumber,
    mapsBanned,
    mapsPicked,
    agentsBanned,
    agentPicks,
    pendingSelection,
    revealedActions,
    attemptSelection,
    
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
    attemptSelection(assetName);
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

  const getAssetClasses = (type: 'map' | 'agent', state: string, isActive: boolean) => {
    const baseClasses = type === 'agent'
      ? "px-1.5 py-1 border rounded text-center text-[11px] font-medium transition-all cursor-pointer"
      : "p-2 border rounded text-center text-sm font-medium transition-all cursor-pointer";
    
    if (!isActive) {
      return `${baseClasses} bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text-dim cursor-not-allowed`;
    }
    
    switch (state) {
      case 'banned':
        return `${baseClasses} bg-tokyo-red/20 border-tokyo-red text-tokyo-red line-through cursor-not-allowed`;
      case 'picked':
        return `${baseClasses} bg-tokyo-teal/20 border-tokyo-teal text-tokyo-teal cursor-not-allowed`;
      case 'selected-pending':
        return `${baseClasses} bg-tokyo-yellow/20 border-tokyo-yellow text-tokyo-yellow animate-pulse`;
      case 'revealed':
        return `${baseClasses} bg-tokyo-green/20 border-tokyo-green text-tokyo-green`;
      case 'disabled':
        return `${baseClasses} bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text-dim cursor-not-allowed`;
      case 'available':
      default:
        return `${baseClasses} bg-tokyo-blue/20 border-tokyo-blue text-tokyo-blue hover:bg-tokyo-blue/30 hover:border-tokyo-cyan`;
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <h2 className="text-lg font-semibold text-tokyo-text tracking-tight">Asset Selection</h2>
      
      {/* Map Selection - size to content so Agents can take remaining space */}
      <div className="flex flex-col">
        <h3 className={`text-md font-medium ${isMapActive ? 'text-tokyo-blue' : 'text-tokyo-text-dim'}`}>Maps {isMapActive ? '(Active)' : ''}</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ALL_MAPS.map((mapName) => {
            let state = getAssetState(mapName, 'map') as AssetSelectionState;
            const canClick = isMapActive && (state === 'available' || (actionNumber === 9 && state === 'picked'));

            // Visual state overrides for pending/revealed of current action
            if (pendingSelection === mapName) state = 'selected-pending' as AssetSelectionState;
            if (revealedActions.has(actionNumber) && (state === 'available' || state === 'picked')) state = 'revealed' as AssetSelectionState;

            return (
              <div
                key={mapName}
                className={getAssetClasses('map', state, isMapActive)}
                onClick={() => canClick && handleAssetClick(mapName)}
              >
                <div className="text-xs capitalize">{mapName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Selection - occupy remaining panel height */}
      <div className="flex flex-col flex-1 min-h-[220px]">
        <h3 className={`text-md font-medium ${isAgentActive ? 'text-tokyo-blue' : 'text-tokyo-text-dim'}`}>Agents {isAgentActive ? '(Active)' : ''}</h3>
        <div className="mt-1 grid grid-cols-4 gap-2.5 flex-1 auto-rows-min">
          {ALL_AGENTS.map((agentName) => {
            let state = getAssetState(agentName, 'agent') as AssetSelectionState;
            const canClick = isAgentActive && state === 'available';

            if (pendingSelection === agentName) state = 'selected-pending' as AssetSelectionState;
            if (revealedActions.has(actionNumber) && state === 'available') state = 'revealed' as AssetSelectionState;

            return (
              <div
                key={agentName}
                className={getAssetClasses('agent', state, isAgentActive) + ' text-[12px]'}
                onClick={() => canClick && handleAssetClick(agentName)}
              >
                <div className="capitalize">{agentName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}