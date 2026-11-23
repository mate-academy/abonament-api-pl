import { vi } from "vitest";
import type { Hold } from "../../../src/holds/client";
import type { LoanDeps } from "../../../src/loans/deps";
import type { Loan } from "../../../src/store/schema";

// Repozytoria i klient catalog-api to mocki vi.fn.
export function makeMocks() {
  const loans = {
    get: vi.fn<(id: number) => Promise<Loan | undefined>>(),
    update: vi.fn<(id: number, patch: Partial<Loan>) => Promise<void>>().mockResolvedValue(undefined),
    countOverdue: vi.fn<(readerId: number, now: Date) => Promise<number>>().mockResolvedValue(0),
    extend: vi.fn<(id: number, dueAt: Date) => Promise<void>>().mockResolvedValue(undefined),
  };
  const holds = { activeForBook: vi.fn<(bookId: number) => Promise<Hold[]>>().mockResolvedValue([]) };
  const clock = { now: vi.fn(() => new Date("2026-11-03T09:00:00Z")) };
  const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const deps = { loans, holds, clock, log } as unknown as LoanDeps;
  return { loans, holds, clock, log, deps };
}

export function loan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 7,
    readerId: 1,
    bookId: 3,
    issuedAt: new Date("2026-10-20T00:00:00Z"),
    dueAt: new Date("2026-11-10T00:00:00Z"),
    returnedAt: null,
    renewals: 0,
    ...overrides,
  };
}
