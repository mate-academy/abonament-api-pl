// src/loans/renew.ts
import { addDays } from "../dates";
import type { LoanDeps } from "./deps";
import { NotFoundError } from "./errors";

export const RENEWAL_DAYS = 14;

export async function renew(
  { loans }: LoanDeps, readerId: number, loanId: number,
): Promise<Date> {
  const loan = await loans.get(loanId);
  if (!loan || loan.readerId !== readerId) throw new NotFoundError();
  const newDue = addDays(loan.dueAt, RENEWAL_DAYS);
  await loans.extend(loanId, newDue);
  return newDue;
}
