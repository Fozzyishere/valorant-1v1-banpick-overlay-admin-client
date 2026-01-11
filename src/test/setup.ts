// Vitest test setup
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Tauri API for testing
const mockTauriEvent = {
  emit: vi.fn().mockResolvedValue(undefined),
  emitTo: vi.fn().mockResolvedValue(undefined),
  listen: vi.fn().mockResolvedValue(() => {}),
};

// Setup global Tauri mock
Object.defineProperty(globalThis, 'window', {
  value: {
    __TAURI__: {
      event: mockTauriEvent,
    },
  },
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
