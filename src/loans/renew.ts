// src/loans/renew.ts
import { addDays } from "../dates";
import type { LoanDeps } from "./deps";
import { LimitReachedError, NotFoundError } from "./errors";

export const RENEWAL_DAYS = 14;
export const MAX_RENEWALS = 2;

export async function renew(
  { loans }: LoanDeps, readerId: number, loanId: number,
): Promise<Date> {
  const loan = await loans.get(loanId);
  if (!loan || loan.readerId !== readerId) throw new NotFoundError();
  if (loan.renewals >= MAX_RENEWALS) throw new LimitReachedError();
  const newDue = addDays(loan.dueAt, RENEWAL_DAYS);
  await loans.extend(loanId, newDue);
  return newDue;
}
