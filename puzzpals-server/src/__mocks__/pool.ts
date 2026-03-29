import { vi } from "vitest";

const pool = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  end: vi.fn(),
};

export default pool;
