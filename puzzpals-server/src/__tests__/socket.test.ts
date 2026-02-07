import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockSocket, mockBroadcast, mockIo } from "../__mocks__/io.js";
import app from "../app.js";
import { __clearForTests, startAutosave } from "../memorystore.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

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
  it("synchronizes grid with all players in same room", async () => {
    // Open room
    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    const socket = createMockSocket();
    socket.call("room:join", { token });
    expect(socket.emit).toHaveBeenCalledWith("grid:state", expectedGrid);

    socket.call("grid:updateCell", { token, idx: 0, value: 0 });
    expect(mockIo.to).toHaveBeenCalledWith(token);
    expect(mockBroadcast).toHaveBeenCalledWith("grid:cellUpdated", {
      idx: 0,
      value: 0,
    });
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
    __clearForTests();

    const socket = createMockSocket();
    socket.call("room:join", { token });
    expect(socket.emit).toHaveBeenCalledWith("grid:state", expectedGrid);
  });
});
