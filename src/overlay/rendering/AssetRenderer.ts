// Asset element creation and positioning

import { PHASE_COORDINATES, ANIMATION_DURATIONS, ERROR_HANDLING } from '../config';
import { getAssetFilePath } from '../utils/assetPaths';
import { getElementById, setCssProperties } from '../utils/domHelpers';
import { overlayState } from '../state';
import type { OverlayPayload, PositionedAsset, Player } from '../types';

// ============================================
// AssetRenderer Class
// ============================================

export class AssetRenderer {
  private container: HTMLElement | null = null;

  constructor(containerId: string = 'asset-container') {
    this.container = getElementById(containerId);
  }

  /**
   * Calculate positioned assets from tournament state
   */
  calculatePositionedAssets(state: OverlayPayload): PositionedAsset[] {
    const assets: PositionedAsset[] = [];
    const {
      currentPhase,
      mapsBanned,
      mapsPicked,
      deciderMap,
      agentsBanned,
      agentPicks,
      timerState,
    } = state;

    const coords = PHASE_COORDINATES[currentPhase] ?? PHASE_COORDINATES['MAP_PHASE'];
    const shouldRevealAssets = timerState === 'finished' || currentPhase === 'CONCLUSION';

    // Map assets (shown in MAP_PHASE and CONCLUSION)
    if (currentPhase === 'MAP_PHASE' || currentPhase === 'CONCLUSION') {
      // P1 Map Bans
      this.addMapBans(
        assets,
        mapsBanned?.P1 ?? [],
        'P1',
        coords.p1MapBans ?? [],
        shouldRevealAssets
      );

      // P2 Map Bans
      this.addMapBans(
        assets,
        mapsBanned?.P2 ?? [],
        'P2',
        coords.p2MapBans ?? [],
        shouldRevealAssets
      );

      // Map Picks
      if (mapsPicked?.P1 && coords.mapPicks?.p1) {
        this.addAsset(
          assets,
          'p1-map-pick',
          'map',
          mapsPicked.P1,
          coords.mapPicks.p1,
          'P1',
          'pick',
          shouldRevealAssets
        );
      }
      if (mapsPicked?.P2 && coords.mapPicks?.p2) {
        this.addAsset(
          assets,
          'p2-map-pick',
          'map',
          mapsPicked.P2,
          coords.mapPicks.p2,
          'P2',
          'pick',
          shouldRevealAssets
        );
      }

      // Decider Map
      if (deciderMap && coords.mapPicks?.decider) {
        this.addAsset(
          assets,
          'decider-map',
          'map',
          deciderMap,
          coords.mapPicks.decider,
          'shared',
          'decider',
          shouldRevealAssets
        );
      }
    }

    // Agent assets (shown in AGENT_PHASE and CONCLUSION)
    if (currentPhase === 'AGENT_PHASE' || currentPhase === 'CONCLUSION') {
      // P1 Agent Bans
      this.addAgentBans(
        assets,
        agentsBanned?.P1 ?? [],
        'P1',
        coords.p1AgentBans ?? [],
        shouldRevealAssets
      );

      // P2 Agent Bans
      this.addAgentBans(
        assets,
        agentsBanned?.P2 ?? [],
        'P2',
        coords.p2AgentBans ?? [],
        shouldRevealAssets
      );

      // Agent Picks
      if (agentPicks?.P1 && coords.agentPicks?.p1) {
        this.addAsset(
          assets,
          'p1-agent-pick',
          'agent-banner',
          agentPicks.P1,
          coords.agentPicks.p1,
          'P1',
          'pick',
          shouldRevealAssets
        );
      }
      if (agentPicks?.P2 && coords.agentPicks?.p2) {
        this.addAsset(
          assets,
          'p2-agent-pick',
          'agent-banner',
          agentPicks.P2,
          coords.agentPicks.p2,
          'P2',
          'pick',
          shouldRevealAssets
        );
      }
    }

    return assets;
  }

  /**
   * Add map ban assets
   */
  private addMapBans(
    assets: PositionedAsset[],
    bans: string[],
    player: Player,
    coords: Array<{ x: number; y: number; width: number; height: number }>,
    shouldRevealAssets: boolean
  ): void {
    bans.forEach((map, index) => {
      if (map && coords[index]) {
        const assetId = `${player.toLowerCase()}-map-ban-${index + 1}`;
        this.addAsset(
          assets,
          assetId,
          'map',
          map,
          coords[index],
          player,
          `ban${index + 1}`,
          shouldRevealAssets
        );
      }
    });
  }

