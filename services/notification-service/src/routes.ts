import { FastifyInstance } from "fastify";
import { query } from "@fastfood/shared";

export async function notificationRoutes(app: FastifyInstance) {
  app.get<{ Params: { orderId: string } }>(
    "/api/notifications/:orderId",
    async (request, reply) => {
      const { orderId } = request.params;
      const result = await query(
        "SELECT * FROM notifications WHERE order_id = $1 ORDER BY created_at ASC",
        [orderId]
      );
      return reply.send(result.rows);
    }
  );

  app.get("/api/notifications", async (_request, reply) => {
    const result = await query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    return reply.send(result.rows);
  });
}
