import type { FastifyBaseLogger as Logger } from "fastify";
import type { Clock } from "../clock";
import type { HoldsClient } from "../holds/client";
import type { LoansRepo } from "../store/loans.repo";

export interface LoanDeps {
  loans: LoansRepo;    // src/store/loans.repo.ts
  holds: HoldsClient;  // src/holds/client.ts
  clock: Clock;        // src/clock
  log: Logger;
}
