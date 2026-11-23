// Dane testowe lokalnego środowiska testowego. Daty: rok 2026, 00:00 UTC. W środowisku clock.now() = 03.11.2026.
export const readers = [
  { id: 1, name: "Anna Kowalska", email: "reader1@example.com", apiToken: "reader1-local-token" },
  { id: 2, name: "Marek Nowak", email: "reader2@example.com", apiToken: "reader2-local-token" },
  { id: 3, name: "Irena Wiśniewska", email: "reader3@example.com", apiToken: "reader3-local-token" },
  { id: 4, name: "Tomasz Zieliński", email: "reader4@example.com", apiToken: "reader4-local-token" },
];

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const loans = [
  { id: 1, readerId: 1, bookId: 101, issuedAt: d("2026-10-20"), dueAt: d("2026-11-10"), renewals: 0 },
  { id: 2, readerId: 2, bookId: 102, issuedAt: d("2026-10-01"), dueAt: d("2026-10-22"), renewals: 0, returnedAt: d("2026-10-21") },
  { id: 3, readerId: 2, bookId: 103, issuedAt: d("2026-10-25"), dueAt: d("2026-11-15"), renewals: 0 },
  { id: 4, readerId: 3, bookId: 104, issuedAt: d("2026-10-28"), dueAt: d("2026-11-18"), renewals: 0 },
  { id: 5, readerId: 4, bookId: 105, issuedAt: d("2026-10-14"), dueAt: d("2026-11-04"), renewals: 0 },
  { id: 6, readerId: 1, bookId: 106, issuedAt: d("2026-09-20"), dueAt: d("2026-10-11"), renewals: 1, returnedAt: d("2026-10-15") },
  // LIB-218: osobne wypożyczenie na każdy scenariusz http/renew.http, bo żądanie zmienia stan
  { id: 7, readerId: 1, bookId: 107, issuedAt: d("2026-10-20"), dueAt: d("2026-11-10"), renewals: 0 },
  { id: 8, readerId: 1, bookId: 108, issuedAt: d("2026-10-13"), dueAt: d("2026-11-17"), renewals: 1 },
  { id: 9, readerId: 1, bookId: 109, issuedAt: d("2026-10-06"), dueAt: d("2026-11-24"), renewals: 2 },
  { id: 10, readerId: 1, bookId: 110, issuedAt: d("2026-10-24"), dueAt: d("2026-11-14"), renewals: 0 },
  { id: 11, readerId: 1, bookId: 111, issuedAt: d("2026-10-24"), dueAt: d("2026-11-14"), renewals: 0 },
  { id: 12, readerId: 3, bookId: 112, issuedAt: d("2026-10-25"), dueAt: d("2026-11-15"), renewals: 0 },
  { id: 13, readerId: 3, bookId: 113, issuedAt: d("2026-10-09"), dueAt: d("2026-10-30"), renewals: 0 },
  { id: 14, readerId: 4, bookId: 114, issuedAt: d("2026-10-11"), dueAt: d("2026-11-01"), renewals: 0 },
  { id: 15, readerId: 4, bookId: 115, issuedAt: d("2026-10-02"), dueAt: d("2026-11-20"), renewals: 2 },
  { id: 16, readerId: 1, bookId: 116, issuedAt: d("2026-10-22"), dueAt: d("2026-11-12"), renewals: 0 },
];
