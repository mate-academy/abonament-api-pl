import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const readers = pgTable("readers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  apiToken: text("api_token").notNull().unique(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  readerId: integer("reader_id")
    .notNull()
    .references(() => readers.id),
  bookId: integer("book_id").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  renewals: integer("renewals").notNull().default(0),
});

export type Reader = typeof readers.$inferSelect;
export type Loan = typeof loans.$inferSelect;
