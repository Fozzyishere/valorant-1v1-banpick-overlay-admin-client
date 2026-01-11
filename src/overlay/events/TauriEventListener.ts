// Tauri event subscription

import { emitTo } from '@tauri-apps/api/event';
import type { OverlayPayload } from '../types';

const ADMIN_WINDOW_LABEL = 'main';

// ============================================
// Tauri type declarations
// ============================================

declare global {
  interface Window {
    __TAURI__?: {
      event: {
        listen: (
          event: string,
          handler: (event: { payload: unknown }) => void
        ) => Promise<() => void>;
        emit: (event: string, payload?: unknown) => Promise<void>;
      };
    };
  }
}

// ============================================
// TauriEventListener Class
// ============================================

export class TauriEventListener {
  private unsubscribe: (() => void) | null = null;
  private isSubscribed: boolean = false;

  /**
   * Subscribe to tournament update events
   */
  async subscribe(handler: (payload: OverlayPayload) => void): Promise<void> {
    if (this.isSubscribed) {
      console.warn('TauriEventListener: Already subscribed');
      return;
    }

    if (window.__TAURI__) {
      try {
        this.unsubscribe = await window.__TAURI__.event.listen('tournament-update', (event) => {
          handler(event.payload as OverlayPayload);
        });
        this.isSubscribed = true;

        await this.requestCurrentState();
      } catch (error) {
        console.error('TauriEventListener: Failed to subscribe', error);
      }
    }
  }

  /**
   * Request current state from admin window
   * Uses emitTo for cross-window communication to reach the admin window
   */
  async requestCurrentState(): Promise<void> {
    if (window.__TAURI__) {
      try {
        await emitTo(ADMIN_WINDOW_LABEL, 'overlay-request-state', {});
      } catch (error) {
        console.error('TauriEventListener: Failed to request state', error);
      }
    }
  }

  /**
   * Unsubscribe from events
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isSubscribed = false;
      console.log('TauriEventListener: Unsubscribed from events');
    }
  }

  /**
   * Check if currently subscribed
   */
  getIsSubscribed(): boolean {
    return this.isSubscribed;
  }

  /**
   * Check if Tauri is available
   */
  isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.__TAURI__;
  }
}
