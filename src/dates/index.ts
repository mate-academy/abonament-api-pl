import { addDays as addCalendarDays, differenceInBusinessDays } from "date-fns";

export function addDays(t: Date, days: number): Date {
  return addCalendarDays(t, days);
}

// Dni robocze między dwoma momentami (bez sobót i niedziel), wartość ujemna daje zero.
export function businessDaysBetween(from: Date, to: Date): number {
  return Math.max(0, differenceInBusinessDays(to, from));
}
