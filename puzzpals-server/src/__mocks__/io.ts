import { mock } from "node:test";

let initSocket: (socket: unknown) => void;
const mockBroadcast = mock.fn();

const mockIo = {
  on(_: unknown, listener: (socket: unknown) => void) {
    initSocket = listener;
  },

  to: mock.fn(() => ({ emit: mockBroadcast })),
};

function createMockSocket() {
  const events: Record<string, (...args: unknown[]) => void> = {};

  const mockSocket = {
    on(ev: string, listener: (...args: unknown[]) => void) {
      events[ev] = listener;
    },

    call(ev: string, ...args: unknown[]) {
      if (events[ev] !== undefined) {
        events[ev](...args);
      }
    },

    join: mock.fn(),
    leave: mock.fn(),
    emit: mock.fn(),
  };

  initSocket(mockSocket);
  return mockSocket;
}

export { mockIo, createMockSocket, mockBroadcast };
