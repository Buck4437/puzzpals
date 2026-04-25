import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SurfaceUpdateMessage } from "@puzzpals/puzzle-models";

import type { Room } from "../models/Room.js";
import pool from "../pool.js";
import { init } from "../socket.js";

import { gameData } from "./utils/objects.js";

const mockPool = vi.mocked(pool);

// The function used to initialise a socket, containing socket.on(...)
let initSocket: (socket: unknown) => void;

// Mock function for intercepting broadcasts
const mockBroadcast = vi.fn();

// Mock Socket.IO server socket
const mockIo = {
  on(_: unknown, listener: (socket: unknown) => void) {
    initSocket = listener;
  },

  to: vi.fn(() => ({ emit: mockBroadcast })),
};

type Callback = (...args: unknown[]) => void | Promise<void>;

// Factory for mock Socket.IO client sockets
function createMockSocket() {
  const events: Record<string, Callback> = {};

  const mockSocket = {
    on(ev: string, listener: Callback) {
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

const token = "abcdefghij";

const room: Room = {
  token: token,
  puzzle_data: gameData,
};

function setQueryResolveValue(rows: unknown[]) {
  // @ts-expect-error, TypeScript can't type this mock
  mockPool.query.mockResolvedValueOnce({ rows });
}

async function createSocketInRoom() {
  const socket = createMockSocket();
  setQueryResolveValue([room]);
  await socket.call("room:join", token);
  return socket;
}

beforeEach(() => {
  // @ts-expect-error, we're inserting a mock object
  init(mockIo);
});

describe("room:join", () => {
  // As a player, I want to synchronise my progress with other players
  // so that we can collaborate on the same puzzle.
  it("joins player to room", async () => {
    const socket = await createSocketInRoom();

    expect(socket.emit).toHaveBeenCalledWith(
      "room:initialize",
      gameData,
      // No need to escape the token, we know it's 10-char alphanumeric
      expect.stringMatching(new RegExp(`^user_${token}_[A-Za-z0-9]{8}$`)),
    );
  });

  it("rejects wrong token type", async () => {
    const socket = createMockSocket();
    await socket.call("room:join", 123);
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it("rejects joining non-existent room", async () => {
    const socket = createMockSocket();
    setQueryResolveValue([]);
    await socket.call("room:join", token);
    expect(socket.emit).not.toHaveBeenCalled();
  });
});

describe("grid:edit", () => {
  it("synchronizes grid with all players in same room", async () => {
    const editMessage: SurfaceUpdateMessage = {
      messageType: "edit",
      type: "surfaceObjects",
      data: {
        location: [0, 0],
        color: "black",
      },
    };

    const socket = await createSocketInRoom();
    await socket.call("grid:edit", editMessage);

    expect(mockIo.to).toHaveBeenCalledWith(token);
    expect(mockBroadcast).toHaveBeenCalledWith("grid:edited", editMessage);
  });
});

describe("chat:sendMessage", () => {
  // As a player, I want to communicate with other players
  // so that we can share insights.
  it("broadcasts chat messages to all players in same room", async () => {
    // Mock time
    vi.useFakeTimers();
    vi.setSystemTime(0);

    // Join the room
    const socket = await createSocketInRoom();

    // Send a message
    const msgtext = "Hello, world!";
    await socket.call("chat:sendMessage", { msgtext });

    // Get generated user name from "room:initialize"
    const user = socket.emit.mock.calls.at(0)?.at(2);

    // Assert message is broadcast
    expect(mockIo.to).toHaveBeenCalledWith(token);
    expect(mockBroadcast).toHaveBeenCalledWith("chat:messageNew", {
      user,
      msgtext,
      timestamp: 0,
    });

    // Restore time
    vi.useRealTimers();
  });

  it("rejects wrong payload type", async () => {
    const socket = await createSocketInRoom();
    await socket.call("chat:sendMessage", "hello");
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects payload missing message", async () => {
    const socket = await createSocketInRoom();
    await socket.call("chat:sendMessage", {});
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects empty message", async () => {
    const socket = await createSocketInRoom();
    await socket.call("chat:sendMessage", { msgtext: "   " });
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects message too long", async () => {
    const socket = await createSocketInRoom();
    const longMessage = "x".repeat(1001);
    await socket.call("chat:sendMessage", { msgtext: longMessage });
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("blocks unauthorized calls", async () => {
    const socket = createMockSocket();
    await socket.call("chat:sendMessage", {
      msgtext: "This message is unauthorized",
    });
    expect(mockIo.to).not.toHaveBeenCalled();
  });
});
