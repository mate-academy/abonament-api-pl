# LIB-218. Przedłużanie wypożyczenia online: specyfikacja

## Kryteria akceptacji

1. Czytelnik może przedłużyć wypożyczenie przez API: `POST /loans/:id/renew`.
2. Każde przedłużenie to +14 dni do bieżącej daty zwrotu (`due_at`); nie więcej niż 2 przedłużenia na wypożyczenie.
3. Przedłużenie jest zabronione, jeśli na książkę jest aktywna rezerwacja innego czytelnika.
4. Przedłużenie jest zabronione, jeśli czytelnik ma choć jedno przeterminowane wypożyczenie.
5. Odpowiedź: 200 z nową `due_at`; odmowa: 409 z kodem przyczyny `LIMIT_REACHED` | `HOLD_EXISTS` | `OVERDUE_LOANS`.

## Decyzje po badaniu (plan mode)

| # | Pytanie agenta | Decyzja |
| --- | --- | --- |
| 1 | „Przeterminowane wypożyczenie” oznacza niezwrócone wypożyczenie z `due_at` wcześniejszym niż bieżący moment? Czy liczy się samo przedłużane wypożyczenie? | Tak, `due_at < clock.now()`. Samo wypożyczenie też się liczy: przeterminowanego wypożyczenia nie można przedłużyć online, tylko przy ladzie. |
| 2 | Co zrobić, jeśli catalog-api nie odpowiedział? | Nie wykonujemy przedłużenia: odpowiedź 503, `due_at` bez zmian. |
| 3 | `holds.activeForBook` zwraca wszystkie rezerwacje książki, w tym rezerwację samego czytelnika. Czy blokuje ona przedłużenie? | Nie. Blokuje tylko rezerwacja innego czytelnika, jak w warunku 3. |
| 4 | Jeśli przyczyn odmowy jest kilka, jaki kod zwracać? | Pierwszy w kolejności: `LIMIT_REACHED`, `OVERDUE_LOANS`, `HOLD_EXISTS`. |
| 5 | `src/loans/adminRenew.ts` już przedłuża wypożyczenie. Wziąć go za wzór? | Nie. To przedłużenie przy ladzie: nowa data liczy się tam od dziś przez `new Date()`. Online liczymy od `due_at` przez `clock.now()`. Zmiany w `adminRenew` są non-goal. |

## Non-goals

- zmiany w `src/loans/adminRenew.ts`: przedłużenie przy ladzie zostaje bez zmian;
- zmiany w `src/notify` i szablonach wiadomości e-mail;
- ponowne próby zapytania do catalog-api: przy awarii potrzebna jest szybka odpowiedź 503.
