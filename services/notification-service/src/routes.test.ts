import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  connectRabbitMQ: vi.fn(),
  subscribeToEvent: vi.fn(),
}));

import { query } from "@fastfood/shared";
import Fastify from "fastify";
import { notificationRoutes } from "./routes";

const mockedQuery = vi.mocked(query);

async function buildTestApp() {
  const app = Fastify();
  await app.register(notificationRoutes);
  return app;
}

describe("Notification Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/notifications/:orderId", () => {
    it("should return notifications for an order", async () => {
      const mockNotifications = [
        { id: 1, order_id: "uuid-123", type: "order.received", message: "Order received by kitchen", created_at: "2026-01-01" },
        { id: 2, order_id: "uuid-123", type: "order.preparing", message: "Your order is now being prepared", created_at: "2026-01-01" },
      ];
      mockedQuery.mockResolvedValue({ rows: mockNotifications, command: "", rowCount: 2, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/notifications/uuid-123" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockNotifications);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE order_id"),
        ["uuid-123"]
      );
    });

    it("should return empty array for order with no notifications", async () => {
      mockedQuery.mockResolvedValue({ rows: [], command: "", rowCount: 0, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/notifications/nonexistent" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([]);
    });
  });

  describe("GET /api/notifications", () => {
    it("should return recent notifications", async () => {
      const mockNotifications = [
        { id: 2, order_id: "uuid-123", type: "order.preparing", message: "Your order is now being prepared", created_at: "2026-01-01" },
        { id: 1, order_id: "uuid-123", type: "order.received", message: "Order received by kitchen", created_at: "2026-01-01" },
      ];
      mockedQuery.mockResolvedValue({ rows: mockNotifications, command: "", rowCount: 2, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/notifications" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveLength(2);
    });
  });
});
