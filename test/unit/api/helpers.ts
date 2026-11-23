import { vi } from "vitest";
import { buildApp, type AppDeps } from "../../../src/api/app";
import type { Loan, Reader } from "../../../src/store/schema";

export const reader1: Reader = { id: 1, name: "Anna Kowalska", email: "reader1@example.com", apiToken: "t1" };

export function makeApp() {
  const loans = {
    get: vi.fn<(id: number) => Promise<Loan | undefined>>(),
    update: vi.fn<(id: number, patch: Partial<Loan>) => Promise<void>>().mockResolvedValue(undefined),
  };
  const readers = {
    byToken: vi.fn(async (token: string) => (token === "t1" ? reader1 : undefined)),
  };
  const holds = { activeForBook: vi.fn().mockResolvedValue([]) };
  const clock = { now: () => new Date("2026-11-03T09:00:00Z") };
  const deps = { loans, readers, holds, clock, librarianToken: "lib" } as unknown as AppDeps;
  return { app: buildApp(deps), loans, readers, holds };
}
