import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Room } from "../models/Room.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

import { createMockSocket, mockBroadcast, mockIo } from "../__mocks__/io.js";
import pool from "../__mocks__/pool.js";

vi.mock("../pool.js");

describe("Socket", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  const grid = {
    rows: 1,
    cols: 1,
    cells: [
      {
        isBlack: false,
        number: null,
        input: 2,
      },
    ],
    type: "akari",
  };

  const token = "abcdefghij";

  const room: Room = {
    token: token,
    puzzle_data: JSON.stringify(grid),
  };

  // As a player, I want to synchronise my progress with other players
  // so that we can collaborate on the same puzzle.
  it("joins player to room", async () => {
    const socket = createMockSocket();
    pool.query.mockResolvedValueOnce({ rows: [room] });
    await socket.call("room:join", token);

    expect(socket.emit).toHaveBeenCalledWith(
      "room:initialize",
      grid,
      // No need to escape the token, we know it's 10-char alphanumeric
      expect.stringMatching(new RegExp(`^user_${token}_[A-Za-z0-9]{8}$`)),
    );
  });

  it("synchronizes grid with all players in same room", async () => {
    const socket = createMockSocket();
    pool.query.mockResolvedValueOnce({ rows: [room] });
    await socket.call("room:join", token);
    await socket.call("grid:updateCell", 0, 0);

    expect(mockIo.to).toHaveBeenCalledWith(token);
    expect(mockBroadcast).toHaveBeenCalledWith("grid:cellUpdated", 0, 0);
  });

  it("blocks unauthorized calls to grid:updateCell", async () => {
    const socket = createMockSocket();
    await socket.call("grid:updateCell", 0, 0);
    expect(mockIo.to).not.toHaveBeenCalled();
  });

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

  it("blocks unauthorized calls to chat:newMessage", () => {
    const socket = createMockSocket();
    socket.call("chat:newMessage", {
      msgtext: "This message is unauthorized",
    });
    expect(mockIo.to).not.toHaveBeenCalled();
  });
});
