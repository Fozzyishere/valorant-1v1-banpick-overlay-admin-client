// Asset positioning constants and utilities for OBS overlay
// Coordinates are based on 1920x1080 resolution with top-left positioning

export interface AssetPosition {
  x: number;
  y: number;
}

export interface TeamNamePosition extends AssetPosition {
  align: 'left' | 'right';
}

export interface AssetSlot {
  position: AssetPosition;
  revealed: boolean;
  asset?: string;
}

// Phase 1: Map Phase coordinate mapping
export const PHASE1_COORDINATES = {
  teamNames: {
    p1: { x: 342, y: 159, align: 'left' as const },
    p2: { x: 1572, y: 159, align: 'right' as const },
  },
  p1MapBans: [
    { x: 229, y: 325 }, // P1 Map Ban 1
    { x: 384, y: 325 }, // P1 Map Ban 2
    { x: 538, y: 325 }, // P1 Map Ban 3
  ],
  p2MapBans: [
    { x: 1546, y: 325 }, // P2 Map Ban 1
    { x: 1392, y: 325 }, // P2 Map Ban 2
    { x: 1237, y: 325 }, // P2 Map Ban 3
  ],
  mapPicks: {
    p1: { x: 734, y: 325 }, // P1 Map Pick
    p2: { x: 1043, y: 325 }, // P2 Map Pick
    decider: { x: 888, y: 325 }, // Decider Map
  },
};

// Phase 2: Agent Phase coordinate mapping
export const PHASE2_COORDINATES = {
  teamNames: {
    p1: { x: 342, y: 159, align: 'left' as const },
    p2: { x: 1572, y: 159, align: 'right' as const },
  },
  p1AgentBans: [
    { x: 229, y: 313 }, // P1 Agent Ban 1
    { x: 335, y: 313 }, // P1 Agent Ban 2
    { x: 441, y: 313 }, // P1 Agent Ban 3
  ],
  p2AgentBans: [
    { x: 1596, y: 313 }, // P2 Agent Ban 1
    { x: 1490, y: 313 }, // P2 Agent Ban 2
    { x: 1384, y: 313 }, // P2 Agent Ban 3
  ],
  agentPicks: {
    p1: { x: 211, y: 436 }, // P1 Agent Pick (banner)
    p2: { x: 1485, y: 436 }, // P2 Agent Pick (banner)
  },
};

// Conclusion: Complete tournament display coordinate mapping
export const CONCLUSION_COORDINATES = {
  teamNames: {
    p1: { x: 342, y: 159, align: 'left' as const },
    p2: { x: 1572, y: 159, align: 'right' as const },
  },
  p1MapBans: [
    { x: 229, y: 313 }, // P1 Map Ban 1
    { x: 384, y: 313 }, // P1 Map Ban 2
    { x: 538, y: 313 }, // P1 Map Ban 3
  ],
  p2MapBans: [
    { x: 1546, y: 313 }, // P2 Map Ban 1
    { x: 1392, y: 313 }, // P2 Map Ban 2
    { x: 1237, y: 313 }, // P2 Map Ban 3
  ],
  mapPicks: {
    p1: { x: 604, y: 479 }, // P1 Map Pick
    p2: { x: 1009, y: 479 }, // P2 Map Pick
    decider: { x: 604, y: 682 }, // Decider Map
  },
  p1AgentBans: [
    { x: 621, y: 909 }, // P1 Agent Ban 1
    { x: 727, y: 909 }, // P1 Agent Ban 2
    { x: 833, y: 909 }, // P1 Agent Ban 3
  ],
  p2AgentBans: [
    { x: 1215, y: 909 }, // P2 Agent Ban 1
    { x: 1109, y: 909 }, // P2 Agent Ban 2
    { x: 1003, y: 909 }, // P2 Agent Ban 3
  ],
  agentPicks: {
    p1: { x: 211, y: 436 }, // P1 Agent Pick (banner)
    p2: { x: 1366, y: 436 }, // P2 Agent Pick (banner)
  },
};

// Asset types for proper file path generation
export type AssetType = 'map' | 'agent-icon' | 'agent-banner';

export interface PositionedAsset {
  id: string;
  type: AssetType;
  asset: string;
  position: AssetPosition;
  revealed: boolean;
  player: 'P1' | 'P2' | 'shared';
  slot: string;
}

// Generate asset file path
export function getAssetFilePath(assetName: string, assetType: AssetType): string {
  const assetFolders = {
    map: 'maps',
    'agent-icon': 'agents-icon',
    'agent-banner': 'agent-banner',
  };

  return `/img/${assetFolders[assetType]}/${assetName}.png`;
}

