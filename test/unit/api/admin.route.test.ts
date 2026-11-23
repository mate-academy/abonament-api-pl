import { afterEach, describe, expect, it, vi } from "vitest";
import { loan } from "../loans/helpers";
import { makeApp } from "./helpers";

describe("POST /admin/loans/:id/renew", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renews with the librarian token", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-03T12:00:00Z"), toFake: ["Date"] });
    const { app, loans } = makeApp();
    loans.get.mockResolvedValue(loan());

    const res = await app.inject({
      method: "POST",
      url: "/admin/loans/7/renew",
      headers: { authorization: "Bearer lib" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ dueAt: "2026-11-17T12:00:00.000Z" });
  });

  it("answers 404 for an unknown loan", async () => {
    const { app, loans } = makeApp();
    loans.get.mockResolvedValue(undefined);

    const res = await app.inject({
      method: "POST",
      url: "/admin/loans/99/renew",
      headers: { authorization: "Bearer lib" },
    });

    expect(res.statusCode).toBe(404);
  });

  it("answers 401 for a reader token", async () => {
    const { app } = makeApp();

    const res = await app.inject({
      method: "POST",
      url: "/admin/loans/7/renew",
      headers: { authorization: "Bearer t1" },
    });

    expect(res.statusCode).toBe(401);
  });
});
