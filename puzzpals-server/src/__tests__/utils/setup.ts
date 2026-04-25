import { afterEach, vi } from "vitest";

import { __clearStoreForTests, stopAutosave } from "../../memorystore.js";
import { __clearSocketsForTests } from "../../socket.js";

vi.mock(import("../../pool.js"));

afterEach(async () => {
  await stopAutosave();
  __clearSocketsForTests();
  __clearStoreForTests();
  vi.clearAllMocks();
});
