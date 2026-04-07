import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameData, SurfaceUpdateMessage } from "@puzzpals/puzzle-models";

import type { Room } from "../models/Room.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

import { createMockSocket, mockBroadcast, mockIo } from "../__mocks__/io.js";
import pool from "../__mocks__/pool.js";

vi.mock("../pool.js");

const gameData: GameData = {
  puzzle: {
    title: "Untitled Puzzle",
    instructions: "",
    size: [1, 1],
    problem: {
      lineObjects: {},
      surfaceObjects: {},
      textObjects: {},
      shapeObjects: {},
    },
    options: {
      rules: [],
    },
  },
  playerSolution: {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  },
};

const token = "abcdefghij";

const room: Room = {
  token: token,
  puzzle_data: gameData,
};

async function createSocketInRoom() {
  const socket = createMockSocket();
  pool.query.mockResolvedValueOnce({ rows: [room] });
  await socket.call("room:join", token);
  return socket;
}

describe("room:join", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

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
    pool.query.mockResolvedValueOnce({ rows: [] });
    await socket.call("room:join", token);
    expect(socket.emit).not.toHaveBeenCalled();
  });
});

describe("grid:edit", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

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

describe("chat:newMessage", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  // As a player, I want to communicate with other players
  // so that we can share insights.
  it("broadcasts chat messages to all players in same room", async () => {
    // Mock time
    vi.useFakeTimers();
    vi.setSystemTime(0);

    // Join the room
    const socket = createMockSocket();
    pool.query.mockResolvedValueOnce({ rows: [room] });
    await socket.call("room:join", token);

    // Send a message
    const msgtext = "Hello, world!";
    socket.call("chat:newMessage", { msgtext });

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
    await socket.call("chat:newMessage", "hello");
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects payload missing message", async () => {
    const socket = await createSocketInRoom();
    await socket.call("chat:newMessage", {});
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects empty message", async () => {
    const socket = await createSocketInRoom();
    await socket.call("chat:newMessage", { msgtext: "   " });
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("rejects message too long", async () => {
    const socket = await createSocketInRoom();
    const longMessage = "x".repeat(1001);
    await socket.call("chat:newMessage", { msgtext: longMessage });
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("blocks unauthorized calls", () => {
    const socket = createMockSocket();
    socket.call("chat:newMessage", {
      msgtext: "This message is unauthorized",
    });
    expect(mockIo.to).not.toHaveBeenCalled();
  });
});
