---
name: ticket-metrics
description: Raport o tickecie z lokalnych logów Claude Code — fazy (skille), model, effort, tokeny, szacunkowy koszt według cen API i czas agenta. Ticket wyszukuje po nazwie gałęzi. Uruchamia go człowiek komendą /ticket-metrics <numer ticketu>.
argument-hint: [numer ticketu, np. LIB-311]
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/report.mjs *) Bash(node .claude/skills/ticket-metrics/scripts/report.mjs *) Bash(git branch --show-current)
---
Ticket: $ARGUMENTS

Raport liczy skrypt z lokalnych logów sesji: tokeny, koszt według cen API, czas agenta, fazę każdego żądania. Twoja rola to uruchomić go i pokazać wynik człowiekowi, bez przeliczania.

1. Jeśli numer ticketu nie został podany, weź go z nazwy bieżącej gałęzi: `git branch --show-current` (na przykład `lib-311-fine` → `LIB-311`). Powiedz, z której gałęzi wziąłeś numer.
2. Uruchom dokładnie tę komendę, bez `cd`, `| tail` ani `2>&1`:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/report.mjs <numer ticketu>
   ```

3. Przepisz raport skryptu do swojej odpowiedzi dosłownie: nagłówek, tabelę i uwagi. W terminalu wynik komendy jest zwinięty do kilku linii, więc człowiek widzi tabelę tylko w twojej odpowiedzi. Nie przeliczaj ani nie zaokrąglaj liczb: raport będzie porównywany z innymi źródłami, na przykład z OpenTelemetry.
4. Pod raportem napisz jedno lub dwa krótkie zdania: która faza pochłonęła najwięcej kosztu i czasu agenta oraz czy w tabeli jest coś nietypowego (kilka modeli lub effortów w fazie, duży udział doprecyzowań w fazie lub „poza fazami”). Nie wymyślaj przyczyn: raport pokazuje, gdzie patrzeć, a nie dlaczego tak wyszło.
5. Jeśli skrypt pisze, że ticketu nie ma w logach, powiedz to i zatrzymaj się. Nie szukaj logów ręcznie: format logów jest wewnętrzny, a ręczne liczenie da inne liczby niż skrypt.
