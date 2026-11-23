import type { FastifyInstance } from "fastify";
import {
  CatalogUnavailableError,
  HoldExistsError,
  LimitReachedError,
  NotFoundError,
  OverdueLoansError,
} from "../loans/errors";
import { renew } from "../loans/renew";
import type { AppDeps } from "./app";
import { requireReader } from "./auth";

export function registerLoanRoutes(app: FastifyInstance, deps: AppDeps): void {
  const auth = requireReader(deps.readers);

  app.get<{ Params: { id: string } }>("/loans/:id", { preHandler: auth }, async (req, reply) => {
    const loan = await deps.loans.get(Number(req.params.id));
    if (!loan || loan.readerId !== req.reader.id) return reply.code(404).send();
    return { id: loan.id, dueAt: loan.dueAt, renewals: loan.renewals };
  });

  app.post<{ Params: { id: string } }>("/loans/:id/renew", { preHandler: auth }, async (req, reply) => {
    try {
      const dueAt = await renew({ ...deps, log: req.log }, req.reader.id, Number(req.params.id));
      return { dueAt };
    } catch (err) {
      const refusal = renewRefusal(err);
      if (!refusal) throw err;
      return reply.code(refusal.status).send(refusal.body);
    }
  });
}

// Błędy renew → odpowiedzi; reszta trafia do ogólnej obsługi Fastify (500).
function renewRefusal(err: unknown): { status: number; body?: { code: string } } | undefined {
  if (err instanceof LimitReachedError || err instanceof OverdueLoansError || err instanceof HoldExistsError) {
    return { status: 409, body: { code: err.code } };
  }
  if (err instanceof CatalogUnavailableError) return { status: 503, body: { code: err.code } };
  if (err instanceof NotFoundError) return { status: 404 };
  return undefined;
}
