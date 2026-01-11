// Timer Store Tests
// Tests for Rust backend integrated timer store

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTimerStore } from './timerStore';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

import { invoke } from '@tauri-apps/api/core';

describe('timerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useTimerStore.setState({
      status: 'ready',
      seconds: 3,
      initialSeconds: 3,
      onTimerFinished: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial status', () => {
      const state = useTimerStore.getState();
      expect(state.status).toBe('ready');
    });

    it('should have correct initial seconds', () => {
      const state = useTimerStore.getState();
      expect(state.seconds).toBe(3);
      expect(state.initialSeconds).toBe(3);
    });
  });

  describe('startTimer', () => {
    it('should invoke start_timer command', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        status: 'running',
        seconds: 3,
        initial_seconds: 3,
      });

      await useTimerStore.getState().startTimer();

      expect(invoke).toHaveBeenCalledWith('start_timer');
    });

    it('should throw error if command fails', async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Command failed'));

      await expect(useTimerStore.getState().startTimer()).rejects.toThrow('Command failed');
    });
  });

  describe('pauseTimer', () => {
    it('should invoke pause_timer command', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        status: 'paused',
        seconds: 2,
        initial_seconds: 3,
      });

      await useTimerStore.getState().pauseTimer();

      expect(invoke).toHaveBeenCalledWith('pause_timer');
    });
  });

  describe('resetTimer', () => {
    it('should invoke reset_timer command with default seconds', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        status: 'ready',
        seconds: 3,
        initial_seconds: 3,
      });

      await useTimerStore.getState().resetTimer();

      expect(invoke).toHaveBeenCalledWith('reset_timer', { seconds: 3 });
    });

    it('should invoke reset_timer command with custom seconds', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        status: 'ready',
        seconds: 30,
        initial_seconds: 30,
      });

      await useTimerStore.getState().resetTimer(30);

      expect(invoke).toHaveBeenCalledWith('reset_timer', { seconds: 30 });
    });
  });

  describe('_updateFromRust', () => {
    it('should update state from Rust payload', () => {
      useTimerStore.getState()._updateFromRust({
        status: 'running',
        seconds: 25,
        initial_seconds: 30,
        timestamp_ms: Date.now(),
      });

      const state = useTimerStore.getState();
      expect(state.status).toBe('running');
      expect(state.seconds).toBe(25);
      expect(state.initialSeconds).toBe(30);
    });
  });

  describe('onTimerFinished callback', () => {
    it('should store callback when set', () => {
      const callback = vi.fn();
      useTimerStore.getState().setOnTimerFinished(callback);

      const state = useTimerStore.getState();
      expect(state.onTimerFinished).toBe(callback);
    });

    it('should clear callback when set to null', () => {
      const callback = vi.fn();
      useTimerStore.getState().setOnTimerFinished(callback);
      useTimerStore.getState().setOnTimerFinished(null);

      const state = useTimerStore.getState();
      expect(state.onTimerFinished).toBeNull();
    });
  });

  describe('getSnapshot', () => {
    it('should return state without internal fields', () => {
      useTimerStore.setState({
        status: 'running',
        seconds: 15,
        initialSeconds: 30,
        onTimerFinished: vi.fn(),
      });

      const snapshot = useTimerStore.getState().getSnapshot();

      expect(snapshot).toEqual({
        status: 'running',
        seconds: 15,
        initialSeconds: 30,
      });
      expect(snapshot).not.toHaveProperty('onTimerFinished');
      expect(snapshot).not.toHaveProperty('_updateFromRust');
    });
  });
});