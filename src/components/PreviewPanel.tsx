import { useTournamentStore } from '../services/adminStore';

export function PreviewPanel() {
  const {
    teamNames,
    mapsBanned,
    mapsPicked,
    deciderMap,
    agentsBanned,
    agentPicks,
    revealedActions,
    actionNumber
  } = useTournamentStore();

  const PlayerSection = ({ player, title }: { player: 'P1' | 'P2', title: string }) => {
    const playerMapBans = mapsBanned.filter(ban => ban.player === player);
    const playerMapPicks = mapsPicked.filter(pick => pick.player === player);
    const playerAgentBans = agentsBanned.filter(ban => ban.player === player);
    const playerAgentPick = agentPicks[player];

    const SlotDisplay = ({ items, maxCount, label }: { items: string[]; maxCount: number; label: string }) => {
      return (
        <div className="mb-3">
          <div className="text-xs text-tokyo-text-dim mb-1">{label}:</div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: maxCount }, (_, index) => {
              const value = items[index];
              const isFilled = Boolean(value);
              const colorClasses = isFilled
                ? (revealedActions.has(actionNumber)
                    ? 'bg-tokyo-teal/20 border-tokyo-teal text-tokyo-teal'
                    : 'bg-tokyo-yellow/20 border-tokyo-yellow text-tokyo-yellow')
                : 'bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text-dim';
              return (
                <div
                  key={index}
                  className={`px-2 py-1 border rounded text-xs whitespace-nowrap ${colorClasses}`}
                >
                  {isFilled ? value : '---'}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-tokyo-surface-light rounded p-3 mb-3">
        <h4 className="font-medium text-tokyo-text mb-3">{title}</h4>
        
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
            <div className="text-xs text-tokyo-text-dim mb-1">Decider:</div>
            <div
              className={`px-2 py-1 border rounded text-xs inline-flex items-center justify-center whitespace-nowrap ${
                deciderMap
                  ? 'bg-tokyo-teal/20 border-tokyo-teal text-tokyo-teal'
                  : 'bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text-dim'
              }`}
            >
              {deciderMap ? deciderMap : '---'}
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
          <div className="text-xs text-tokyo-text-dim mb-1">Agent Pick:</div>
          <div
            className={`px-2 py-1 border rounded text-xs inline-flex items-center justify-center whitespace-nowrap ${
              playerAgentPick
                ? 'bg-tokyo-purple/20 border-tokyo-purple text-tokyo-purple'
                : 'bg-tokyo-surface-light border-tokyo-border-light text-tokyo-text-dim'
            }`}
          >
            {playerAgentPick ? playerAgentPick : '---'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      <h2 className="text-lg font-semibold text-tokyo-text tracking-tight">Tournament Preview</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        <PlayerSection player="P1" title={teamNames.P1} />
        <PlayerSection player="P2" title={teamNames.P2} />
      </div>
      
      {/* Tournament Progress */}
      <div className="mt-auto pt-4 border-t border-tokyo-border">
        <div className="text-xs text-tokyo-text-dim">
          Maps Banned: {mapsBanned.length}/6 | 
          Maps Picked: {mapsPicked.length}/2 | 
          Agents Banned: {agentsBanned.length}/6 | 
          Agents Picked: {Object.values(agentPicks).filter(Boolean).length}/2
        </div>
      </div>
    </div>
  );
}