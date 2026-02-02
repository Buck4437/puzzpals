import { vi } from "vitest";

export const pushMock = vi.fn();

export function useRouter() {
  return {
    push: pushMock,
  };
}
