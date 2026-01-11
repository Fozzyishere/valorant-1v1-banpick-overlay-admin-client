// Asset reveal animations
import { ANIMATION_DURATIONS } from '../config';
import type { AssetType } from '../types';

// ============================================
// RevealAnimator Class
// ============================================

export class RevealAnimator {
  /**
   * Apply reveal animation to an element
   */
  revealAsset(element: HTMLElement, assetType: AssetType, onComplete?: () => void): void {
    element.classList.add('revealing');

    const duration = this.getAnimationDuration(assetType);

    setTimeout(() => {
      element.classList.remove('revealing');
      onComplete?.();
    }, duration);
  }

  /**
   * Reveal multiple assets with staggered timing
   */
  staggeredReveal(
    elements: HTMLElement[],
    assetTypes: AssetType[],
    delayMs: number = ANIMATION_DURATIONS.STAGGER_DELAY,
    onAllComplete?: () => void
  ): void {
    if (elements.length === 0) {
      onAllComplete?.();
      return;
    }

    let completed = 0;

    elements.forEach((element, index) => {
      setTimeout(() => {
        this.revealAsset(element, assetTypes[index] ?? 'map', () => {
          completed++;
          if (completed === elements.length) {
            onAllComplete?.();
          }
        });
      }, index * delayMs);
    });
  }

  /**
   * Get animation duration for asset type
   */
  getAnimationDuration(assetType: AssetType): number {
    switch (assetType) {
      case 'map':
        return ANIMATION_DURATIONS.MAP_REVEAL;
      case 'agent-icon':
        return ANIMATION_DURATIONS.AGENT_ICON_REVEAL;
      case 'agent-banner':
        return ANIMATION_DURATIONS.AGENT_BANNER_REVEAL;
      default:
        return ANIMATION_DURATIONS.MAP_REVEAL;
    }
  }

  /**
   * Apply sparkle effect animation
   */
  applySparkleEffect(element: HTMLElement): void {
    element.style.animationDelay = '0s';
    element.style.animation = 'asset-reveal-sparkle 0.6s ease-out';
  }
}
