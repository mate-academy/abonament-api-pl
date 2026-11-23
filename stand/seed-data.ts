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
];
