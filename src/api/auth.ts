import type { FastifyReply, FastifyRequest } from "fastify";
import type { Reader } from "../store/schema";

declare module "fastify" {
  interface FastifyRequest {
    reader: Reader;
  }
}

export interface ReaderLookup {
  byToken(token: string): Promise<Reader | undefined>;
}

function bearer(req: FastifyRequest): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
}

// Czytelnik: token z tabeli readers.
export function requireReader(readers: ReaderLookup) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = bearer(req);
    const reader = token ? await readers.byToken(token) : undefined;
    if (!reader) return reply.code(401).send();
    req.reader = reader;
  };
}

// Bibliotekarz przy ladzie: jeden token służbowy ze zmiennej LIBRARIAN_TOKEN.
export function requireLibrarian(librarianToken: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!librarianToken || bearer(req) !== librarianToken) return reply.code(401).send();
  };
}
