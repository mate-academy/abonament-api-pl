import Fastify from "fastify";
import type { Clock } from "../clock";
import type { HoldsClient } from "../holds/client";
import type { LoansRepo } from "../store/loans.repo";
import { registerAdminRoutes } from "./admin.route";
import type { ReaderLookup } from "./auth";
import { registerLoanRoutes } from "./loans.route";

export interface AppDeps {
  loans: LoansRepo;
  holds: HoldsClient;
  clock: Clock;
  readers: ReaderLookup;
  librarianToken: string;
}

export function buildApp(deps: AppDeps, opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false });
  app.decorateRequest("reader");
  app.get("/health", async () => ({ status: "ok" }));
  registerLoanRoutes(app, deps);
  registerAdminRoutes(app, deps);
  return app;
}
