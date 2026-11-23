import { describe, expect, it } from "vitest";
import { fineMinor } from "../../../src/loans/fines";

const now = new Date("2026-11-03T09:00:00Z");

describe("fineMinor", () => {
  it("no fine before due date", () => {
    expect(fineMinor({ dueAt: new Date("2026-11-10T00:00:00Z"), returnedAt: null }, now)).toBe(0);
  });

  it("5 PLN per business day for an unreturned loan", () => {
    // due pt 30.10, dziś wt 03.11: pn i wt to 2 dni robocze
    expect(fineMinor({ dueAt: new Date("2026-10-30T00:00:00Z"), returnedAt: null }, now)).toBe(1000);
  });

  it("counts up to the return date for a returned loan", () => {
    const loan = { dueAt: new Date("2026-10-12T00:00:00Z"), returnedAt: new Date("2026-10-15T00:00:00Z") };
    expect(fineMinor(loan, now)).toBe(1500);
  });
});
