import { eq } from "drizzle-orm";
import type { Db } from "./db";
import { readers, type Reader } from "./schema";

export class ReadersRepo {
  constructor(private readonly db: Db) {}

  async byToken(token: string): Promise<Reader | undefined> {
    const [row] = await this.db.select().from(readers).where(eq(readers.apiToken, token)).limit(1);
    return row;
  }
}
