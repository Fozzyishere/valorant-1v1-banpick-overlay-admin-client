// Coordinate constants for overlay positioning

import type { SlotCoordinate, PhaseCoordinates } from '../types';

// ============================================
// Map slot coordinates for Phase 1 grid (top-left x,y)
// ============================================

export const MAP_SLOT_COORDS: Record<string, SlotCoordinate> = {
  abyss: { x: 217, y: 464 },
  ascent: { x: 518, y: 465 },
  bind: { x: 821, y: 464 },
  breeze: { x: 1123, y: 464 },
  fracture: { x: 1426, y: 464 },
  split: { x: 1425, y: 613 },
  pearl: { x: 1123, y: 613 },
  lotus: { x: 821, y: 613 },
  icebox: { x: 518, y: 613 },
  haven: { x: 216, y: 613 },
  sunset: { x: 217, y: 762 },
  corrode: { x: 519, y: 763 },
};

// ============================================
// Agent slot coordinates for Phase 2 grid (top-left x,y, 137px x 137px each)
// ============================================

export const AGENT_SLOT_COORDS: Record<string, SlotCoordinate> = {
  chamber: { x: 451, y: 436 },
  deadlock: { x: 597, y: 436 },
  fade: { x: 744, y: 436 },
  gekko: { x: 891, y: 436 },
  harbor: { x: 1039, y: 436 },
  iso: { x: 1185, y: 436 },
  jett: { x: 1332, y: 436 },
  kayo: { x: 450, y: 585 },
  killjoy: { x: 597, y: 585 },
  neon: { x: 744, y: 585 },
  omen: { x: 891, y: 585 },
  phoenix: { x: 1038, y: 585 },
  raze: { x: 1185, y: 585 },
  reyna: { x: 1332, y: 585 },
  sage: { x: 450, y: 734 },
  skye: { x: 597, y: 734 },
  sova: { x: 744, y: 734 },
  tejo: { x: 891, y: 734 },
  viper: { x: 1038, y: 734 },
  vyse: { x: 1185, y: 734 },
  waylay: { x: 1332, y: 734 },
  yoru: { x: 450, y: 883 },
  astra: { x: 597, y: 883 },
  breach: { x: 744, y: 883 },
  brimstone: { x: 891, y: 883 },
  clove: { x: 1038, y: 883 },
  cypher: { x: 1185, y: 883 },
};

// ============================================
// Phase-specific coordinate configurations
// ============================================

const MAP_PHASE_COORDINATES: PhaseCoordinates = {
  teamNames: {
    p1: { x: 342, y: 159, fontSize: '48px' },
    p2: { x: 1572, y: 159, fontSize: '48px' },
  },
  p1MapBans: [
    { x: 229, y: 325, width: 143, height: 93 },
    { x: 384, y: 325, width: 143, height: 93 },
    { x: 538, y: 325, width: 143, height: 93 },
  ],
  p2MapBans: [
    { x: 1546, y: 325, width: 143, height: 93 },
    { x: 1392, y: 325, width: 143, height: 93 },
    { x: 1237, y: 325, width: 143, height: 93 },
  ],
  mapPicks: {
    p1: { x: 734, y: 325, width: 144, height: 95 },
    p2: { x: 1042, y: 325, width: 144, height: 95 },
    decider: { x: 888, y: 325, width: 144, height: 95 },
  },
};

const AGENT_PHASE_COORDINATES: PhaseCoordinates = {
  teamNames: {
    p1: { x: 350, y: 165, fontSize: '46px' },
    p2: { x: 1565, y: 165, fontSize: '46px' },
  },
  p1AgentBans: [
    { x: 229, y: 313, width: 93, height: 93 },
    { x: 335, y: 313, width: 93, height: 93 },
    { x: 441, y: 313, width: 93, height: 93 },
  ],
  p2AgentBans: [
    { x: 1596, y: 313, width: 93, height: 93 },
    { x: 1490, y: 313, width: 93, height: 93 },
    { x: 1384, y: 313, width: 93, height: 93 },
  ],
  agentPicks: {
    p1: { x: 211, y: 436, width: 223, height: 584 },
    p2: { x: 1485, y: 436, width: 223, height: 584 },
  },
};

const CONCLUSION_COORDINATES: PhaseCoordinates = {
  teamNames: {
    p1: { x: 342, y: 159, fontSize: '50px' },
    p2: { x: 1572, y: 159, fontSize: '50px' },
  },
  p1MapBans: [
    { x: 229, y: 313, width: 143, height: 93 },
    { x: 384, y: 313, width: 143, height: 93 },
    { x: 538, y: 313, width: 143, height: 93 },
  ],
  p2MapBans: [
    { x: 1546, y: 313, width: 143, height: 93 },
    { x: 1392, y: 313, width: 143, height: 93 },
    { x: 1237, y: 313, width: 143, height: 93 },
  ],
  mapPicks: {
    p1: { x: 620, y: 480, width: 277, height: 156 },
    p2: { x: 1021, y: 480, width: 277, height: 156 },
    decider: { x: 822, y: 693, width: 277, height: 156 },
  },
  p1AgentBans: [
    { x: 621, y: 909, width: 93, height: 93 },
    { x: 727, y: 909, width: 93, height: 93 },
    { x: 833, y: 909, width: 93, height: 93 },
  ],
  p2AgentBans: [
    { x: 1215, y: 909, width: 93, height: 93 },
    { x: 1109, y: 909, width: 93, height: 93 },
    { x: 1003, y: 909, width: 93, height: 93 },
  ],
  agentPicks: {
    p1: { x: 344, y: 434, width: 233, height: 584 },
    p2: { x: 1365, y: 434, width: 233, height: 584 },
  },
};

// ============================================
// Phase configuration lookup
// ============================================

export const PHASE_COORDINATES: Record<string, PhaseCoordinates> = {
  MAP_PHASE: MAP_PHASE_COORDINATES,
  AGENT_PHASE: AGENT_PHASE_COORDINATES,
  CONCLUSION: CONCLUSION_COORDINATES,
};

// ============================================
// Phase background mapping
// ============================================

export const PHASE_BACKGROUNDS: Record<string, string> = {
  MAP_PHASE: 'phase-1-bg',
  AGENT_PHASE: 'phase-2-bg',
  CONCLUSION: 'conclusion-bg',
};
