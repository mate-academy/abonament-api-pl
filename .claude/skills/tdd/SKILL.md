---
name: tdd
description: Na podstawie listy przypadków z zatwierdzonego planu utworzyć docs/<ticket>/cases.md, napisać testy według listy i pokazać czerwony przebieg. Uruchamiać po zatwierdzeniu planu, przed implementacją.
argument-hint: [numer ticketu, np. LIB-218]
disable-model-invocation: true
---
Ticket: $0. Nie implementuj kodu aplikacji.

1. Przeczytaj zatwierdzony plan docs/$0/plan.md: zapisał go hook po zatwierdzeniu. Jeśli pliku nie ma, zatrzymaj się i powiedz o tym.
2. Na podstawie listy przypadków (list of cases) z planu utwórz docs/$0/cases.md: tabelę „nr · warunek lub decyzja · przypadek · dane i oczekiwania · warstwa · nazwa testu”.
3. Dla każdego wiersza cases.md napisz test na wskazanej warstwie z danymi z tabeli.
4. Jeśli testowi brakuje nowej metody lub trasy, dodaj tylko zaślepkę, która się kompiluje i rzuca błąd „not implemented”.
5. Uruchom testy i pokaż wynik czerwonego przebiegu (red run). Każdy nowy test ma kończyć się niepowodzeniem z właściwego powodu: na sprawdzeniu oczekiwanego wyniku, a nie na imporcie czy kompilacji. Test, który już jest zielony, oznacz i wyjaśnij dlaczego.
6. Jeśli przypadek wydaje się błędny lub jest sprzeczny z ticketem, zatrzymaj się i wyjaśnij, z którym warunkiem się rozmija. Nie zmieniaj oczekiwań zatwierdzonych przypadków.
7. Zrób commit tylko z testami i zaślepkami, jako osobny commit „test: $0 cases (red)”. Katalogu docs/ nie commitujemy: plan.md i cases.md dołącza się do ticketu.
8. Gdy będziesz kończyć krok, hook Stop projektu uruchomi testy jednostkowe i pokaże, że nie przechodzą. Na tym kroku czerwony przebieg jest oczekiwany: nie zmieniaj kodu ani testów, powtórz, że następny krok to /implement $0, i zakończ.
