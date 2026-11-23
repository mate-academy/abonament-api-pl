import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ReadersRepo } from "../../../src/store/readers.repo";
import { addReader, startDb, type TestDb } from "../setup";

let t: TestDb;

beforeAll(async () => {
  t = await startDb();
  await addReader(t.db, 1);
});
afterAll(async () => {
  await t.stop();
});

describe("ReadersRepo against Postgres", () => {
  it("byToken finds a reader by API token", async () => {
    const repo = new ReadersRepo(t.db);

    expect(await repo.byToken("token-1")).toMatchObject({ id: 1, name: "Reader 1" });
    expect(await repo.byToken("nope")).toBeUndefined();
  });
});
