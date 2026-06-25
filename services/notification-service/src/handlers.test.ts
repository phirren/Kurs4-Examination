import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  connectRabbitMQ: vi.fn(),
  subscribeToEvent: vi.fn(),
}));

import { query } from "@fastfood/shared";
import { handleOrderStatusUpdated, getNotifications } from "./handlers";

const mockedQuery = vi.mocked(query);

describe("Notification Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleOrderStatusUpdated", () => {
    it("should store notification in database and in-memory", async () => {
      mockedQuery.mockResolvedValue({ rows: [], command: "", rowCount: 1, oid: 0, fields: [] });

      await handleOrderStatusUpdated({
        order_id: "uuid-123",
        customer_name: "Anna",
        status: "ready",
        message: "Your order is ready for pickup!",
      });

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO notifications"),
        ["uuid-123", "order.ready", "Your order is ready for pickup!"]
      );

      const notifications = getNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[notifications.length - 1]).toEqual(
        expect.objectContaining({ order_id: "uuid-123", status: "ready" })
      );
    });
  });
});
