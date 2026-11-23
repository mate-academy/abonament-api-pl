import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { createDb, type Db } from "../../src/store/db";
import { runMigrations } from "../../src/store/migrate";
import { loans, readers, type Loan } from "../../src/store/schema";

export interface TestDb {
  db: Db;
  reset(): Promise<void>;
  stop(): Promise<void>;
}

// Postgres 16 w Testcontainers (wymaga Dockera), migracje drizzle/.
export async function startDb(): Promise<TestDb> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:16").start();
  const { db, pool } = createDb(container.getConnectionUri());
  await runMigrations(db);
  return {
    db,
    reset: async () => {
      await db.execute(sql`truncate table loans, readers restart identity cascade`);
    },
    stop: async () => {
      await pool.end();
      await container.stop();
    },
  };
}

export async function addReader(db: Db, id: number): Promise<void> {
  await db.insert(readers).values({ id, name: `Reader ${id}`, email: `r${id}@example.com`, apiToken: `token-${id}` });
}

export async function addLoan(db: Db, values: Partial<Loan> & Pick<Loan, "id" | "readerId" | "dueAt">): Promise<void> {
  await db.insert(loans).values({ bookId: 100 + values.id, issuedAt: new Date("2026-10-01T00:00:00Z"), ...values });
}
