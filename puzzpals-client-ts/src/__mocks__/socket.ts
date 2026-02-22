import { vi } from "vitest";

type SocketEvent = string | symbol;
type Callback = (...args: unknown[]) => void;

interface MockSocket {
  on: (ev: SocketEvent, cb: Callback) => void;
  off: (ev?: SocketEvent, cb?: Callback) => void;
  emit: (ev: SocketEvent, ...args: unknown[]) => void;
  disconnect: () => void;

  reset: () => void;
  call: (ev: SocketEvent, ...args: unknown[]) => void;
}

let handlers: Record<SocketEvent, Callback[]> = {};

const socket: MockSocket = {
  on(ev, cb) {
    handlers[ev] = (handlers[ev] || []).concat(cb);
    console.log(`Added listener for ${ev.toString()}`);
  },

  off(ev, cb) {
    if (ev === undefined) {
      handlers = {};
      console.log("Removed all listeners");
    } else if (cb === undefined) {
      handlers[ev] = [];
      console.log(`Removed all listeners for ${ev.toString()}`);
    } else {
      handlers[ev] = (handlers[ev] ?? []).filter((f) => f !== cb);
      console.log(`Removed listener for ${ev.toString()}`);
    }
  },

  emit: vi.fn(),
  disconnect: vi.fn(),

  // Called by tests
  reset() {
    handlers = {};
  },

  call(ev, ...args) {
    handlers[ev]?.forEach((fn) => fn(...args));
    console.log(`Emitted server event ${ev.toString()}`);
  },
};

export default socket;
