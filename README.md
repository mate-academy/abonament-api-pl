# abonament-api: repozytorium szkoleniowe do studium przypadku C13

„Abonament” to fikcyjna sieć miejskich bibliotek. Czytelnik wypożycza książkę na 21 dni i obecnie może przedłużyć wypożyczenie tylko przy ladzie. Repozytorium odtwarza treść studium przypadku (case) C13 (M2T2, teorie 1 i 2): kod, sprawdzenia i konfigurację, z którymi zespół bierze się za ticket LIB-218.

## Gałąź `telemetry`: koszt ticketu (M2T4)

Materiały do teorii M2T4 „Ile kosztuje ticket: logi i telemetria” i filmu „Własne liczby”: jak zmierzyć koszt i czas agenta według ticketu i fazy procesu. Gałąź odchodzi od `own-process`, więc proces jest ten sam: skille `/research`, `/tdd`, `/implement`, a faza to aktywny skill.

Co dodano (jeden commit od `own-process`):

- skill `/ticket-metrics` w `.claude/skills/ticket-metrics/`: raport o tickecie z lokalnych logów Claude Code — fazy, model, effort, tokeny, szacunkowy koszt według cen API z `prices.json` i czas agenta; ticket wyszukuje po nazwie gałęzi, uruchamia go tylko programista;
- `telemetry/`: lokalny stos w Dockerze — kolektor OpenTelemetry, Prometheus i Grafana z dashboardem „Claude Code: tickety”;
- `telemetry/claude-env.json`: blok `env`, który włącza telemetrię;
- `tickets/`: tickety LIB-311…LIB-314 z filmu;
- `telemetry/data/` w `.gitignore`: tam kolektor zapisuje surowe metryki i zdarzenia.

### Poziom 1: raport z logów

Nie trzeba niczego włączać: Claude Code już zapisuje logi sesji w `~/.claude/projects/` (lub w `$CLAUDE_CONFIG_DIR/projects/`) i domyślnie przechowuje je 30 dni (`cleanupPeriodDays`).

1. Utwórz gałąź z numerem ticketu w nazwie: `git switch -c lib-311-fine-in-loan`.
2. Przeprowadź ticket przez skille `/research`, `/tdd`, `/implement`.
3. W nowej sesji na tej gałęzi wpisz `/ticket-metrics LIB-311`.

Ceny w `prices.json` sprawdzono 05.11.2026. Jeśli modelu tam nie ma, raport napisze „Brak ceny dla: …”: dodaj jego cenę z platform.claude.com/docs/en/about-claude/pricing.

### Poziom 2: telemetria

1. Uruchom stos: `cd telemetry && docker compose up -d`. Porty: OTLP 4317 i 4318, Prometheus http://localhost:9390, Grafana http://localhost:3300 (bez logowania).
2. Dodaj zmienne z `telemetry/claude-env.json` do bloku `env` swojego `~/.claude/settings.json`. W `.claude/settings.json` repozytorium te zmienne nie działają. Interwał 10 s jest do demo; domyślnie metryki są wysyłane raz na minutę.
3. Przed startem sesji zapisz numer ticketu w zmiennej, bez spacji w wartości: `export OTEL_RESOURCE_ATTRIBUTES="ticket=LIB-311"`. Zmienna jest odczytywana przy starcie sesji: najpierw gałąź, potem sesja.
4. Sprawdź, czy dane docierają: w Prometheusie zapytanie `sum(claude_code_session_count_total)` daje liczbę większą od zera. Jeśli jest pusto, uruchom `claude --debug-file <plik>` i szukaj w logu „3P telemetry”.
5. Otwórz w Grafanie dashboard „Claude Code: tickety”: koszt według faz, czas agenta i człowieka według ticketów, podział według modelu, effort i źródła żądania. Przy pierwszym starcie Grafana przez około minutę aktualizuje wbudowane pluginy; jeśli dashboard pisze „Prometheus plugin failed”, odśwież stronę.

Claude Code wysyła liczniki jako delty, a Prometheus oczekuje skumulowanych sum, dlatego w `otelcol.yaml` jest procesor `delta_to_cumulative`. Zdarzenia kolektor zapisuje w `telemetry/data/events.jsonl`; zawierają one `user.email` i identyfikatory konta, więc usuń je, zanim udostępnisz wynik.

