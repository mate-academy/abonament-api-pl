# LIB-218: zatwierdzona lista przypadków

Dane przypadków jednostkowych: dziś (`clock.now()`) 03.11.2026. Status: nie rozpoczęto / w toku / zielony.

| # | Warunek lub decyzja | Przypadek | Dane i oczekiwania | Warstwa | Test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | warunek 2 | przedłużenie liczy się od due_at | dziś 03.11, due_at 10.11, renewals = 0 → 200, nowa due_at 24.11 | unit | `test/unit/loans/renew.test.ts` › counts the renewal from due_at, not from today | zielony |
| 2 | warunek 2 | drugie przedłużenie jest dozwolone | renewals = 1 → 200 | unit | `test/unit/loans/renew.test.ts` › allows the second renewal | zielony |
| 3 | warunek 2 | limit przedłużeń | renewals = 2 → LimitReachedError (409 LIMIT_REACHED) | unit | `test/unit/loans/renew.test.ts` › rejects the third renewal with LIMIT_REACHED | zielony |
| 4 | warunek 3 | rezerwacja innego czytelnika | rezerwacja czytelnika 2 → HoldExistsError (409 HOLD_EXISTS) | unit | `test/unit/loans/renew.test.ts` › rejects when another reader holds the book | zielony |
| 5 | warunek 3, decyzja 3 | własna rezerwacja nie blokuje | rezerwacja czytelnika 1 → 200 | unit | `test/unit/loans/renew.test.ts` › own hold does not block renewal | zielony |
| 6 | warunek 4 | jest przeterminowane wypożyczenie | countOverdue zwraca 1 → OverdueLoansError (409 OVERDUE_LOANS), extend nie jest wywoływany | unit | `test/unit/loans/renew.test.ts` › rejects when the reader has an overdue loan | zielony |
| 7 | decyzja 4 | kolejność przyczyn | renewals = 2 i jest przeterminowane wypożyczenie → LIMIT_REACHED | unit | `test/unit/loans/renew.test.ts` › reports LIMIT_REACHED before OVERDUE_LOANS | zielony |
| 8 | decyzja 2 | catalog-api niedostępny | activeForBook odrzuca zapytanie (timeout) → CatalogUnavailableError, extend nie jest wywoływany | unit | | nie rozpoczęto |
| 9 | warunek 4, decyzja 1 | countOverdue na Postgresie | due_at minutę wcześniej niż clock.now() → 1, minutę później → 0; zwrócone przeterminowane wypożyczenie → 0; samo przedłużane wypożyczenie jest liczone | integration | `test/integration/store/loans.repo.test.ts` › countOverdue against Postgres (3 testy) | zielony |
| 10 | zasada CLAUDE.md | extend na Postgresie | due_at zaktualizowane, renewals + 1 | integration | `test/integration/store/loans.repo.test.ts` › extend against Postgres | zielony |
| 11 | warunek 5 | format odpowiedzi | 200 { dueAt }; 409 { code }; 503 { code: "CATALOG_UNAVAILABLE" } | API | | nie rozpoczęto |

Kolejność przechodzenia: najpierw przypadki 9 i 10 (nowe zapytania `src/store`), potem 1–8 (`renew`), potem 11 (trasa).
