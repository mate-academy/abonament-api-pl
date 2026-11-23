---
name: implement
description: Zaimplementować ticket w świeżym kontekście, aż testy z kroku tdd staną się zielone. Uruchamiać po /tdd.
argument-hint: [numer ticketu, np. LIB-218]
disable-model-invocation: true
context: fork
background: false
---
Ticket: $0. Zaimplementuj go tak, aby przeszły testy z kroku tdd. Pracujesz w świeżym kontekście i nie widzisz rozmowy, dlatego wszystko bierz z plików:
- plan: docs/$0/plan.md;
- lista przypadków (list of cases): docs/$0/cases.md;
- testy: commit „test: $0 cases (red)”;
- zasady projektu: CLAUDE.md.

1. Nie zmieniaj testów z tego commitu. Jeśli test wydaje się błędny, zatrzymaj się i wyjaśnij, z którym warunkiem planu się rozmija.
2. Pisz minimalny kod w granicach planu, który sprawi, że testy staną się zielone. Nic poza ticketem.
3. Uruchom `npx tsc --noEmit`, `npx eslint .`, testy jednostkowe i integracyjne i pokaż wynik.
4. Zwróć: które pliki zmieniono, wynik sprawdzeń i czego nie udało się sprawdzić.
