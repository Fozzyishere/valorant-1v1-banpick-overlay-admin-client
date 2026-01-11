// Background manager for phase transitions

import { PHASE_BACKGROUNDS, ANIMATION_DURATIONS } from '../config';
import { getElementById, waitForImageLoad } from '../utils';
import type { TournamentPhase } from '../types';

// ============================================
// BackgroundManager Class
// ============================================

export class BackgroundManager {
  private currentBackgroundId: string = 'phase-1-bg';

  /**
   * Get current background element ID
   */
  getCurrentBackgroundId(): string {
    return this.currentBackgroundId;
  }

  /**
   * Update background based on current phase with crossfade support
   */
  async updateBackground(phase: TournamentPhase): Promise<void> {
    const targetId = PHASE_BACKGROUNDS[phase];
    if (!targetId || targetId === this.currentBackgroundId) {
      return;
    }

    const targetEl = getElementById<HTMLImageElement>(targetId);
    if (!targetEl) {
      return;
    }

    const previousId = this.currentBackgroundId;
    const shouldCrossfade = previousId === 'phase-1-bg' && targetId === 'phase-2-bg';

    const bgContainer = document.querySelector('.background-container');

    if (bgContainer && shouldCrossfade) {
      bgContainer.classList.add('crossfade');
    }

    try {
      // Wait for image to load/decode before switching
      await waitForImageLoad(targetEl);
      this.switchToTarget(targetId);
    } catch {
      // If decode fails, still switch
      this.switchToTarget(targetId);
    }

    // Remove crossfade class after animation completes
    if (bgContainer && shouldCrossfade) {
      setTimeout(() => {
        bgContainer.classList.remove('crossfade');
      }, ANIMATION_DURATIONS.BACKGROUND_CROSSFADE);
    }
  }

  /**
   * Switch visibility to target background
   */
  private switchToTarget(targetId: string): void {
    const targetEl = getElementById(targetId);
    if (!targetEl) return;

    // Show target first
    targetEl.classList.remove('hidden');
    targetEl.classList.add('visible');

    // Then hide others
    document.querySelectorAll('.background-image').forEach((img) => {
      if (img.id !== targetId) {
        img.classList.remove('visible');
        img.classList.add('hidden');
      }
    });

    this.currentBackgroundId = targetId;
  }

  /**
   * Transition to a new phase with optional animation
   */
  transitionTo(phase: TournamentPhase): Promise<void> {
    return this.updateBackground(phase);
  }

  /**
   * Initialize with a specific phase (no animation)
   */
  initialize(phase: TournamentPhase): void {
    const targetId = PHASE_BACKGROUNDS[phase];
    if (targetId) {
      this.switchToTarget(targetId);
    }
  }
}
