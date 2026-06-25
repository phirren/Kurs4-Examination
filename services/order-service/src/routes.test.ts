import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  connectRabbitMQ: vi.fn(),
  publishEvent: vi.fn(),
}));

import { query, publishEvent } from "@fastfood/shared";
import Fastify from "fastify";
import { orderRoutes } from "./routes";

const mockedQuery = vi.mocked(query);
const mockedPublish = vi.mocked(publishEvent);

async function buildTestApp() {
  const app = Fastify();
  await app.register(orderRoutes);
  return app;
}

describe("Order Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("should create an order and publish event", async () => {
      mockedQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 1, price: "89.00", name: "Classic Burger" },
            { id: 4, price: "35.00", name: "French Fries" },
          ],
          command: "", rowCount: 2, oid: 0, fields: [],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "uuid-123", customer_name: "Anna", status: "pending", total: "213.00" }],
          command: "", rowCount: 1, oid: 0, fields: [],
        })
        .mockResolvedValueOnce({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] });

      mockedPublish.mockResolvedValue(undefined);

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        payload: {
          customer_name: "Anna",
          items: [
            { product_id: 1, quantity: 2 },
            { product_id: 4, quantity: 1 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.customer_name).toBe("Anna");
      expect(mockedPublish).toHaveBeenCalledWith("order.created", expect.objectContaining({
        order_id: "uuid-123",
        customer_name: "Anna",
      }));
    });

    it("should return 400 for empty items", async () => {
      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        payload: { customer_name: "Anna", items: [] },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for missing customer_name", async () => {
      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        payload: { items: [{ product_id: 1, quantity: 1 }] },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 if product is unavailable", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: "", rowCount: 0, oid: 0, fields: [],
      });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        payload: {
          customer_name: "Anna",
          items: [{ product_id: 999, quantity: 1 }],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("should return order with items", async () => {
      mockedQuery
        .mockResolvedValueOnce({
          rows: [{ id: "uuid-123", customer_name: "Anna", status: "pending", total: "89.00" }],
          command: "", rowCount: 1, oid: 0, fields: [],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, order_id: "uuid-123", product_id: 1, quantity: 1, price: "89.00", product_name: "Classic Burger" }],
          command: "", rowCount: 1, oid: 0, fields: [],
        });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/orders/uuid-123" });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.customer_name).toBe("Anna");
      expect(body.items).toHaveLength(1);
    });

    it("should return 404 for non-existent order", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], command: "", rowCount: 0, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/orders/nonexistent" });

      expect(response.statusCode).toBe(404);
    });
  });
});
