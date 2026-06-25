import Fastify from "fastify";
import { getPool } from "@fastfood/shared";
import { productRoutes } from "./routes";

const PORT = Number(process.env.PORT) || 3001;

export async function buildApp() {
  const app = Fastify({ logger: true });

  getPool(process.env.DATABASE_URL);

  app.get("/health", async () => ({ status: "ok", service: "product-service" }));

  await app.register(productRoutes);

  return app;
}

async function start() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
