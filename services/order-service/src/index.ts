import Fastify from "fastify";
import { getPool, connectRabbitMQ } from "@fastfood/shared";
import { orderRoutes } from "./routes";

const PORT = Number(process.env.PORT) || 3002;

export async function buildApp() {
  const app = Fastify({ logger: true });

  getPool(process.env.DATABASE_URL);
  await connectRabbitMQ(process.env.RABBITMQ_URL);

  app.get("/health", async () => ({ status: "ok", service: "order-service" }));

  await app.register(orderRoutes);

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