Wyłączenie: usuń zmienne z `~/.claude/settings.json` i zatrzymaj stos — `docker compose stop` (dane zostają) albo `docker compose down -v` (dane Prometheusa zostają usunięte).

Sprawdzono 15.11.2026 na czystym klonie gałęzi: Claude Code 2.1.325, Sonnet 5.5; stos uruchomiony od zera (OpenTelemetry Collector Contrib 0.162.0, Prometheus 3.15.1, Grafana 13.2.4). Sesja z `ticket=LIB-999` dotarła do Prometheusa i dashboardu, a skrypt `/ticket-metrics` pokazał ten sam koszt i tokeny.

## Gałąź `own-process`: praktyka M2T4

Praktyka M2T4-task-1, ticket LIB-233 (studium przypadku C31): sposób „własny proces”. Tekst ticketu i decyzje Product Ownera są w zadaniu.

Co skonfigurowano (jeden commit od `main`):

- skille `/research`, `/tdd`, `/implement` w `.claude/skills/` z `disable-model-invocation: true`: uruchamia je tylko programista;
- hook `PostToolUse` na `ExitPlanMode` (`.claude/hooks/save-plan.mjs`): kopiuje zatwierdzony plan do `docs/<ticket>/plan.md`; numer ticketu pochodzi z pierwszej linii planu `# LIB-…`;
- `"plansDirectory": "docs/plans"` w `.claude/settings.json`: szkice planu Claude Code zapisuje w `docs/plans/`;
- `docs/` w `.gitignore`: plan i lista przypadków (list of cases) zostają poza Git;
- dane środowiska testowego (stand) dla LIB-233 (zobacz „Lokalne środowisko testowe”).

Nie trzeba niczego instalować. Sesja startuje w auto mode. Aby przejść do plan mode, naciskaj `Shift+Tab`, aż pod polem wprowadzania pojawi się „⏸ plan mode on”, albo uruchom `claude --permission-mode plan`.

Sprawdzono 15.11.2026: Claude Code 2.1.319, Opus 5.5.

## Gałęzie

| Gałąź | Co zawiera |
| --- | --- |
| `main` | Stan przed LIB-218: przedłużenie tylko przy ladzie (`adminRenew`), pętla weryfikacji „jak jest”, lokalne środowisko testowe z danymi bazowymi |
| `final` | LIB-218 według theory-1: sekcja `## TDD` w `CLAUDE.md`, specyfikacja i zatwierdzona lista przypadków w `docs/LIB-218/`, cykl TDD po jednym commicie na przypadek |
| `theory-2` | `final` + testowanie mutacyjne, guardy i scenariusze środowiska testowego jako dowód (M2T5) |
| `own-process` | M2T4, praktyka LIB-233 (studium przypadku C31): własny proces, czyli skille `/research`, `/tdd`, `/implement` i hook, który zapisuje zatwierdzony plan |
| `openspec` | M2T4, praktyka LIB-233 (studium przypadku C31): wynik `openspec init --tools claude`, OpenSpec 1.15.0 |
| `superpowers` | M2T4, praktyka LIB-233 (studium przypadku C31): Superpowers v7.0.0, przypięty przez marketplace kursu w `.claude/settings.json` |
| `telemetry` | M2T4, koszt ticketu (theory-5 i film „Własne liczby”): `own-process` + skill `/ticket-metrics`, stos OpenTelemetry → Prometheus → Grafana w `telemetry/` i tickety LIB-311…LIB-314 |

`main` to także gałąź bazowa dla M2T4: w C18 od niej LIB-218 i LIB-240 przechodzą przez trzy procesy, a gałęzie praktyki (C31, LIB-233) odchodzą od niej jednym commitem konfiguracji. Gałąź `telemetry` odchodzi od `own-process` jeszcze jednym commitem. Co zainstalować i na jakich wersjach sprawdzono gałąź, znajdziesz w README każdej gałęzi praktyki.

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
| 7 | reader4 | 107 | 30.10 | 0 | — |

catalog-api (`stand/catalog-api/holds.json`): rezerwacja reader2 na książkę 104 i rezerwacja reader1 na książkę 101, czyli na jego własne wypożyczenie 1.

Dla LIB-233: wypożyczenie 7 na 03.11 jest przeterminowane, `fineMinor` daje 1000 (dwa dni robocze po 500); wypożyczenie 4 ma rezerwację innego czytelnika, wypożyczenie 1 ma tylko własną rezerwację, a wypożyczenia 2 i 6 są już zwrócone.

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
