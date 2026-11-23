import { describe, expect, it, vi } from "vitest";
import { createHoldsClient } from "../../../src/holds/client";

describe("holds client", () => {
  it("returns active holds of a book", async () => {
    const fetchImpl = vi.fn(async () => Response.json([{ id: 1, bookId: 3, readerId: 2 }]));
    const client = createHoldsClient("http://catalog", fetchImpl as unknown as typeof fetch);

    await expect(client.activeForBook(3)).resolves.toEqual([{ id: 1, bookId: 3, readerId: 2 }]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://catalog/books/3/holds?status=active",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws when catalog-api answers with an error", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 502 }));
    const client = createHoldsClient("http://catalog", fetchImpl as unknown as typeof fetch);

    await expect(client.activeForBook(3)).rejects.toThrow("catalog-api responded 502");
  });
});
