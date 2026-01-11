// UI Store - Single responsibility: transient UI state
// Handles confirmation dialogs, overlay visibility, validation errors

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================
// Store State & Actions Interface
// ============================================

export interface UIStoreState {
  // Error display
  lastError: string | null;

  // Overlay window visibility
  isOverlayOpen: boolean;

  // Confirmation dialogs
  confirmationPending: {
    type: 'reset_tournament' | 'advance_phase' | null;
    message: string | null;
  };

  // Selection flow state (bridges timer and tournament)
  selectionState:
    | 'idle'
    | 'timer_running'
    | 'awaiting_selection'
    | 'selection_pending'
    | 'revealed';

  // Actions
  setError: (error: string | null) => void;
  clearError: () => void;

  setOverlayOpen: (isOpen: boolean) => void;

  requestConfirmation: (type: 'reset_tournament' | 'advance_phase', message: string) => void;
  clearConfirmation: () => void;

  setSelectionState: (state: UIStoreState['selectionState']) => void;
}

// ============================================
// Store Implementation
// ============================================

export const useUIStore = create<UIStoreState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    lastError: null,
    isOverlayOpen: false,
    confirmationPending: {
      type: null,
      message: null,
    },
    selectionState: 'idle',

    // ----------------------------------------
    // Error Handling
    // ----------------------------------------

    setError: (error: string | null) => {
      set({ lastError: error });
    },

    clearError: () => {
      set({ lastError: null });
    },

    // ----------------------------------------
    // Overlay Window
    // ----------------------------------------

    setOverlayOpen: (isOpen: boolean) => {
      set({ isOverlayOpen: isOpen });
    },

    // ----------------------------------------
    // Confirmation Dialogs
    // ----------------------------------------

    requestConfirmation: (type, message) => {
      set({
        confirmationPending: { type, message },
      });
    },

    clearConfirmation: () => {
      set({
        confirmationPending: { type: null, message: null },
      });
    },

    // ----------------------------------------
    // Selection Flow State
    // ----------------------------------------

    setSelectionState: (selectionState) => {
      set({ selectionState });
    },
  }))
);

// ============================================
// Vanilla Store Access
// ============================================

export const uiStore = useUIStore;

// ============================================
// Selector Helpers
// ============================================

export const selectLastError = (state: UIStoreState): string | null => state.lastError;
export const selectIsOverlayOpen = (state: UIStoreState): boolean => state.isOverlayOpen;
export const selectConfirmationPending = (state: UIStoreState) => state.confirmationPending;
export const selectSelectionState = (state: UIStoreState) => state.selectionState;
