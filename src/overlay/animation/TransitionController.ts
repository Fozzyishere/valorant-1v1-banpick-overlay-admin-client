// Phase transition controller

import { ANIMATION_DURATIONS } from '../config';
import type { TournamentPhase } from '../types';

// ============================================
// Phase class mapping
// ============================================

const PHASE_CLASSES: Record<TournamentPhase, string> = {
  MAP_PHASE: 'phase-map',
  AGENT_PHASE: 'phase-agent',
  CONCLUSION: 'phase-conclusion',
};

// ============================================
// TransitionController Class
// ============================================

export class TransitionController {
  private overlayContent: HTMLElement | null = null;
  private assetContainer: HTMLElement | null = null;

  constructor() {
    this.overlayContent = document.querySelector('.overlay-content');
    this.assetContainer = document.querySelector('.asset-container');
  }

  /**
   * Update phase container classes with transitions
   */
  updatePhaseContainer(newPhase: TournamentPhase, previousPhase: TournamentPhase | null): void {
    if (!this.overlayContent) return;

    // Remove previous phase classes from both containers
    this.overlayContent.classList.remove('phase-map', 'phase-agent', 'phase-conclusion');
    this.overlayContent.classList.remove('phase-transition-enter', 'phase-transition-exit');

    if (this.assetContainer) {
      this.assetContainer.classList.remove('phase-map', 'phase-agent', 'phase-conclusion');
    }

    const newClass = PHASE_CLASSES[newPhase];

    if (previousPhase) {
      // Animated transition
      this.overlayContent.classList.add('phase-transition-exit');

      setTimeout(() => {
        if (!this.overlayContent) return;

        this.overlayContent.classList.remove('phase-transition-exit');
        this.overlayContent.classList.add(newClass);

        if (this.assetContainer) {
          this.assetContainer.classList.add(newClass);
        }

        this.overlayContent.classList.add('phase-transition-enter');

        setTimeout(() => {
          this.overlayContent?.classList.remove('phase-transition-enter');
        }, ANIMATION_DURATIONS.PHASE_TRANSITION_ENTER);
      }, ANIMATION_DURATIONS.PHASE_TRANSITION_EXIT);
    } else {
      // Initial phase setup without transition
      this.overlayContent.classList.add(newClass);

      if (this.assetContainer) {
        this.assetContainer.classList.add(newClass);
      }
    }
  }

  /**
   * Initialize with a phase (no animation)
   */
  initialize(phase: TournamentPhase): void {
    this.updatePhaseContainer(phase, null);
  }

  /**
   * Reinitialize element references
   */
  reinitialize(): void {
    this.overlayContent = document.querySelector('.overlay-content');
    this.assetContainer = document.querySelector('.asset-container');
  }
}
