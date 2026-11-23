import { readFileSync } from "node:fs";
import Handlebars from "handlebars";
import type { DueLoan } from "../store/loans.repo";

const template = Handlebars.compile(
  readFileSync(new URL("./templates/due-reminder.hbs", import.meta.url), "utf8"),
);

export interface ReminderEmail {
  to: string;
  subject: string;
  text: string;
}

// Data w wiadomości według czasu warszawskiego, jak przy ladzie.
const dateFormat = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "long" });

export function dueReminder(loan: DueLoan): ReminderEmail {
  return {
    to: loan.readerEmail,
    subject: `Przypomnienie: zwrot książki #${loan.bookId}`,
    text: template({
      readerName: loan.readerName,
      bookId: loan.bookId,
      dueDate: dateFormat.format(loan.dueAt),
    }),
  };
}
