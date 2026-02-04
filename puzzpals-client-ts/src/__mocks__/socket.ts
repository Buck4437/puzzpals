import { vi } from "vitest";

type SocketEvent = string | symbol;

interface MockSocket {
  on: (ev: SocketEvent, cb: Function) => void;
  off: (ev?: SocketEvent, cb?: Function) => void;
  emit: (ev: SocketEvent, payload: any) => void;

  reset: () => void;
  emitServerEvent: (ev: SocketEvent, payload: any) => void;
}

let handlers: Record<SocketEvent, Function[]> = {};

const socket: MockSocket = {
  on(ev, cb) {
    handlers[ev] = (handlers[ev] || []).concat(cb);
    console.log(`Added listener for ${ev.toString()}`);
  },

  off(ev, cb) {
    if (ev === undefined) {
      handlers = {};
      console.log('Removed all listeners');
    } else if (cb === undefined) {
      handlers[ev] = [];
      console.log(`Removed all listeners for ${ev.toString()}`);
    } else {
      handlers[ev] = (handlers[ev] ?? []).filter(f => f !== cb);
      console.log(`Removed listener for ${ev.toString()}`);
    }
  },

  emit: vi.fn(),

  // Called by tests
  reset() {
    handlers = {};
  },

  emitServerEvent(ev, payload) {
    handlers[ev]?.forEach(fn => fn(payload));
    console.log(`Emitted server event ${ev.toString()}`);
  },
};

export default socket;
