import type { FastifyInstance } from "fastify";
import { adminRenew } from "../loans/adminRenew";
import { NotFoundError } from "../loans/errors";
import type { AppDeps } from "./app";
import { requireLibrarian } from "./auth";

export function registerAdminRoutes(app: FastifyInstance, deps: AppDeps): void {
  const auth = requireLibrarian(deps.librarianToken);

  app.post<{ Params: { id: string } }>(
    "/admin/loans/:id/renew",
    { preHandler: auth },
    async (req, reply) => {
      try {
        const dueAt = await adminRenew({ ...deps, log: req.log }, Number(req.params.id));
        return { dueAt };
      } catch (err) {
        if (err instanceof NotFoundError) return reply.code(404).send();
        throw err;
      }
    },
  );
}
