// Core tournament constants - centralized magic numbers
// Should probably moved to a config to account for new maps/agents in future
// but we'll go with this for now.

import type { ActionType, MapName, AgentName } from './types';

// All available maps in Valorant
export const ALL_MAPS: readonly MapName[] = [
  'abyss',
  'ascent',
  'bind',
  'breeze',
  'corrode',
  'fracture',
  'haven',
  'icebox',
  'lotus',
  'pearl',
  'split',
  'sunset',
] as const;

// All available agents in Valorant
export const ALL_AGENTS: readonly AgentName[] = [
  'astra',
  'breach',
  'brimstone',
  'chamber',
  'clove',
  'cypher',
  'deadlock',
  'fade',
  'gekko',
  'harbor',
  'iso',
  'jett',
  'kayo',
  'killjoy',
  'neon',
  'omen',
  'phoenix',
  'raze',
  'reyna',
  'sage',
  'skye',
  'sova',
  'tejo',
  'viper',
  'vyse',
  'waylay',
  'yoru',
] as const;

// Total number of actions in a tournament (1-17)
export const TOTAL_ACTIONS = 17;

// Phase boundaries (inclusive ranges)
export const PHASE_BOUNDARIES = {
  MAP_PHASE: { start: 1, end: 9 },
  AGENT_PHASE: { start: 10, end: 17 },
} as const;

// Action type mapping for each action number
export const ACTION_TYPE_MAP: Readonly<Record<number, ActionType>> = {
  1: 'MAP_BAN',
  2: 'MAP_BAN',
  3: 'MAP_BAN',
  4: 'MAP_BAN',
  5: 'MAP_BAN',
  6: 'MAP_BAN',
  7: 'MAP_PICK',
  8: 'MAP_PICK',
  9: 'DECIDER',
  10: 'AGENT_BAN',
  11: 'AGENT_BAN',
  12: 'AGENT_BAN',
  13: 'AGENT_BAN',
  14: 'AGENT_BAN',
  15: 'AGENT_BAN',
  16: 'AGENT_PICK',
  17: 'AGENT_PICK',
} as const;

// Default timer duration in seconds
export const DEFAULT_TIMER_SECONDS = 30;

// Timer seconds for development/testing (shorter duration)
export const DEV_TIMER_SECONDS = 3;

// Action count limits
export const MAX_MAP_BANS = 6;
export const MAX_MAP_PICKS = 2;
export const MAX_AGENT_BANS = 6;
export const MAX_AGENT_PICKS = 2;