  /**
   * Add agent ban assets
   */
  private addAgentBans(
    assets: PositionedAsset[],
    bans: string[],
    player: Player,
    coords: Array<{ x: number; y: number; width: number; height: number }>,
    shouldRevealAssets: boolean
  ): void {
    bans.forEach((agent, index) => {
      if (agent && coords[index]) {
        const assetId = `${player.toLowerCase()}-agent-ban-${index + 1}`;
        this.addAsset(
          assets,
          assetId,
          'agent-icon',
          agent,
          coords[index],
          player,
          `ban${index + 1}`,
          shouldRevealAssets
        );
      }
    });
  }

  /**
   * Add a single asset to the list
   */
  private addAsset(
    assets: PositionedAsset[],
    id: string,
    type: 'map' | 'agent-icon' | 'agent-banner',
    asset: string,
    coord: { x: number; y: number; width: number; height: number },
    player: Player | 'shared',
    slot: string,
    shouldRevealAssets: boolean
  ): void {
    const isRevealed = shouldRevealAssets || overlayState.isAssetRevealed(id);

    assets.push({
      id,
      type,
      asset,
      position: { x: coord.x, y: coord.y },
      dimensions: { width: coord.width, height: coord.height },
      revealed: isRevealed,
      player,
      slot,
    });

    if (isRevealed) {
      overlayState.markAssetRevealed(id);
    }
  }

  /**
   * Update asset positions on overlay
   */
  updateAssetPositions(state: OverlayPayload): void {
    if (!this.container) return;

    const assets = this.calculatePositionedAssets(state);
    const existingAssets = new Map<string, HTMLElement>();

    Array.from(this.container.children).forEach((element) => {
      if (element.id) {
        existingAssets.set(element.id, element as HTMLElement);
      }
    });

    const shouldExist = new Set(assets.map((asset) => asset.id));

    // Remove assets that shouldn't exist anymore
    existingAssets.forEach((element, id) => {
      if (!shouldExist.has(id)) {
        element.remove();
        existingAssets.delete(id);
      }
    });

    // Create or update assets
    assets.forEach((asset) => {
      let assetElement = existingAssets.get(asset.id);
      const isNewAsset = !assetElement;

      if (isNewAsset) {
        assetElement = this.createElement(asset);
        this.container!.appendChild(assetElement);

        // Apply reveal animation for new assets
        if (asset.revealed && !overlayState.isAssetAnimated(asset.id)) {
          this.applyRevealAnimation(assetElement, asset);
        }
      } else {
        // Update existing asset
        this.updateElement(assetElement!, asset);
      }
    });
  }

  /**
   * Create a new asset element
   */
  private createElement(asset: PositionedAsset): HTMLElement {
    // Check if this asset has already failed permanently
    if (overlayState.isAssetFailed(asset.id)) {
      return this.createFallbackElement(asset);
    }

    const img = document.createElement('img');
    img.id = asset.id;

    // Build CSS classes
    const cssClasses = ['positioned-asset', asset.type];
    cssClasses.push(asset.revealed ? 'revealed' : 'hidden');

    // Add slot-specific classes
    if (asset.slot) {
      const slotType = asset.slot.startsWith('ban')
        ? 'ban'
        : asset.slot === 'pick'
          ? 'pick'
          : asset.slot === 'decider'
            ? 'decider'
            : asset.slot;
      cssClasses.push(slotType);
    }

    img.className = cssClasses.join(' ');
    img.src = getAssetFilePath(asset.asset, asset.type);

    // Set CSS custom properties for positioning
    setCssProperties(img, {
      '--asset-x': `${asset.position.x}px`,
      '--asset-y': `${asset.position.y}px`,
      '--asset-width': `${asset.dimensions.width}px`,
      '--asset-height': `${asset.dimensions.height}px`,
    });

    img.alt = `${asset.player} ${asset.slot} - ${asset.asset}`;

    // Error handling with retry logic
    img.onerror = () => this.handleAssetError(img, asset);
    img.onload = () => {
      overlayState.clearAssetFailed(asset.id);
    };

    return img;
  }