// Calculate all positioned assets for current tournament state
export function calculatePositionedAssets(tournamentState: any): PositionedAsset[] {
  const assets: PositionedAsset[] = [];

  if (!tournamentState) return assets;

  const { currentPhase, mapsBanned, mapsPicked, deciderMap, agentsBanned, agentPicks } =
    tournamentState;

  // Phase 1 and Conclusion: Map assets
  if (currentPhase === 'MAP_BAN' || currentPhase === 'MAP_PICK' || currentPhase === 'CONCLUSION') {
    const coords = currentPhase === 'CONCLUSION' ? CONCLUSION_COORDINATES : PHASE1_COORDINATES;

    // P1 Map Bans
    if (mapsBanned?.P1) {
      mapsBanned.P1.forEach((map: string, index: number) => {
        if (map && coords.p1MapBans[index]) {
          assets.push({
            id: `p1-map-ban-${index + 1}`,
            type: 'map',
            asset: map,
            position: coords.p1MapBans[index],
            revealed: true, // Maps are revealed immediately for now
            player: 'P1',
            slot: `ban${index + 1}`,
          });
        }
      });
    }

    // P2 Map Bans
    if (mapsBanned?.P2) {
      mapsBanned.P2.forEach((map: string, index: number) => {
        if (map && coords.p2MapBans[index]) {
          assets.push({
            id: `p2-map-ban-${index + 1}`,
            type: 'map',
            asset: map,
            position: coords.p2MapBans[index],
            revealed: true,
            player: 'P2',
            slot: `ban${index + 1}`,
          });
        }
      });
    }

    // P1 Map Pick
    if (mapsPicked?.P1 && coords.mapPicks.p1) {
      assets.push({
        id: 'p1-map-pick',
        type: 'map',
        asset: mapsPicked.P1,
        position: coords.mapPicks.p1,
        revealed: true,
        player: 'P1',
        slot: 'pick',
      });
    }

    // P2 Map Pick
    if (mapsPicked?.P2 && coords.mapPicks.p2) {
      assets.push({
        id: 'p2-map-pick',
        type: 'map',
        asset: mapsPicked.P2,
        position: coords.mapPicks.p2,
        revealed: true,
        player: 'P2',
        slot: 'pick',
      });
    }

    // Decider Map
    if (deciderMap && coords.mapPicks.decider) {
      assets.push({
        id: 'decider-map',
        type: 'map',
        asset: deciderMap,
        position: coords.mapPicks.decider,
        revealed: true,
        player: 'shared',
        slot: 'decider',
      });
    }
  }

  // Phase 2 and Conclusion: Agent assets
  if (
    currentPhase === 'AGENT_BAN' ||
    currentPhase === 'AGENT_PICK' ||
    currentPhase === 'CONCLUSION'
  ) {
    const coords = currentPhase === 'CONCLUSION' ? CONCLUSION_COORDINATES : PHASE2_COORDINATES;

    // P1 Agent Bans
    if (agentsBanned?.P1) {
      agentsBanned.P1.forEach((agent: string, index: number) => {
        if (agent && coords.p1AgentBans[index]) {
          assets.push({
            id: `p1-agent-ban-${index + 1}`,
            type: 'agent-icon',
            asset: agent,
            position: coords.p1AgentBans[index],
            revealed: true,
            player: 'P1',
            slot: `ban${index + 1}`,
          });
        }
      });
    }

    // P2 Agent Bans
    if (agentsBanned?.P2) {
      agentsBanned.P2.forEach((agent: string, index: number) => {
        if (agent && coords.p2AgentBans[index]) {
          assets.push({
            id: `p2-agent-ban-${index + 1}`,
            type: 'agent-icon',
            asset: agent,
            position: coords.p2AgentBans[index],
            revealed: true,
            player: 'P2',
            slot: `ban${index + 1}`,
          });
        }
      });
    }

    // P1 Agent Pick
    if (agentPicks?.P1 && coords.agentPicks.p1) {
      assets.push({
        id: 'p1-agent-pick',
        type: 'agent-banner',
        asset: agentPicks.P1,
        position: coords.agentPicks.p1,
        revealed: true,
        player: 'P1',
        slot: 'pick',
      });
    }

    // P2 Agent Pick
    if (agentPicks?.P2 && coords.agentPicks.p2) {
      assets.push({
        id: 'p2-agent-pick',
        type: 'agent-banner',
        asset: agentPicks.P2,
        position: coords.agentPicks.p2,
        revealed: true,
        player: 'P2',
        slot: 'pick',
      });
    }
  }

  return assets;
}
