import { clockFromEnv } from "../clock";
import { createHoldsClient } from "../holds/client";
import { createDb } from "../store/db";
import { LoansRepo } from "../store/loans.repo";
import { ReadersRepo } from "../store/readers.repo";
import { buildApp } from "./app";

const env = process.env;
const { db } = createDb(env.DATABASE_URL ?? "postgres://postgres:test@localhost:5432/postgres");

const app = buildApp(
  {
    loans: new LoansRepo(db),
    readers: new ReadersRepo(db),
    holds: createHoldsClient(env.CATALOG_API_URL ?? "http://localhost:4000"),
    clock: clockFromEnv(),
    librarianToken: env.LIBRARIAN_TOKEN ?? "",
  },
  { logger: true },
);

await app.listen({ port: Number(env.PORT ?? 3000), host: "0.0.0.0" });
