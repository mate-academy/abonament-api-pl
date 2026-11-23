import { createDb } from "./db";
import { runMigrations } from "./migrate";

const { db, pool } = createDb(process.env.DATABASE_URL ?? "postgres://postgres:test@localhost:5432/postgres");
await runMigrations(db);
await pool.end();
console.log("migrations applied");
