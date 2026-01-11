// UI Store Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      lastError: null,
      isOverlayOpen: false,
      confirmationPending: { type: null, message: null },
      selectionState: 'idle',
    });
  });

  describe('initial state', () => {
    it('should have no error', () => {
      const state = useUIStore.getState();
      expect(state.lastError).toBeNull();
    });

    it('should have overlay closed', () => {
      const state = useUIStore.getState();
      expect(state.isOverlayOpen).toBe(false);
    });

    it('should have no confirmation pending', () => {
      const state = useUIStore.getState();
      expect(state.confirmationPending.type).toBeNull();
    });

    it('should have idle selection state', () => {
      const state = useUIStore.getState();
      expect(state.selectionState).toBe('idle');
    });
  });

  describe('error handling', () => {
    it('should set error message', () => {
      useUIStore.getState().setError('Something went wrong');
      const state = useUIStore.getState();
      expect(state.lastError).toBe('Something went wrong');
    });

    it('should clear error', () => {
      useUIStore.getState().setError('Error');
      useUIStore.getState().clearError();
      const state = useUIStore.getState();
      expect(state.lastError).toBeNull();
    });

    it('should allow setting error to null', () => {
      useUIStore.getState().setError('Error');
      useUIStore.getState().setError(null);
      const state = useUIStore.getState();
      expect(state.lastError).toBeNull();
    });
  });

  describe('overlay visibility', () => {
    it('should set overlay open', () => {
      useUIStore.getState().setOverlayOpen(true);
      const state = useUIStore.getState();
      expect(state.isOverlayOpen).toBe(true);
    });

    it('should set overlay closed', () => {
      useUIStore.getState().setOverlayOpen(true);
      useUIStore.getState().setOverlayOpen(false);
      const state = useUIStore.getState();
      expect(state.isOverlayOpen).toBe(false);
    });
  });

  describe('confirmation dialogs', () => {
    it('should request confirmation', () => {
      useUIStore.getState().requestConfirmation('reset_tournament', 'Are you sure?');
      const state = useUIStore.getState();

      expect(state.confirmationPending.type).toBe('reset_tournament');
      expect(state.confirmationPending.message).toBe('Are you sure?');
    });

    it('should clear confirmation', () => {
      useUIStore.getState().requestConfirmation('reset_tournament', 'Are you sure?');
      useUIStore.getState().clearConfirmation();
      const state = useUIStore.getState();

      expect(state.confirmationPending.type).toBeNull();
      expect(state.confirmationPending.message).toBeNull();
    });

    it('should support advance_phase confirmation', () => {
      useUIStore.getState().requestConfirmation('advance_phase', 'Advance to agent phase?');
      const state = useUIStore.getState();

      expect(state.confirmationPending.type).toBe('advance_phase');
    });
  });

  describe('selection state', () => {
    it('should set selection state', () => {
      useUIStore.getState().setSelectionState('timer_running');
      const state = useUIStore.getState();
      expect(state.selectionState).toBe('timer_running');
    });

    it('should transition through selection states', () => {
      useUIStore.getState().setSelectionState('timer_running');
      useUIStore.getState().setSelectionState('selection_pending');
      useUIStore.getState().setSelectionState('revealed');
      const state = useUIStore.getState();
      expect(state.selectionState).toBe('revealed');
    });

    it('should reset to idle', () => {
      useUIStore.getState().setSelectionState('revealed');
      useUIStore.getState().setSelectionState('idle');
      const state = useUIStore.getState();
      expect(state.selectionState).toBe('idle');
    });
  });
});
