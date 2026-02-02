import { mock } from "node:test";

let initSocket: (socket: any) => void;
const mockBroadcast = mock.fn();

const mockIo = {
  on(_: any, listener: (socket: any) => void) {
    initSocket = listener;
  },

  to: mock.fn(() => ({ emit: mockBroadcast }))
};

function createMockSocket() {
  const events: { [ev: string]: (...args: any[]) => void; } = {};

  const mockSocket = {
    on(ev: string, listener: (...args: any[]) => void) {
      events[ev] = listener;
    },

    call(ev: string, ...args: any[]) {
      if (events[ev] !== undefined) {
        events[ev](...args);
      }
    },

    join: mock.fn(),
    leave: mock.fn(),
    emit: mock.fn()
  };

  initSocket(mockSocket);
  return mockSocket;
}

export { mockIo, createMockSocket, mockBroadcast };
