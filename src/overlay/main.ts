// Overlay main entry point

import { overlayState } from './state';
import {
  BackgroundManager,
  TeamNameRenderer,
  TimerRenderer,
  AssetRenderer,
  SlotOverlayRenderer,
} from './rendering';
import { TransitionController } from './animation';
import { TauriEventListener } from './events';
import type { OverlayPayload, StateChanges } from './types';

// ============================================
// OverlayApp Class
// ============================================

class OverlayApp {
  // Renderers
  private backgroundManager: BackgroundManager;
  private teamNameRenderer: TeamNameRenderer;
  private timerRenderer: TimerRenderer;
  private assetRenderer: AssetRenderer;
  private slotOverlayRenderer: SlotOverlayRenderer;

  // Animation
  private transitionController: TransitionController;

  // Events
  private eventListener: TauriEventListener;

  constructor() {
    // Initialize all modules
    this.backgroundManager = new BackgroundManager();
    this.teamNameRenderer = new TeamNameRenderer();
    this.timerRenderer = new TimerRenderer();
    this.assetRenderer = new AssetRenderer('asset-container');
    this.slotOverlayRenderer = new SlotOverlayRenderer(this.assetRenderer);
    this.transitionController = new TransitionController();
    this.eventListener = new TauriEventListener();
  }

  /**
   * Initialize the overlay application
   */
  async initialize(): Promise<void> {
    console.log('OverlayApp: Initializing...');

    // Subscribe to Tauri events
    await this.eventListener.subscribe(this.handleUpdate.bind(this));

    // Initialize with default state
    const initialState = overlayState.getState();
    this.initializeRenderers(initialState);

    // Expose dev testing interface
    this.exposeDevInterface();

    console.log('OverlayApp: Initialized');
  }

  /**
   * Initialize all renderers with initial state
   */
  private initializeRenderers(state: OverlayPayload): void {
    this.transitionController.initialize(state.currentPhase);
    this.backgroundManager.initialize(state.currentPhase);
    this.teamNameRenderer.update(state.teamNames, state.currentPhase);
    this.timerRenderer.update(state.timerSeconds, state.timerState);
    this.assetRenderer.updateAssetPositions(state);
    this.slotOverlayRenderer.update(state);
  }

  /**
   * Handle incoming tournament update
   */
  private handleUpdate(payload: OverlayPayload): void {
    const changes = overlayState.update(payload);
    const state = overlayState.getState();

    // Handle phase transitions
    if (changes.phaseChanged) {
      this.handlePhaseChange(changes, state);
    }

    // Update team names if changed
    if (changes.teamNamesChanged) {
      this.teamNameRenderer.update(state.teamNames, state.currentPhase);
    }

    // Update timer
    if (changes.timerChanged) {
      this.timerRenderer.update(state.timerSeconds, state.timerState);
    }

    // Always update assets and slot overlays
    this.assetRenderer.updateAssetPositions(state);
    this.slotOverlayRenderer.update(state);
  }

  /**
   * Handle phase change with animations
   */
  private handlePhaseChange(changes: StateChanges, _state: OverlayPayload): void {
    this.transitionController.updatePhaseContainer(changes.newPhase, changes.previousPhase);
    this.backgroundManager.transitionTo(changes.newPhase);
    this.teamNameRenderer.positionForPhase(changes.newPhase);
  }

  /**
   * Expose development testing interface
   */
  private exposeDevInterface(): void {
    // Main update function for dev testing
    (window as any).updateOverlay = (payload: Partial<OverlayPayload>) => {
      this.handleUpdate({ ...overlayState.getState(), ...payload });
    };

    // Manual asset reveal
    (window as any).revealAssets = (_staggered: boolean = true) => {
      const state = overlayState.getState();
      // Force reveal all assets
      overlayState.update({ ...state });
      this.assetRenderer.updateAssetPositions(overlayState.getState());
    };

    // Reset reveal state
    (window as any).resetRevealState = () => {
      overlayState.resetForNewTournament();
    };

    // Diagnostics
    (window as any).getAssetDiagnostics = () => overlayState.getDiagnostics();

    // Test phase transitions
    (window as any).testPhaseTransition = () => {
      const phases: Array<'MAP_PHASE' | 'AGENT_PHASE' | 'CONCLUSION'> = [
        'MAP_PHASE',
        'AGENT_PHASE',
        'CONCLUSION',
      ];
      let currentIndex = 0;

      setInterval(() => {
        this.handleUpdate({
          ...overlayState.getState(),
          currentPhase: phases[currentIndex % phases.length],
          teamNames: { P1: 'Team Alpha', P2: 'Team Bravo' },
        });
        currentIndex++;
      }, 3000);
    };

    // Test staggered reveal
    (window as any).testStaggeredReveal = () => {
      this.handleUpdate({
        ...overlayState.getState(),
        currentPhase: 'MAP_PHASE',
        mapsBanned: {
          P1: ['ascent', 'bind', 'haven'],
          P2: ['lotus', 'pearl', 'split'],
        },
        teamNames: { P1: 'Team Alpha', P2: 'Team Bravo' },
        timerState: 'finished',
      });
    };

    console.log('OverlayApp: Dev interface exposed (updateOverlay, revealAssets, etc.)');
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.eventListener.cleanup();
    this.timerRenderer.dispose();
  }
}

// ============================================
// Application Bootstrap
// ============================================

let app: OverlayApp | null = null;

window.addEventListener('load', () => {
  app = new OverlayApp();
  app.initialize().catch((error) => {
    console.error('OverlayApp: Failed to initialize', error);
  });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app?.dispose();
});
