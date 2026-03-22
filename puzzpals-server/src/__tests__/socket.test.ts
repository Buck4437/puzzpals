import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import { __clearStoreForTests, startAutosave } from "../memorystore.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

import { createMockSocket, mockBroadcast, mockIo } from "../__mocks__/io.js";

describe("Socket", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  const payload = {
    type: "akari",
    grid: [["."]],
  };

  const expectedGrid = {
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

  // As a player, I want to synchronise my progress with other players
  // so that we can collaborate on the same puzzle.
  it("joins player to room", async () => {
    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    const socket = createMockSocket();
    socket.call("room:join", token);

    expect(socket.emit).toHaveBeenCalledWith(
      "room:initialize",
      expectedGrid,
      // No need to escape the token, we know it's 10-char alphanumeric
      expect.stringMatching(new RegExp(`^user_${token}_[A-Za-z0-9]{8}$`)),
    );
  });

  it("synchronizes grid with all players in same room", async () => {
    // Open room
    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    const socket = createMockSocket();
    socket.call("room:join", token);
    socket.call("grid:updateCell", 0, 0);

    expect(mockIo.to).toHaveBeenCalledWith(token);
    expect(mockBroadcast).toHaveBeenCalledWith("grid:cellUpdated", 0, 0);
  });

  it("blocks unauthorized calls to grid:updateCell", () => {
    const socket = createMockSocket();
    socket.call("grid:updateCell", 0, 0);
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it("restores room progress after server shuts down", async () => {
    // Mock timer
    vi.useFakeTimers();

    // Enable autosave in this test to allow the timer to call autosave
    startAutosave();

    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    // Wait for 1 minute
    vi.advanceTimersToNextTimer();

    // "Shut down" the server, wiping memory
    __clearStoreForTests();

    const socket = createMockSocket();
    socket.call("room:join", token);

    expect(socket.emit).toHaveBeenCalledWith(
      "room:initialize",
      expectedGrid,
      // Already checked in another test
      expect.anything(),
    );

    // Restore timer
    vi.useRealTimers();
  });

  // As a player, I want to communicate with other players
  // so that we can share insights.
  it("broadcasts chat messages to all players in same room", async () => {
    // Mock time
    vi.useFakeTimers();
    vi.setSystemTime(0);

    // Create a room
    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    // Join the room
    const socket = createMockSocket();
    socket.call("room:join", token);

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
