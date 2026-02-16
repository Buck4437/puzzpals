import { vi } from "vitest";

import { mockIo } from "../../__mocks__/io.js";
import { closeDb, initDb } from "../../db.js";
import { __clearStoreForTests, stopAutosave } from "../../memorystore.js";
import { __clearSocketsForTests, init } from "../../socket.js";

export function arrangeBeforeEach() {
  // @ts-expect-error, we're inserting a mock object
  init(mockIo);

  // In-memory databases are deleted when closed
  initDb(":memory:");
}

export function cleanUpAfterEach() {
  stopAutosave();
  closeDb();
  __clearSocketsForTests();
  __clearStoreForTests();
  vi.clearAllMocks();
}
