# Dokumentation

*OBS*
## Felsökning

Om du får 404-fel, kör:

docker compose down -v
docker compose up --build

Detta rensar gamla volymer och bygger om alla tjänster från grunden.

*OBS*

## Starta systemet

Hela systemet startas med ett enda kommando:

```bash
docker compose up --build
```

Detta startar alla tjänster (product, order, kitchen, notification), PostgreSQL med tabeller och seeddata, RabbitMQ samt Nginx. Systemet är redo att användas när alla containers visar "healthy".

## Publik ingång

All trafik går genom Nginx på **http://localhost** (port 80). Interna tjänster är inte nåbara utifrån.

## Testa flödet

1. Hämta menyn:
```bash
curl http://localhost/api/menu
```

2. Lägg en order:
```bash
curl -X POST http://localhost/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Anna","items":[{"product_id":1,"quantity":2},{"product_id":4,"quantity":1}]}'
```

3. Se kökets biljetter:
```bash
curl http://localhost/api/kitchen/tickets
```

4. Uppdatera orderstatus (byt ut ORDER_ID mot det id du fick i steg 2):
```bash
curl -X PATCH http://localhost/api/kitchen/tickets/ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'

curl -X PATCH http://localhost/api/kitchen/tickets/ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"ready"}'
```

5. Se notiser för ordern:
```bash
curl http://localhost/api/notifications/ORDER_ID
```

6. Kontrollera slutgiltig orderstatus:
```bash
curl http://localhost/api/orders/ORDER_ID
```
