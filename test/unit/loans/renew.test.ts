import { describe, expect, it } from "vitest";
import { renew } from "../../../src/loans/renew";
import { loan, makeMocks } from "./helpers";

// LIB-218: przypadki 1–8 z zatwierdzonej listy przypadków (docs/LIB-218/cases.md). Dziś: 03.11.2026.
describe("renew", () => {
  it("counts the renewal from due_at, not from today", async () => {
    const m = makeMocks();
    m.loans.get.mockResolvedValue(loan({ dueAt: new Date("2026-11-10T00:00:00Z"), renewals: 0 }));

    await expect(renew(m.deps, 1, 7)).resolves.toEqual(new Date("2026-11-24T00:00:00Z"));
    expect(m.loans.extend).toHaveBeenCalledWith(7, new Date("2026-11-24T00:00:00Z"));
  });
});
