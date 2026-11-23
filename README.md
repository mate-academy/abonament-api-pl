# abonament-api: repozytorium szkoleniowe do studium przypadku C13

„Abonament” to fikcyjna sieć miejskich bibliotek. Czytelnik wypożycza książkę na 21 dni i obecnie może przedłużyć wypożyczenie tylko przy ladzie. Repozytorium odtwarza treść studium przypadku (case) C13 (M2T2, teorie 1 i 2): kod, sprawdzenia i konfigurację, z którymi zespół bierze się za ticket LIB-218.

## Gałęzie

| Gałąź | Co zawiera |
| --- | --- |
| `main` | Stan przed LIB-218: przedłużenie tylko przy ladzie (`adminRenew`), pętla weryfikacji „jak jest”, lokalne środowisko testowe z danymi bazowymi |
| `final` | LIB-218 według theory-1: sekcja `## TDD` w `CLAUDE.md`, specyfikacja i zatwierdzona lista przypadków w `docs/LIB-218/`, cykl TDD po jednym commicie na przypadek |
| `theory-2` | `final` + testowanie mutacyjne, guardy i scenariusze środowiska testowego jako dowód (M2T5) |

`main` to także gałąź bazowa dla M2T4 (C18): w niej LIB-218 i LIB-240 przechodzą przez trzy procesy.

## Ticket

```
LIB-218. Przedłużanie wypożyczenia online

1. czytelnik może przedłużyć wypożyczenie przez API: POST /loans/:id/renew
2. każde przedłużenie to +14 dni do bieżącej daty zwrotu (due_at);
   nie więcej niż 2 przedłużenia na wypożyczenie
3. przedłużenie jest zabronione, jeśli na książkę jest aktywna rezerwacja innego czytelnika
4. przedłużenie jest zabronione, jeśli czytelnik ma choć jedno przeterminowane wypożyczenie
5. odpowiedź: 200 z nową due_at; odmowa: 409 z kodem przyczyny
   LIMIT_REACHED | HOLD_EXISTS | OVERDUE_LOANS
```

## LIB-218 w gałęzi `final`

Zadanie przeprowadzono według theory-1:

- `docs/LIB-218/spec.md`: kryteria akceptacji, pięć decyzji po badaniu w plan mode, non-goals;
- `docs/LIB-218/cases.md`: 11 zatwierdzonych przypadków ze statusami i nazwami testów;
- historia commitów: po jednym commicie na przypadek, test i kod razem, wynik czerwonego przebiegu w treści commita (`git log final`). Jeśli test od razu był zielony, commit wyjaśnia dlaczego.

Nowy kod: `src/loans/renew.ts`, `src/loans/errors.ts`, metody `countOverdue` i `extend` w `src/store/loans.repo.ts`, trasa `POST /loans/:id/renew` w `src/api/loans.route.ts`.

| Żądanie | Odpowiedź |
| --- | --- |
| `POST /loans/:id/renew` | `200 { dueAt }`; `409 { code }` z `LIMIT_REACHED`, `OVERDUE_LOANS` lub `HOLD_EXISTS`; `503 { code: "CATALOG_UNAVAILABLE" }`; `404` dla cudzego lub nieistniejącego wypożyczenia; `401` bez tokena |

## Struktura

```
src/
  api/       trasy HTTP: GET /loans/:id, POST /admin/loans/:id/renew
  clock/     clock.now(); CLOCK_FIXED_NOW ustala czas w środowisku testowym
  dates/     addDays, businessDaysBetween (date-fns)
  loans/     wypożyczenia, kary, przedłużenie przez bibliotekarza (adminRenew.ts, rok 2021)
  holds/     klient catalog-api: rezerwacje przez HTTP, timeout 2 s, bez ponownych prób
  notify/    przypomnienia e-mail (Handlebars)
  store/     schemat i repozytoria na Drizzle ORM
drizzle/     migracje drizzle-kit
test/unit/         Vitest, repozytoria i klient catalog-api zamockowane (vi.fn)
test/integration/  Vitest, Testcontainers (Postgres 16, wymaga Dockera); tylko src/store
http/        scenariusze .http dla środowiska testowego, tokeny czytelników
stand/       dane testowe środowiska testowego i zaślepka catalog-api
docker-compose.yml, Dockerfile, eslint.config.js, vitest.config.ts, sonar-project.properties,
CLAUDE.md, .claude/settings.json (hooki), .github/workflows/ci.yml, .github/CODEOWNERS
```

`src/loans/adminRenew.ts` to logika najbliższa LIB-218, ale z inną zasadą: przy ladzie nowa data liczy się od dziś przez `new Date()`, bo czytelnik przynosi książkę fizycznie. Plik jest starszy niż `src/clock` i `src/dates`, dlatego ma własne `addDays`.

## Uruchomienie

Hooki Claude Code potrzebują `jq`: bez niego hook PostToolUse po cichu pomija sprawdzenie.

```bash
npm install
npx tsc --noEmit
npx eslint .
npx vitest run --project unit
npx vitest run --project integration   # Testcontainers sam uruchamia postgres:16
```

### Lokalne środowisko testowe

