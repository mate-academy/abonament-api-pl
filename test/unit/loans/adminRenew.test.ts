import { afterEach, describe, expect, it, vi } from "vitest";
import { adminRenew } from "../../../src/loans/adminRenew";
import { NotFoundError } from "../../../src/loans/errors";
import { loan, makeMocks } from "./helpers";

describe("adminRenew", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renews at the desk from today, whatever the current due date", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-03T12:00:00Z") });
    const m = makeMocks();
    m.loans.get.mockResolvedValue(loan({ dueAt: new Date("2026-11-10T00:00:00Z"), renewals: 1 }));

    const newDue = await adminRenew(m.deps, 7);

    expect(newDue).toEqual(new Date("2026-11-17T12:00:00Z"));
    expect(m.loans.update).toHaveBeenCalledWith(7, { dueAt: newDue, renewals: 2 });
  });

  it("rejects a returned loan", async () => {
    const m = makeMocks();
    m.loans.get.mockResolvedValue(loan({ returnedAt: new Date("2026-11-01T00:00:00Z") }));

    await expect(adminRenew(m.deps, 7)).rejects.toThrow(NotFoundError);
    expect(m.loans.update).not.toHaveBeenCalled();
  });
});
