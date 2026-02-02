import { closeDb, initDb } from "src/db.js";
import { __clearForTests, stopAutosave } from "src/memorystore.js";
import { init } from "src/socket.js";
import { mockIo } from 'src/__mocks__/io.js';

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
}