```bash
docker compose up --build -d            # abonament-api :3000, Postgres, catalog-api
source http/curl.env                    # $READER1–$READER4, $LIBRARIAN
curl -i http://localhost:3000/loans/1 -H "Authorization: Bearer $READER1"
docker compose down -v                  # zresetuj dane środowiska testowego
```

Czas w środowisku testowym jest ustalony: `CLOCK_FIXED_NOW=2026-11-03T09:00:00Z`, więc `clock.now()` zwraca 03.11.2026 niezależnie od dnia uruchomienia. Tokeny czytelników są w `http/http-client.env.json` (dla plików `.http`) i `http/curl.env` (dla curl). Jeśli port 5432 jest zajęty: `POSTGRES_PORT=5433 docker compose up --build -d`.

| Żądanie | Odpowiedź |
| --- | --- |
| `GET /loans/:id` | `200 { id, dueAt, renewals }` dla własnego wypożyczenia; `404` bez treści dla cudzego lub nieistniejącego; `401` bez tokena |
| `POST /admin/loans/:id/renew` | token bibliotekarza (`LIBRARIAN_TOKEN`); `200 { dueAt }`, nowa data to dziś + 14 dni; `404` |

`GET /loans/:id` nie sprawdza formatu id: `/loans/abc` odpowiada `500` z tekstem SQL w treści, a `/loans/+1` zwraca wypożyczenie 1. To stan przed ticketem LIB-240 z M2T4.

Dane środowiska testowego (`stand/seed-data.ts`, wszystkie daty z roku 2026, 00:00 UTC):

| Wypożyczenie | Czytelnik | Książka | due_at | renewals | Zwrócone |
| --- | --- | --- | --- | --- | --- |
| 1 | reader1 | 101 | 10.11 | 0 | — |
| 2 | reader2 | 102 | 22.10 | 0 | 21.10 |
| 3 | reader2 | 103 | 15.11 | 0 | — |
| 4 | reader3 | 104 | 18.11 | 0 | — |
| 5 | reader4 | 105 | 04.11 | 0 | — |
| 6 | reader1 | 106 | 11.10 | 1 | 15.10 |

catalog-api (`stand/catalog-api/holds.json`): rezerwacja reader2 na książkę 104.

## Pętla weryfikacji „jak jest”

Liczby ze studium przypadku dotyczą projektu zespołu. To repozytorium jest małe, dlatego w kolumnie „tutaj” są pomiary na MacBooku: pokazują tylko proporcje.

| Warstwa | Komenda | Gdzie i kiedy | W studium przypadku | Tutaj |
| --- | --- | --- | --- | --- |
| Typy | `npx tsc --noEmit` | PostToolUse na Edit\|Write; CI | ~15 s | zimny 2,4 s; ciepły 1,2 s |
| Linter | `npx eslint .` (typescript-eslint recommended; `@vitest/eslint-plugin` i eslint-comments nie są podłączone) | PostToolUse na zmieniony plik; CI | ~15 s | plik 0,7 s; repozytorium 1,0 s |
| Jednostkowe | `npx vitest run --project unit` | Stop; CI | ~30 s | 17 testów, 1,7 s |
| Integracyjne | `npx vitest run --project integration` | CI; lokalnie w sesji agenta | ~4 min | 4 testy, 5,9 s razem z kontenerem |
| Analiza statyczna | SonarQube, quality gate Sonar way na serwerze; pokrycie z unit i integration | CI po testach | ~2 min | brak serwera, job nie był uruchamiany |
| e2e | kolekcja Postman na stagingu, 6 scenariuszy, QA przed wydaniem | ręcznie | ~15 min | brak stagingu, kolekcji nie ma w repozytorium |

Hooki Claude Code są w `.claude/settings.json` i `.claude/hooks/`: po Edit lub Write na pliku `.ts` uruchamiają `tsc --noEmit` i `eslint` tego pliku, a na Stop testy jednostkowe. Oba hooki zwracają exit 2 z wynikiem, jeśli sprawdzenie jest czerwone. Stop pomija drugie zatrzymanie z rzędu (`stop_hook_active`).

Docker jest dostępny zarówno w CI, jak i w sesji agenta.

## Bramka CI (CI gate) i branch protection

Workflow `.github/workflows/ci.yml`: joby `lint`, `typecheck`, `unit`, `integration`, `sonar` na każdy PR do `main`. Pokrycie z unit i integration trafia do Sonara jako lcov. Sekrety `SONAR_TOKEN` i `SONAR_HOST_URL` są w ustawieniach repozytorium.

Repozytorium szkoleniowe nie ma serwera Sonar, więc bez tych sekretów job `sonar` jest czerwony. Zespół `@abonament/backend-leads` w CODEOWNERS jest umowny: na GitHubie takiego nie ma.

Branch protection ustawia się w ustawieniach GitHuba i nie wchodzi do repozytorium, dlatego jest opisana tutaj:

```
Branch protection (main)
  Require status checks to pass: lint, unit, integration, SonarQube quality gate
  Require approvals: 1
  Require review from Code Owners: włączone
  .github/CODEOWNERS: /drizzle/
```

## Monitoring produkcji

Jest opisany tekstem, w repozytorium go nie ma: Grafana, alert na udział 5xx > 2 % w ciągu 5 min dla każdej trasy; logi w Loki, alertów na podstawie logów nie ma.
