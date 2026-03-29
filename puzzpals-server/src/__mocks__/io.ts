import { vi } from "vitest";

let initSocket: (socket: unknown) => void;
const mockBroadcast = vi.fn();

const mockIo = {
  on(_: unknown, listener: (socket: unknown) => void) {
    initSocket = listener;
  },

  to: vi.fn(() => ({ emit: mockBroadcast })),
};

function createMockSocket() {
  const events: Record<string, (...args: unknown[]) => void> = {};

  const mockSocket = {
    on(ev: string, listener: (...args: unknown[]) => void) {
      events[ev] = listener;
    },

    async call(ev: string, ...args: unknown[]) {
      if (events[ev] !== undefined) {
        // Callback might be async
        await events[ev](...args);
      }
    },

    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
  };

  initSocket(mockSocket);
  return mockSocket;
}

export { mockIo, createMockSocket, mockBroadcast };
