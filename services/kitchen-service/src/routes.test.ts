import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  connectRabbitMQ: vi.fn(),
  subscribeToEvent: vi.fn(),
  publishEvent: vi.fn(),
}));

import { query, publishEvent } from "@fastfood/shared";
import Fastify from "fastify";
import { kitchenRoutes } from "./routes";

const mockedQuery = vi.mocked(query);
const mockedPublish = vi.mocked(publishEvent);

async function buildTestApp() {
  const app = Fastify();
  await app.register(kitchenRoutes);
  return app;
}

describe("Kitchen Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/kitchen/tickets", () => {
    it("should return all kitchen tickets", async () => {
      const mockTickets = [
        { id: 1, order_id: "uuid-123", status: "received", customer_name: "Anna", total: "178.00" },
      ];
      mockedQuery.mockResolvedValue({ rows: mockTickets, command: "", rowCount: 1, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/kitchen/tickets" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockTickets);
    });
  });

  describe("PATCH /api/kitchen/tickets/:orderId", () => {
    it("should update ticket status to preparing", async () => {
      mockedQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, order_id: "uuid-123", status: "received" }],
          command: "", rowCount: 1, oid: 0, fields: [],
        })
        .mockResolvedValueOnce({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({
          rows: [{ id: "uuid-123", customer_name: "Anna" }],
          command: "", rowCount: 1, oid: 0, fields: [],
        });
      mockedPublish.mockResolvedValue(undefined);

      const app = await buildTestApp();
      const response = await app.inject({
        method: "PATCH",
        url: "/api/kitchen/tickets/uuid-123",
        payload: { status: "preparing" },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ order_id: "uuid-123", status: "preparing" });
      expect(mockedPublish).toHaveBeenCalledWith(
        "order.status.updated",
        expect.objectContaining({ status: "preparing" })
      );
    });

    it("should reject invalid status", async () => {
      const app = await buildTestApp();
      const response = await app.inject({
        method: "PATCH",
        url: "/api/kitchen/tickets/uuid-123",
        payload: { status: "invalid" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 404 for non-existent ticket", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], command: "", rowCount: 0, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "PATCH",
        url: "/api/kitchen/tickets/nonexistent",
        payload: { status: "preparing" },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
