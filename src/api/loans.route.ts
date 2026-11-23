import type { FastifyInstance } from "fastify";
import type { AppDeps } from "./app";
import { requireReader } from "./auth";

export function registerLoanRoutes(app: FastifyInstance, deps: AppDeps): void {
  const auth = requireReader(deps.readers);

  app.get<{ Params: { id: string } }>("/loans/:id", { preHandler: auth }, async (req, reply) => {
    const loan = await deps.loans.get(Number(req.params.id));
    if (!loan || loan.readerId !== req.reader.id) return reply.code(404).send();
    return { id: loan.id, dueAt: loan.dueAt, renewals: loan.renewals };
  });
}
