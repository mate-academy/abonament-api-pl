import { describe, expect, it } from "vitest";
import { loan } from "../loans/helpers";
import { makeApp } from "./helpers";

describe("GET /loans/:id", () => {
  it("returns the reader's own loan", async () => {
    const { app, loans } = makeApp();
    loans.get.mockResolvedValue(loan({ id: 7, renewals: 1, dueAt: new Date("2026-11-24T00:00:00Z") }));

    const res = await app.inject({ method: "GET", url: "/loans/7", headers: { authorization: "Bearer t1" } });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: 7, dueAt: "2026-11-24T00:00:00.000Z", renewals: 1 });
  });

  it("answers 404 for another reader's loan", async () => {
    const { app, loans } = makeApp();
    loans.get.mockResolvedValue(loan({ readerId: 2 }));

    const res = await app.inject({ method: "GET", url: "/loans/7", headers: { authorization: "Bearer t1" } });

    expect(res.statusCode).toBe(404);
    expect(res.body).toBe("");
  });

  it("answers 401 without a token", async () => {
    const { app, loans } = makeApp();

    const res = await app.inject({ method: "GET", url: "/loans/7" });

    expect(res.statusCode).toBe(401);
    expect(loans.get).not.toHaveBeenCalled();
  });
});