  /**
   * Create fallback element for failed assets
   */
  private createFallbackElement(asset: PositionedAsset): HTMLElement {
    const fallback = document.createElement('div');
    fallback.id = asset.id;

    const cssClasses = ['positioned-asset', 'fallback', asset.type];
    cssClasses.push(asset.revealed ? 'revealed' : 'hidden');

    if (asset.slot) {
      const slotType = asset.slot.startsWith('ban')
        ? 'ban'
        : asset.slot === 'pick'
          ? 'pick'
          : asset.slot === 'decider'
            ? 'decider'
            : asset.slot;
      cssClasses.push(slotType);
    }

    fallback.className = cssClasses.join(' ');

    setCssProperties(fallback, {
      '--asset-x': `${asset.position.x}px`,
      '--asset-y': `${asset.position.y}px`,
      '--asset-width': `${asset.dimensions.width}px`,
      '--asset-height': `${asset.dimensions.height}px`,
    });

    // Fallback styling
    Object.assign(fallback.style, {
      backgroundColor: 'rgba(200, 200, 200, 0.3)',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      textAlign: 'center',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    });

    fallback.innerHTML = `<div>${asset.asset}<br><small>Asset Missing</small></div>`;

    return fallback;
  }

  /**
   * Handle asset load error with retry
   */
  private handleAssetError(img: HTMLImageElement, asset: PositionedAsset): void {
    console.warn(`Failed to load asset: ${img.src}`);

    const retryCount = overlayState.incrementRetryCount(asset.id);

    if (retryCount < ERROR_HANDLING.MAX_RETRY_ATTEMPTS) {
      // Retry after delay
      setTimeout(() => {
        img.src = getAssetFilePath(asset.asset, asset.type);
      }, ERROR_HANDLING.RETRY_DELAY);
    } else {
      // Max retries reached, show fallback
      overlayState.markAssetFailed(asset.id);
      const fallback = this.createFallbackElement(asset);
      img.parentNode?.replaceChild(fallback, img);
      console.error(`Permanently failed to load asset: ${asset.asset}`);
    }
  }

  /**
   * Update existing element
   */
  private updateElement(element: HTMLElement, asset: PositionedAsset): void {
    setCssProperties(element, {
      '--asset-x': `${asset.position.x}px`,
      '--asset-y': `${asset.position.y}px`,
      '--asset-width': `${asset.dimensions.width}px`,
      '--asset-height': `${asset.dimensions.height}px`,
    });

    if (asset.revealed) {
      element.classList.remove('hidden');
      element.classList.add('revealed');

      // Apply animation if not already animated
      if (!overlayState.isAssetAnimated(asset.id)) {
        this.applyRevealAnimation(element, asset);
      }
    } else {
      element.classList.remove('revealed');
      element.classList.add('hidden');
    }

    // Apply visual variants for map assets
    if (asset.type === 'map') {
      if (asset.slot?.startsWith('ban')) {
        element.classList.add('ban');
      } else if (asset.slot === 'decider') {
        element.classList.add('decider');
      }
    }
  }

  /**
   * Apply reveal animation to element
   */
  private applyRevealAnimation(element: HTMLElement, asset: PositionedAsset): void {
    const duration = this.getAnimationDuration(asset);

    element.classList.add('revealing');
    overlayState.markAssetAnimated(asset.id);

    setTimeout(() => {
      element.classList.remove('revealing');
    }, duration);
  }

  /**
   * Get animation duration for asset type
   */
  private getAnimationDuration(asset: PositionedAsset): number {
    if (asset.type === 'map') {
      return ANIMATION_DURATIONS.MAP_REVEAL;
    }
    if (asset.type === 'agent-icon') {
      return ANIMATION_DURATIONS.AGENT_ICON_REVEAL;
    }
    if (asset.type === 'agent-banner') {
      return ANIMATION_DURATIONS.AGENT_BANNER_REVEAL;
    }
    return ANIMATION_DURATIONS.MAP_REVEAL;
  }

  /**
   * Reinitialize container reference
   */
  reinitialize(containerId: string = 'asset-container'): void {
    this.container = getElementById(containerId);
  }
}
