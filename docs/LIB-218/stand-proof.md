# LIB-218: dowód ze środowiska testowego

Scenariusze z `http/renew.http` wykonane przez curl w lokalnym środowisku testowym. Dla każdego: komenda, surowa odpowiedź (bez nagłówków `date`, `connection`, `keep-alive`) i stan wypożyczenia po żądaniu.

- Build: `docker compose up --build -d` z bieżącego drzewa; kod `src/` jak w commicie `6121e88`, ostatnim, który zmienia `src/`.
- Czas środowiska testowego: `CLOCK_FIXED_NOW=2026-11-03T09:00:00Z`.
- Dane: `stand/seed-data.ts`, rezerwacje: `stand/catalog-api/holds.json`; stan przed przebiegiem zresetowano przez `docker compose down -v`.
- Oczekiwania pochodzą z ticketu i `docs/LIB-218/spec.md`, nie z kodu.

### Scenariusz 1 (wypożyczenie 7)

```
$ curl -i -X POST http://localhost:3000/loans/7/renew -H "Authorization: Bearer $READER1"
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 36

{"dueAt":"2026-11-24T00:00:00.000Z"}

$ curl http://localhost:3000/loans/7 -H "Authorization: Bearer $READER1"
{"id":7,"dueAt":"2026-11-24T00:00:00.000Z","renewals":1}
```

### Scenariusz 2 (wypożyczenie 8)

```
$ curl -i -X POST http://localhost:3000/loans/8/renew -H "Authorization: Bearer $READER1"
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 36

{"dueAt":"2026-12-01T00:00:00.000Z"}

$ curl http://localhost:3000/loans/8 -H "Authorization: Bearer $READER1"
{"id":8,"dueAt":"2026-12-01T00:00:00.000Z","renewals":2}
```

### Scenariusz 3 (wypożyczenie 9)

```
$ curl -i -X POST http://localhost:3000/loans/9/renew -H "Authorization: Bearer $READER1"
HTTP/1.1 409 Conflict
content-type: application/json; charset=utf-8
content-length: 24

{"code":"LIMIT_REACHED"}

$ curl http://localhost:3000/loans/9 -H "Authorization: Bearer $READER1"
{"id":9,"dueAt":"2026-11-24T00:00:00.000Z","renewals":2}
```

### Scenariusz 4 (wypożyczenie 10)

```
$ curl -i -X POST http://localhost:3000/loans/10/renew -H "Authorization: Bearer $READER1"
HTTP/1.1 409 Conflict
content-type: application/json; charset=utf-8
content-length: 22

{"code":"HOLD_EXISTS"}

$ curl http://localhost:3000/loans/10 -H "Authorization: Bearer $READER1"
{"id":10,"dueAt":"2026-11-14T00:00:00.000Z","renewals":0}
```

### Scenariusz 5 (wypożyczenie 11)

```
$ curl -i -X POST http://localhost:3000/loans/11/renew -H "Authorization: Bearer $READER1"
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 36

{"dueAt":"2026-11-28T00:00:00.000Z"}

$ curl http://localhost:3000/loans/11 -H "Authorization: Bearer $READER1"
{"id":11,"dueAt":"2026-11-28T00:00:00.000Z","renewals":1}
```

### Scenariusz 6 (wypożyczenie 12)

```
$ curl -i -X POST http://localhost:3000/loans/12/renew -H "Authorization: Bearer $READER3"
HTTP/1.1 409 Conflict
content-type: application/json; charset=utf-8
content-length: 24

{"code":"OVERDUE_LOANS"}

$ curl http://localhost:3000/loans/12 -H "Authorization: Bearer $READER3"
{"id":12,"dueAt":"2026-11-15T00:00:00.000Z","renewals":0}
```

### Scenariusz 7 (wypożyczenie 14)

```
$ curl -i -X POST http://localhost:3000/loans/14/renew -H "Authorization: Bearer $READER4"
HTTP/1.1 409 Conflict
content-type: application/json; charset=utf-8
content-length: 24

{"code":"OVERDUE_LOANS"}

$ curl http://localhost:3000/loans/14 -H "Authorization: Bearer $READER4"
{"id":14,"dueAt":"2026-11-01T00:00:00.000Z","renewals":0}
```

### Scenariusz 8 (wypożyczenie 15)

```
$ curl -i -X POST http://localhost:3000/loans/15/renew -H "Authorization: Bearer $READER4"
HTTP/1.1 409 Conflict
content-type: application/json; charset=utf-8
content-length: 24

{"code":"LIMIT_REACHED"}

$ curl http://localhost:3000/loans/15 -H "Authorization: Bearer $READER4"
{"id":15,"dueAt":"2026-11-20T00:00:00.000Z","renewals":2}
```

### Scenariusz 9 (wypożyczenie 16): catalog-api niedostępny

Oczekiwania ze specyfikacji: 503, `due_at` bez zmian. Klient catalog-api czeka 2 s bez ponownych prób, dlatego ważne jest, w jaki sposób serwis jest „niedostępny”.

Po `docker compose stop catalog-api` nazwa `catalog-api` przestaje się rozwiązywać i żądanie pada od razu, bez timeoutu:

```
$ docker compose stop catalog-api
$ curl -s -w " time_total: %{time_total}s" -X POST http://localhost:3000/loans/16/renew -H "Authorization: Bearer $READER1"
{"code":"CATALOG_UNAVAILABLE"} time_total: 0.214550s
(jeszcze dwa uruchomienia: 0.015152s, 0.016458s)
$ docker compose exec -T abonament-api node -e "const t=Date.now();fetch('http://catalog-api:4000/health').catch(e=>console.log(Date.now()-t+'ms',e.name,e.cause.code,e.cause.message))"
51ms TypeError ENOTFOUND getaddrinfo ENOTFOUND catalog-api
```

Po `docker compose pause catalog-api` kontener zostaje w sieci, ale nie odpowiada, i zadziała timeout klienta:

```
$ docker compose pause catalog-api
$ curl -s -w " time_total: %{time_total}s" -X POST http://localhost:3000/loans/16/renew -H "Authorization: Bearer $READER1"
{"code":"CATALOG_UNAVAILABLE"} time_total: 2.020556s
(jeszcze dwa uruchomienia: 2.018255s, 2.017652s)
$ docker compose unpause catalog-api
$ curl http://localhost:3000/loans/16 -H "Authorization: Bearer $READER1"
{"id":16,"dueAt":"2026-11-12T00:00:00.000Z","renewals":0}
```

Oba warianty dają 503 i `due_at` bez zmian. Timeout 2 s sprawdza tylko `pause`.
