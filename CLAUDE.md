# abonament-api

Backend „Abonamentu”, sieci miejskich bibliotek. TypeScript (strict), Node 22, Fastify 5, Drizzle ORM, Postgres 16, Vitest.

- src/api — trasy HTTP (GET /loans/:id, POST /admin/loans/:id/renew)
- src/clock — clock.now(), czas na potrzeby testowalności
- src/dates — addDays, businessDaysBetween (date-fns)
- src/loans — wypożyczenia, kary, przedłużenie przez bibliotekarza (adminRenew)
- src/holds — klient catalog-api: rezerwacje, HTTP, timeout 2 s bez ponownych prób
- src/notify — przypomnienia e-mail (Handlebars)
- src/store — repozytoria na Drizzle; migracje w drizzle/

## Komendy

```bash
npx tsc --noEmit
npx eslint .
npx vitest run --project unit
npx vitest run --project integration   # Testcontainers, wymaga Dockera
docker compose up --build               # lokalne środowisko testowe, API na localhost:3000
```

## Zasady

- Czas bierz z clock.now() (LoanDeps), nie z new Date() ani Date.now().
- Narzędzia do dat są w src/dates, nie duplikuj ich.
- Nowe zapytania do bazy danych umieszczaj w src/store, z testem integracyjnym.
- Nie aktualizuj plików golden wiadomości e-mail (test/unit/notify/__snapshots__): zatwierdza je zespół treści.
- Zmieniaj tylko to, czego wymaga ticket.

## TDD

Najpierw test, potem kod. Pokazuj wynik czerwonego przebiegu.
Nie zmieniaj oczekiwań w testach z zatwierdzonej listy przypadków.
Jeśli test wydaje się błędny, zatrzymaj się i wyjaśnij, z którym warunkiem
ticketu twoim zdaniem jest niezgodny.
