// src/loans/renew.ts
import { addDays } from "../dates";
import type { LoanDeps } from "./deps";
import { HoldExistsError, LimitReachedError, NotFoundError, OverdueLoansError } from "./errors";

export const RENEWAL_DAYS = 14;
export const MAX_RENEWALS = 2;

// Kolejność sprawdzeń odpowiada kolejności przyczyn odmowy ze specyfikacji.
export async function renew(
  { loans, holds, clock }: LoanDeps, readerId: number, loanId: number,
): Promise<Date> {
  const loan = await loans.get(loanId);
  if (!loan || loan.readerId !== readerId) throw new NotFoundError();
  if (loan.renewals >= MAX_RENEWALS) throw new LimitReachedError();
  if ((await loans.countOverdue(readerId, clock.now())) > 0) throw new OverdueLoansError();
  const active = await holds.activeForBook(loan.bookId);
  if (active.some((h) => h.readerId !== readerId)) throw new HoldExistsError();
  const newDue = addDays(loan.dueAt, RENEWAL_DAYS);
  await loans.extend(loanId, newDue);
  return newDue;
}
