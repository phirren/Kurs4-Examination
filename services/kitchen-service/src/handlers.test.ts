import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  connectRabbitMQ: vi.fn(),
  subscribeToEvent: vi.fn(),
  publishEvent: vi.fn(),
}));

import { query, publishEvent } from "@fastfood/shared";
import { handleOrderCreated } from "./handlers";

const mockedQuery = vi.mocked(query);
const mockedPublish = vi.mocked(publishEvent);

describe("Kitchen Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleOrderCreated", () => {
    it("should create a kitchen ticket and update order status", async () => {
      mockedQuery.mockResolvedValue({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] });
      mockedPublish.mockResolvedValue(undefined);

      await handleOrderCreated({
        order_id: "uuid-123",
        customer_name: "Anna",
        items: [{ product_id: 1, product_name: "Classic Burger", quantity: 2, price: 89 }],
        total: 178,
      });

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO kitchen_tickets"),
        ["uuid-123"]
      );
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE orders SET status"),
        ["uuid-123"]
      );
      expect(mockedPublish).toHaveBeenCalledWith(
        "order.status.updated",
        expect.objectContaining({
          order_id: "uuid-123",
          status: "received",
        })
      );
    });
  });
});
