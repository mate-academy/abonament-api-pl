import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LoansRepo } from "../../../src/store/loans.repo";
import { addLoan, addReader, startDb, type TestDb } from "../setup";

let t: TestDb;
let repo: LoansRepo;

beforeAll(async () => {
  t = await startDb();
  repo = new LoansRepo(t.db);
});
afterAll(async () => {
  await t.stop();
});
beforeEach(async () => {
  await t.reset();
  await addReader(t.db, 1);
});

describe("LoansRepo against Postgres", () => {
  it("get returns a loan or undefined", async () => {
    await addLoan(t.db, { id: 7, readerId: 1, dueAt: new Date("2026-11-10T00:00:00Z") });

    expect(await repo.get(7)).toMatchObject({ id: 7, readerId: 1, renewals: 0, returnedAt: null });
    expect(await repo.get(8)).toBeUndefined();
  });

  it("update writes due_at and renewals", async () => {
    await addLoan(t.db, { id: 7, readerId: 1, dueAt: new Date("2026-11-10T00:00:00Z") });

    await repo.update(7, { dueAt: new Date("2026-11-17T12:00:00Z"), renewals: 1 });

    expect(await repo.get(7)).toMatchObject({ dueAt: new Date("2026-11-17T12:00:00Z"), renewals: 1 });
  });

  it("dueBetween returns unreturned loans in the window with the reader", async () => {
    await addLoan(t.db, { id: 1, readerId: 1, dueAt: new Date("2026-11-04T00:00:00Z") });
    await addLoan(t.db, { id: 2, readerId: 1, dueAt: new Date("2026-11-04T10:00:00Z"), returnedAt: new Date("2026-11-02T00:00:00Z") });
    await addLoan(t.db, { id: 3, readerId: 1, dueAt: new Date("2026-11-05T00:00:00Z") });

    const due = await repo.dueBetween(new Date("2026-11-04T00:00:00Z"), new Date("2026-11-05T00:00:00Z"));

    expect(due).toEqual([
      { loanId: 1, bookId: 101, dueAt: new Date("2026-11-04T00:00:00Z"), readerName: "Reader 1", readerEmail: "r1@example.com" },
    ]);
  });
});
