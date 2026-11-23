// Wypełnia bazę środowiska testowego, jeśli jest pusta. Reset stanu: docker compose down -v.
import { count, sql } from "drizzle-orm";
import { createDb } from "../src/store/db";
import { loans, readers } from "../src/store/schema";
import * as data from "./seed-data";

const { db, pool } = createDb(process.env.DATABASE_URL ?? "postgres://postgres:test@localhost:5432/postgres");

const [{ n }] = await db.select({ n: count() }).from(readers);
if (n === 0) {
  await db.insert(readers).values(data.readers);
  await db.insert(loans).values(data.loans);
  await db.execute(sql`select setval(pg_get_serial_sequence('readers', 'id'), (select max(id) from readers))`);
  await db.execute(sql`select setval(pg_get_serial_sequence('loans', 'id'), (select max(id) from loans))`);
  console.log(`seeded ${data.readers.length} readers, ${data.loans.length} loans`);
} else {
  console.log("seed skipped: data already present");
}
await pool.end();
