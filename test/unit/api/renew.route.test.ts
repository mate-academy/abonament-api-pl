import { describe, expect, it, vi } from "vitest";
import {
  CatalogUnavailableError,
  HoldExistsError,
  LimitReachedError,
  OverdueLoansError,
} from "../../../src/loans/errors";
import { renew } from "../../../src/loans/renew";
import { makeApp } from "./helpers";

// LIB-218, przypadek 11: format odpowiedzi. renew zastąpiono mockiem: tutaj sprawdzamy tylko trasę.
vi.mock("../../../src/loans/renew", () => ({ renew: vi.fn() }));
const renewMock = vi.mocked(renew);

function post(app: ReturnType<typeof makeApp>["app"]) {
  return app.inject({ method: "POST", url: "/loans/7/renew", headers: { authorization: "Bearer t1" } });
}

describe("POST /loans/:id/renew", () => {
  it("answers 200 with the new dueAt", async () => {
    const { app } = makeApp();
    renewMock.mockResolvedValue(new Date("2026-11-24T00:00:00Z"));

    const res = await post(app);

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ dueAt: "2026-11-24T00:00:00.000Z" });
    expect(renewMock).toHaveBeenCalledWith(expect.anything(), 1, 7);
  });

  it.each([
    ["LIMIT_REACHED", new LimitReachedError()],
    ["OVERDUE_LOANS", new OverdueLoansError()],
    ["HOLD_EXISTS", new HoldExistsError()],
  ])("answers 409 { code: %s }", async (code, error) => {
    const { app } = makeApp();
    renewMock.mockRejectedValue(error);

    const res = await post(app);

    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ code });
  });

  it("answers 503 { code: CATALOG_UNAVAILABLE }", async () => {
    const { app } = makeApp();
    renewMock.mockRejectedValue(new CatalogUnavailableError(new Error("timeout")));

    const res = await post(app);

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ code: "CATALOG_UNAVAILABLE" });
  });
});
