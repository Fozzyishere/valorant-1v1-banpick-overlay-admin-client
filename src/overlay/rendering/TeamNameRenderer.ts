// Team name positioning and rendering

import { PHASE_COORDINATES } from '../config';
import { getElementById } from '../utils';
import type { TournamentPhase } from '../types';

// ============================================
// TeamNameRenderer Class
// ============================================

export class TeamNameRenderer {
  private team1Element: HTMLElement | null = null;
  private team2Element: HTMLElement | null = null;

  constructor() {
    this.team1Element = getElementById('team1-name');
    this.team2Element = getElementById('team2-name');
  }

  /**
   * Update team name text content
   */
  updateNames(teamNames: { P1: string; P2: string }): void {
    if (this.team1Element) {
      const t1 = (teamNames.P1 ?? '').trim();
      this.team1Element.textContent = t1.length ? t1 : 'Player 1';
    }
    if (this.team2Element) {
      const t2 = (teamNames.P2 ?? '').trim();
      this.team2Element.textContent = t2.length ? t2 : 'Player 2';
    }
  }

  /**
   * Position team names based on current phase coordinates
   */
  positionForPhase(phase: TournamentPhase): void {
    const coords = PHASE_COORDINATES[phase]?.teamNames ?? PHASE_COORDINATES['MAP_PHASE'].teamNames;

    if (this.team1Element && coords.p1) {
      this.team1Element.style.left = `${coords.p1.x}px`;
      this.team1Element.style.top = `${coords.p1.y}px`;
      this.team1Element.style.fontSize = coords.p1.fontSize || '48px';
      this.team1Element.style.transform = '';
    }

    if (this.team2Element && coords.p2) {
      this.team2Element.style.left = `${coords.p2.x}px`;
      this.team2Element.style.top = `${coords.p2.y}px`;
      this.team2Element.style.fontSize = coords.p2.fontSize || '48px';
      // Keep right-edge anchoring via translate
      this.team2Element.style.transform = 'translateX(-100%)';
    }
  }

  /**
   * Update both names and positions
   */
  update(teamNames: { P1: string; P2: string }, phase: TournamentPhase): void {
    this.updateNames(teamNames);
    this.positionForPhase(phase);
  }

  /**
   * Re-initialize element references (useful after DOM changes)
   */
  reinitialize(): void {
    this.team1Element = getElementById('team1-name');
    this.team2Element = getElementById('team2-name');
  }
}
