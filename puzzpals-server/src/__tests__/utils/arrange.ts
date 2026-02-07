import { vi } from "vitest";

import { mockIo } from "../../__mocks__/io.js";
import { closeDb, initDb } from "../../db.js";
import { __clearForTests, stopAutosave } from "../../memorystore.js";
import { init } from "../../socket.js";

export function arrangeBeforeEach() {
  // @ts-expect-error, we're inserting a mock object
  init(mockIo);

  // In-memory databases are deleted when closed
  initDb(":memory:");
}

export function cleanUpAfterEach() {
  stopAutosave();
  closeDb();
  __clearForTests();
  vi.clearAllMocks();
}
