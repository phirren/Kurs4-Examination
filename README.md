# Fast Food Order System

A distributed, event-driven backend system inspired by fast-food restaurant order flows. Built with TypeScript, Fastify, RabbitMQ, PostgreSQL, and Nginx.

## Architecture

```
Client → Nginx (port 80) → Services
                              ├── product-service  (GET /api/products, /api/menu)
                              ├── order-service     (POST/GET /api/orders)
                              ├── kitchen-service   (GET/PATCH /api/kitchen/tickets)
                              └── notification-service (GET /api/notifications)

Inter-service communication: RabbitMQ (topic exchange)
Database: PostgreSQL (shared)
```

### Event flow

1. Customer places order → `order-service` publishes `order.created`
2. `kitchen-service` receives event → creates ticket, publishes `order.status.updated`
3. Kitchen staff updates ticket status (preparing → ready → completed)
4. Each status change publishes `order.status.updated`
5. `notification-service` receives all status updates → stores notifications

## Start the system

```bash
docker compose up --build
```

All services, database (with seed data), RabbitMQ, and Nginx start automatically. The system is available at **http://localhost**.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get a product |
| GET | `/api/menu` | Get menu grouped by category |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get order with items |
| GET | `/api/kitchen/tickets` | List kitchen tickets |
| PATCH | `/api/kitchen/tickets/:orderId` | Update ticket status |
| GET | `/api/notifications` | List recent notifications |
| GET | `/api/notifications/:orderId` | Get notifications for an order |

### Example: Place an order

```bash
curl -X POST http://localhost/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Anna",
    "items": [
      { "product_id": 1, "quantity": 2 },
      { "product_id": 4, "quantity": 1 }
    ]
  }'
```

## Run tests

```bash
# Unit tests (per service)
cd services/product-service && npm test

# Full system E2E: start system then run CI workflow
docker compose up --build -d
```

Tests run automatically on push via GitHub Actions CI.
