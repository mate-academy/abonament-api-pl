import { businessDaysBetween } from "../dates";
import type { Loan } from "../store/schema";

// Kara za opóźnienie: 5 zł za każdy dzień roboczy po due_at.
export const FINE_PER_BUSINESS_DAY_MINOR = 500;

export function fineMinor(loan: Pick<Loan, "dueAt" | "returnedAt">, now: Date): number {
  const end = loan.returnedAt ?? now;
  return businessDaysBetween(loan.dueAt, end) * FINE_PER_BUSINESS_DAY_MINOR;
}
