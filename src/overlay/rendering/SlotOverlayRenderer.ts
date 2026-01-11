// Slot overlay rendering for ban/pick indicators on grid

import { MAP_SLOT_COORDS, AGENT_SLOT_COORDS } from '../config';
import { getElementById } from '../utils/domHelpers';
import type { OverlayPayload, PositionedAsset } from '../types';
import { AssetRenderer } from './AssetRenderer';

// ============================================
// SlotOverlayRenderer Class
// ============================================

export class SlotOverlayRenderer {
  private mapOverlayContainer: HTMLElement | null = null;
  private agentOverlayContainer: HTMLElement | null = null;
  private assetRenderer: AssetRenderer;

  constructor(assetRenderer: AssetRenderer) {
    this.mapOverlayContainer = getElementById('map-overlay-container');
    this.agentOverlayContainer = getElementById('agent-overlay-container');
    this.assetRenderer = assetRenderer;
  }

  /**
   * Update all slot overlays
   */
  update(state: OverlayPayload): void {
    this.updateMapSlotOverlays(state);
    this.updateAgentSlotOverlays(state);
  }

  /**
   * Build and render map slot overlays based on revealed map actions
   */
  updateMapSlotOverlays(state: OverlayPayload): void {
    if (!this.mapOverlayContainer) return;

    // Only active in map phase
    if (state.currentPhase !== 'MAP_PHASE') {
      this.mapOverlayContainer.innerHTML = '';
      return;
    }

    const assets = this.assetRenderer.calculatePositionedAssets(state);
    const mapStates = this.calculateMapStates(assets);

    this.updateOverlays(this.mapOverlayContainer, mapStates, MAP_SLOT_COORDS, 'map-slot-overlay');
  }

  /**
   * Build and render agent slot overlays based on revealed agent actions
   */
  updateAgentSlotOverlays(state: OverlayPayload): void {
    if (!this.agentOverlayContainer) return;

    // Only active in agent phase
    if (state.currentPhase !== 'AGENT_PHASE') {
      this.agentOverlayContainer.innerHTML = '';
      return;
    }

    const assets = this.assetRenderer.calculatePositionedAssets(state);
    const agentStates = this.calculateAgentStates(assets);

    this.updateOverlays(
      this.agentOverlayContainer,
      agentStates,
      AGENT_SLOT_COORDS,
      'agent-slot-overlay'
    );
  }

  /**
   * Calculate map states from assets
   */
  private calculateMapStates(assets: PositionedAsset[]): Map<string, string> {
    const mapStates = new Map<string, string>();

    for (const asset of assets) {
      if (asset.type !== 'map' || !asset.revealed) continue;

      const kind = asset.slot?.startsWith('ban')
        ? 'ban'
        : asset.slot === 'decider'
          ? 'decider'
          : asset.slot === 'pick'
            ? 'pick'
            : null;

      if (!kind) continue;

      // Priority: decider > pick > ban
      const prev = mapStates.get(asset.asset);
      if (
        !prev ||
        (prev === 'ban' && (kind === 'pick' || kind === 'decider')) ||
        (prev === 'pick' && kind === 'decider')
      ) {
        mapStates.set(asset.asset, kind);
      }
    }

    return mapStates;
  }

  /**
   * Calculate agent states from assets
   */
  private calculateAgentStates(assets: PositionedAsset[]): Map<string, string> {
    const agentStates = new Map<string, string>();

    for (const asset of assets) {
      if ((asset.type !== 'agent-icon' && asset.type !== 'agent-banner') || !asset.revealed) {
        continue;
      }

      const kind = asset.slot?.startsWith('ban') ? 'ban' : asset.slot === 'pick' ? 'pick' : null;

      if (!kind) continue;

      // Priority: pick > ban
      const prev = agentStates.get(asset.asset);
      if (!prev || (prev === 'ban' && kind === 'pick')) {
        agentStates.set(asset.asset, kind);
      }
    }

    return agentStates;
  }

  /**
   * Update overlay elements in a container
   */
  private updateOverlays(
    container: HTMLElement,
    states: Map<string, string>,
    coordsMap: Record<string, { x: number; y: number }>,
    baseClass: string
  ): void {
    // Get existing overlays
    const existingOverlays = new Map<string, HTMLElement>();
    Array.from(container.children).forEach((element) => {
      const left = parseInt((element as HTMLElement).style.left);
      const top = parseInt((element as HTMLElement).style.top);

      for (const [name, coords] of Object.entries(coordsMap)) {
        if (coords.x === left && coords.y === top) {
          existingOverlays.set(name, element as HTMLElement);
          break;
        }
      }
    });

    // Track which overlays should exist
    const shouldExist = new Set(states.keys());

    // Remove overlays that shouldn't exist anymore
    existingOverlays.forEach((element, name) => {
      if (!shouldExist.has(name)) {
        element.remove();
        existingOverlays.delete(name);
      }
    });

    // Create or update overlays
    for (const [name, kind] of states.entries()) {
      const coords = coordsMap[name];
      if (!coords) continue;

      let overlayElement = existingOverlays.get(name);
      const isNewOverlay = !overlayElement;

      if (isNewOverlay) {
        overlayElement = document.createElement('div');
        overlayElement.style.left = `${coords.x}px`;
        overlayElement.style.top = `${coords.y}px`;
        container.appendChild(overlayElement);
      }

      overlayElement!.className = `${baseClass} ${kind}`;
    }
  }

  /**
   * Reinitialize container references
   */
  reinitialize(): void {
    this.mapOverlayContainer = getElementById('map-overlay-container');
    this.agentOverlayContainer = getElementById('agent-overlay-container');
  }
}
