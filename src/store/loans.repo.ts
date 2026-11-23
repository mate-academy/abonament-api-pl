import { and, asc, count, eq, gte, isNull, lt } from "drizzle-orm";
import type { Db } from "./db";
import { loans, readers, type Loan } from "./schema";

export interface DueLoan {
  loanId: number;
  bookId: number;
  dueAt: Date;
  readerName: string;
  readerEmail: string;
}

export class LoansRepo {
  constructor(private readonly db: Db) {}

  async get(loanId: number): Promise<Loan | undefined> {
    const [row] = await this.db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    return row;
  }

  async update(loanId: number, patch: Partial<Pick<Loan, "dueAt" | "renewals">>): Promise<void> {
    await this.db.update(loans).set(patch).where(eq(loans.id, loanId));
  }

  async countOverdue(readerId: number, now: Date): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(loans)
      .where(and(
        eq(loans.readerId, readerId),
        isNull(loans.returnedAt),
        lt(loans.dueAt, now),
      ));
    return row.n;
  }

  // Niezwrócone wypożyczenia z due_at w [from, to) dla wiadomości z przypomnieniem.
  async dueBetween(from: Date, to: Date): Promise<DueLoan[]> {
    return this.db
      .select({
        loanId: loans.id,
        bookId: loans.bookId,
        dueAt: loans.dueAt,
        readerName: readers.name,
        readerEmail: readers.email,
      })
      .from(loans)
      .innerJoin(readers, eq(readers.id, loans.readerId))
      .where(and(isNull(loans.returnedAt), gte(loans.dueAt, from), lt(loans.dueAt, to)))
      .orderBy(asc(loans.dueAt));
  }
}
