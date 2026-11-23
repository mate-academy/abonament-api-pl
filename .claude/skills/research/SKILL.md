---
name: research
description: Zbadać ticket przed planem — przeczytać kod i testy, znaleźć otwarte decyzje, zadać pytania. Uruchamiać na początku pracy nad ticketem, w plan mode.
argument-hint: [tekst lub numer ticketu]
disable-model-invocation: true
---
Zbadaj ticket, zanim zaczniesz planować. Nie zmieniaj kodu.

Ticket: $ARGUMENTS

1. Jeśli podłączono serwer MCP trackera lub czatu (Jira, Slack), przeczytaj stamtąd ticket i dyskusję o nim. Jeśli nie, pracuj z tekstem powyżej.
2. Przeczytaj kod i testy, których dotyczy ticket. Ustal, co już istnieje i co można ponownie wykorzystać.
3. Wypisz otwarte decyzje: wszystko, czego ticket nie określa, a od czego zależy zachowanie. Do każdej dodaj swoją propozycję.
4. Zadaj pytania przez AskUserQuestion: tylko te, które wpływają na zachowanie. Nie pytaj o rzeczy oczywiste.
5. Ułóż plan. Pierwsza linia to „# <numer ticketu>: <nazwa>”, na jej podstawie hook zapisze plan:
   - kontekst i podjęte decyzje;
   - lista przypadków (warunek lub decyzja → przypadek → dane i oczekiwania → warstwa testu);
   - co nie wchodzi w zakres ticketu;
   - jak sprawdzić w środowisku testowym (stand);
   - następny krok: programista uruchamia /tdd <numer ticketu>.
6. Po zatwierdzeniu planu nie pisz ani testów, ani kodu. Powiedz, że następny krok to /tdd <numer ticketu>, i czekaj: testy pisze /tdd, a kod /implement.
