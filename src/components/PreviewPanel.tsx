import { useTournamentStore } from '../services/adminStore';

export function PreviewPanel() {
  const {
    teamNames,
    mapsBanned,
    mapsPicked,
    deciderMap,
    agentsBanned,
    agentPicks
  } = useTournamentStore();

  const PlayerSection = ({ player, title }: { player: 'P1' | 'P2', title: string }) => {
    const playerMapBans = mapsBanned.filter(ban => ban.player === player);
    const playerMapPicks = mapsPicked.filter(pick => pick.player === player);
    const playerAgentBans = agentsBanned.filter(ban => ban.player === player);
    const playerAgentPick = agentPicks[player];

    const SlotDisplay = ({ items, maxCount, label }: { items: string[], maxCount: number, label: string }) => (
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">{label}:</div>
        <div className="flex space-x-1">
          {Array.from({ length: maxCount }, (_, index) => (
            <div
              key={index}
              className={`w-12 h-8 border rounded text-xs flex items-center justify-center ${
                items[index]
                  ? 'bg-blue-900/30 border-blue-600 text-blue-300'
                  : 'bg-gray-700 border-gray-600 text-gray-500'
              }`}
            >
              {items[index] ? items[index].slice(0, 4) : '---'}
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="bg-gray-700 rounded p-3 mb-3">
        <h4 className="font-medium text-white mb-3">{title}</h4>
        
        {/* Map Bans */}
        <SlotDisplay 
          items={playerMapBans.map(ban => ban.name)}
          maxCount={3}
          label="Map Bans"
        />
        
        {/* Map Picks */}
        <SlotDisplay 
          items={playerMapPicks.map(pick => pick.name)}
          maxCount={1}
          label="Map Pick"
        />
        
        {/* Decider (only show for P1 or when selected) */}
        {(player === 'P1' || deciderMap) && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Decider:</div>
            <div
              className={`w-12 h-8 border rounded text-xs flex items-center justify-center ${
                deciderMap
                  ? 'bg-green-900/30 border-green-600 text-green-300'
                  : 'bg-gray-700 border-gray-600 text-gray-500'
              }`}
            >
              {deciderMap ? deciderMap.slice(0, 4) : '---'}
            </div>
          </div>
        )}
        
        {/* Agent Bans */}
        <SlotDisplay 
          items={playerAgentBans.map(ban => ban.name)}
          maxCount={3}
          label="Agent Bans"
        />
        
        {/* Agent Pick */}
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Agent Pick:</div>
          <div
            className={`w-12 h-8 border rounded text-xs flex items-center justify-center ${
              playerAgentPick
                ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                : 'bg-gray-700 border-gray-600 text-gray-500'
            }`}
          >
            {playerAgentPick ? playerAgentPick.slice(0, 4) : '---'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      <h2 className="text-lg font-semibold text-white">Tournament Preview</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        <PlayerSection player="P1" title={teamNames.P1} />
        <PlayerSection player="P2" title={teamNames.P2} />
      </div>
      
      {/* Tournament Progress */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Maps Banned: {mapsBanned.length}/6 | 
          Maps Picked: {mapsPicked.length}/2 | 
          Agents Banned: {agentsBanned.length}/6 | 
          Agents Picked: {Object.values(agentPicks).filter(Boolean).length}/2
        </div>
      </div>
    </div>
  );
}