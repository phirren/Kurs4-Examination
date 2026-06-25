import Fastify from "fastify";
import { connectRabbitMQ, subscribeToEvent, getPool } from "@fastfood/shared";
import { notificationRoutes } from "./routes";
import { handleOrderStatusUpdated } from "./handlers";

const PORT = Number(process.env.PORT) || 3004;

export async function buildApp() {
  const app = Fastify({ logger: true });

  getPool(process.env.DATABASE_URL);
  await connectRabbitMQ(process.env.RABBITMQ_URL);

  await subscribeToEvent(
    "notifications.order.status",
    "order.status.updated",
    handleOrderStatusUpdated
  );

  app.get("/health", async () => ({
    status: "ok",
    service: "notification-service",
  }));

  await app.register(notificationRoutes);

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
