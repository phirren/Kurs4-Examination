import { FastifyInstance } from "fastify";
import { query, publishEvent } from "@fastfood/shared";

interface OrderItem {
  product_id: number;
  quantity: number;
}

interface CreateOrderBody {
  customer_name: string;
  items: OrderItem[];
}

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateOrderBody }>(
    "/api/orders",
    async (request, reply) => {
      const { customer_name, items } = request.body;

      if (!customer_name || !items || items.length === 0) {
        return reply
          .status(400)
          .send({ error: "customer_name and items are required" });
      }

      const productIds = items.map((i) => i.product_id);
      const products = await query(
        `SELECT id, price, name FROM products WHERE id = ANY($1) AND available = true`,
        [productIds]
      );

      if (products.rows.length !== productIds.length) {
        return reply
          .status(400)
          .send({ error: "One or more products not found or unavailable" });
      }

      const priceMap = new Map(
        products.rows.map((p: { id: number; price: string; name: string }) => [
          p.id,
          { price: parseFloat(p.price), name: p.name },
        ])
      );

      let total = 0;
      for (const item of items) {
        const product = priceMap.get(item.product_id);
        if (!product) {
          return reply
            .status(400)
            .send({ error: `Product ${item.product_id} not found` });
        }
        total += product.price * item.quantity;
      }

      const orderResult = await query(
        `INSERT INTO orders (customer_name, status, total) VALUES ($1, 'pending', $2) RETURNING *`,
        [customer_name, total]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        const product = priceMap.get(item.product_id)!;
        await query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, product.price]
        );
      }

      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        product_name: priceMap.get(item.product_id)!.name,
        quantity: item.quantity,
        price: priceMap.get(item.product_id)!.price,
      }));

      await publishEvent("order.created", {
        order_id: order.id,
        customer_name,
        items: orderItems,
        total,
      });

      return reply.status(201).send(order);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/orders/:id",
    async (request, reply) => {
      const { id } = request.params;
      const orderResult = await query("SELECT * FROM orders WHERE id = $1", [
        id,
      ]);
      if (orderResult.rows.length === 0) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const itemsResult = await query(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [id]
      );

      return reply.send({
        ...orderResult.rows[0],
        items: itemsResult.rows,
      });
    }
  );

  app.get("/api/orders", async (_request, reply) => {
    const result = await query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return reply.send(result.rows);
  });
}
