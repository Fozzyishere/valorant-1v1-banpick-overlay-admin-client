// Animation timing constants

// ============================================
// Asset reveal animation durations (ms)
// ============================================

export const ANIMATION_DURATIONS = {
  /** Map ban/pick/decider reveal animation */
  MAP_REVEAL: 1500,

  /** Agent icon (ban) reveal animation */
  AGENT_ICON_REVEAL: 1000,

  /** Agent banner (pick) reveal animation */
  AGENT_BANNER_REVEAL: 1500,

  /** Phase transition exit animation */
  PHASE_TRANSITION_EXIT: 500,

  /** Phase transition enter animation */
  PHASE_TRANSITION_ENTER: 800,

  /** Background crossfade duration */
  BACKGROUND_CROSSFADE: 900,

  /** Staggered reveal delay between assets */
  STAGGER_DELAY: 200,
} as const;

// ============================================
// Error handling configuration
// ============================================

export const ERROR_HANDLING = {
  /** Maximum retry attempts for failed asset loads */
  MAX_RETRY_ATTEMPTS: 3,

  /** Delay between retry attempts (ms) */
  RETRY_DELAY: 2000,
} as const;

// ============================================
// Timer configuration
// ============================================

export const TIMER_CONFIG = {
  /** Local timer interpolation interval (ms) */
  INTERPOLATION_INTERVAL: 1000,
} as const;
