import { FastifyInstance } from "fastify";
import { query, publishEvent } from "@fastfood/shared";

export async function kitchenRoutes(app: FastifyInstance) {
  app.get("/api/kitchen/tickets", async (_request, reply) => {
    const result = await query(
      `SELECT kt.*, o.customer_name, o.total
       FROM kitchen_tickets kt
       JOIN orders o ON o.id = kt.order_id
       ORDER BY kt.created_at ASC`
    );
    return reply.send(result.rows);
  });

  app.patch<{ Params: { orderId: string }; Body: { status: string } }>(
    "/api/kitchen/tickets/:orderId",
    async (request, reply) => {
      const { orderId } = request.params;
      const { status } = request.body;

      const validStatuses = ["preparing", "ready", "completed"];
      if (!validStatuses.includes(status)) {
        return reply
          .status(400)
          .send({ error: `Status must be one of: ${validStatuses.join(", ")}` });
      }

      const ticket = await query(
        "SELECT * FROM kitchen_tickets WHERE order_id = $1",
        [orderId]
      );
      if (ticket.rows.length === 0) {
        return reply.status(404).send({ error: "Ticket not found" });
      }

      const updates: string[] = [`status = '${status}'`];
      if (status === "preparing") updates.push("started_at = NOW()");
      if (status === "ready" || status === "completed")
        updates.push("completed_at = NOW()");

      await query(
        `UPDATE kitchen_tickets SET ${updates.join(", ")} WHERE order_id = $1`,
        [orderId]
      );

      await query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [
        status,
        orderId,
      ]);

      const order = await query("SELECT * FROM orders WHERE id = $1", [orderId]);

      const statusMessages: Record<string, string> = {
        preparing: "Your order is now being prepared",
        ready: "Your order is ready for pickup!",
        completed: "Order completed. Thank you!",
      };

      await publishEvent("order.status.updated", {
        order_id: orderId,
        customer_name: order.rows[0].customer_name,
        status,
        message: statusMessages[status],
      });

      return reply.send({ order_id: orderId, status });
    }
  );
}
