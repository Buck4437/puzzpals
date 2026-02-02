import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import request from "supertest";

import app from "src/app.js";
import { arrangeBeforeEach, cleanUpAfterEach, } from "./utils/arrange.js";
import { createMockSocket, mockBroadcast, mockIo } from "src/__mocks__/io.js";
import { __clearForTests, startAutosave } from "src/memorystore.js";

function assertEmit(actual: any[], expectedEvent: string, ...expectedPayload: any[]) {
  assert.equal(actual[0], expectedEvent);
  const actualPayload = actual.slice(1).map(x => JSON.parse(JSON.stringify(x)));
  assert.deepEqual(actualPayload, expectedPayload);
}

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

    assertEmit(socket.emit.mock.calls[1]!.arguments, "grid:state", expectedGrid);

    socket.call("grid:updateCell", { token, idx: 0, value: 0 });
    assert.deepEqual(mockIo.to.mock.calls[0]!.arguments, [token]);
    assertEmit(mockBroadcast.mock.calls[0]!.arguments, "grid:cellUpdated", { idx: 0, value: 0 });
  });

  it("restores room progress after server shuts down", async (t) => {
    t.mock.timers.enable({ apis: ["setInterval"] });

    // Enable autosave in this test to allow the timer to call autosave
    startAutosave();

    const res = await request(app).post("/api/rooms/create").send(payload);
    const token = res.body.token;

    // Wait for 1 minute
    t.mock.timers.tick(60 * 1000);

    // "Shut down" the server, wiping memory
    __clearForTests();

    const socket = createMockSocket();
    socket.call("room:join", { token });

    assertEmit(socket.emit.mock.calls[1]!.arguments, "grid:state", expectedGrid);
  });
});
