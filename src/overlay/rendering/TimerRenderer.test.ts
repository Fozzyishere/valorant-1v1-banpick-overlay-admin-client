// TimerRenderer tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerRenderer } from './TimerRenderer';

// Mock DOM
const mockTimerElement = {
  textContent: '',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  style: {},
};

vi.mock('../utils', () => ({
  getElementById: vi.fn(() => mockTimerElement),
  replaceClasses: vi.fn((element, toRemove, toAdd) => {
    element.classList.remove(...toRemove);
    element.classList.add(...toAdd);
  }),
}));

describe('TimerRenderer', () => {
  let renderer: TimerRenderer;

  beforeEach(() => {
    mockTimerElement.textContent = '';
    mockTimerElement.classList.add.mockClear();
    mockTimerElement.classList.remove.mockClear();
    renderer = new TimerRenderer();
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('update()', () => {
    it('should update displayed seconds', () => {
      renderer.update(25, 'ready');

      expect(mockTimerElement.textContent).toBe('25');
    });

    it('should floor decimal seconds', () => {
      renderer.update(15.7, 'running');

      expect(mockTimerElement.textContent).toBe('15');
    });

    it('should clamp negative values to 0', () => {
      renderer.update(-5, 'finished');

      expect(mockTimerElement.textContent).toBe('0');
    });

    it('should update current status', () => {
      renderer.update(30, 'running');

      expect(renderer.getCurrentStatus()).toBe('running');
    });

    it('should track current seconds', () => {
      renderer.update(20, 'paused');

      expect(renderer.getCurrentSeconds()).toBe(20);
    });

    it('should display 0 when finished', () => {
      renderer.update(0, 'finished');

      expect(mockTimerElement.textContent).toBe('0');
      expect(renderer.getCurrentStatus()).toBe('finished');
    });
  });

  describe('status transitions', () => {
    it('should handle ready to running transition', () => {
      renderer.update(30, 'ready');
      expect(renderer.getCurrentStatus()).toBe('ready');

      renderer.update(30, 'running');
      expect(renderer.getCurrentStatus()).toBe('running');
    });

    it('should handle running to paused transition', () => {
      renderer.update(30, 'running');
      expect(renderer.getCurrentStatus()).toBe('running');

      renderer.update(25, 'paused');
      expect(renderer.getCurrentStatus()).toBe('paused');
      expect(renderer.getCurrentSeconds()).toBe(25);
    });

    it('should handle running to finished transition', () => {
      renderer.update(1, 'running');
      expect(renderer.getCurrentStatus()).toBe('running');

      renderer.update(0, 'finished');
      expect(renderer.getCurrentStatus()).toBe('finished');
      expect(renderer.getCurrentSeconds()).toBe(0);
    });
  });

  describe('reinitialize()', () => {
    it('should reinitialize element reference', () => {
      renderer.reinitialize();
      // Should not throw
      renderer.update(10, 'ready');
      expect(mockTimerElement.textContent).toBe('10');
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposed', () => {
      renderer.update(30, 'running');
      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});