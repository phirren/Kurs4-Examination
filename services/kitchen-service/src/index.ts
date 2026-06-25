import Fastify from "fastify";
import { getPool, connectRabbitMQ, subscribeToEvent } from "@fastfood/shared";
import { kitchenRoutes } from "./routes";
import { handleOrderCreated } from "./handlers";

const PORT = Number(process.env.PORT) || 3003;

export async function buildApp() {
  const app = Fastify({ logger: true });

  getPool(process.env.DATABASE_URL);
  await connectRabbitMQ(process.env.RABBITMQ_URL);

  await subscribeToEvent(
    "kitchen.order.created",
    "order.created",
    handleOrderCreated
  );

  app.get("/health", async () => ({
    status: "ok",
    service: "kitchen-service",
  }));

  await app.register(kitchenRoutes);

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
