// Timer display rendering
// No local interpolation needed

import { getElementById, replaceClasses } from '../utils';
import type { TimerStatus } from '../types';

// ============================================
// TimerRenderer Class
// ============================================

export class TimerRenderer {
  private timerElement: HTMLElement | null = null;
  private currentSeconds: number = 0;
  private currentStatus: TimerStatus = 'ready';

  constructor() {
    this.timerElement = getElementById('timer-display');
  }

  /**
   * Update timer display from Rust state
   * Called when timer-tick event is received
   */
  update(seconds: number, status: TimerStatus): void {
    this.currentSeconds = seconds;
    this.currentStatus = status;
    this.render();
  }

  /**
   * Render current timer state to DOM
   */
  private render(): void {
    if (!this.timerElement) return;

    const displaySeconds = Math.max(0, Math.floor(this.currentSeconds));
    this.timerElement.textContent = String(displaySeconds);

    // Update status classes
    const statusClasses: TimerStatus[] = ['ready', 'running', 'paused', 'finished'];
    replaceClasses(this.timerElement, statusClasses, [this.currentStatus]);
  }

  /**
   * Get current displayed seconds
   */
  getCurrentSeconds(): number {
    return this.currentSeconds;
  }

  /**
   * Get current status
   */
  getCurrentStatus(): TimerStatus {
    return this.currentStatus;
  }

  /**
   * Re-initialize element reference
   */
  reinitialize(): void {
    this.timerElement = getElementById('timer-display');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
  }
}