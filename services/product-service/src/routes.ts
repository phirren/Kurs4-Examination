import { FastifyInstance } from "fastify";
import { query } from "@fastfood/shared";

export async function productRoutes(app: FastifyInstance) {
  app.get("/api/products", async (_request, reply) => {
    const result = await query(
      "SELECT * FROM products WHERE available = true ORDER BY category, name"
    );
    return reply.send(result.rows);
  });

  app.get<{ Params: { id: string } }>(
    "/api/products/:id",
    async (request, reply) => {
      const { id } = request.params;
      const result = await query("SELECT * FROM products WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "Product not found" });
      }
      return reply.send(result.rows[0]);
    }
  );

  app.get("/api/menu", async (_request, reply) => {
    const result = await query(
      "SELECT * FROM products WHERE available = true ORDER BY category, name"
    );
    const menu: Record<string, unknown[]> = {};
    for (const product of result.rows) {
      if (!menu[product.category]) {
        menu[product.category] = [];
      }
      menu[product.category].push(product);
    }
    return reply.send(menu);
  });
}
