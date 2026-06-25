import amqplib from "amqplib";

const EXCHANGE_NAME = "fastfood.events";

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let channel: Awaited<ReturnType<typeof amqplib.connect>> extends { createChannel(): Promise<infer C> } ? C | null : never = null;

export async function connectRabbitMQ(
  url: string = process.env.RABBITMQ_URL || "amqp://localhost"
) {
  if (channel) return channel;

  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      connection = await amqplib.connect(url);
      const ch = await connection.createChannel();
      await ch.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
      channel = ch;
      console.log("Connected to RabbitMQ");
      return ch;
    } catch (err) {
      console.log(
        `RabbitMQ connection attempt ${i + 1}/${maxRetries} failed, retrying...`
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Failed to connect to RabbitMQ");
}

export async function publishEvent(
  routingKey: string,
  data: unknown
): Promise<void> {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
  console.log(`Published event: ${routingKey}`);
}

export async function subscribeToEvent(
  queueName: string,
  routingKey: string,
  handler: (data: unknown) => Promise<void>
): Promise<void> {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      channel!.ack(msg);
    } catch (err) {
      console.error(`Error processing message from ${queueName}:`, err);
      channel!.nack(msg, false, true);
    }
  });

  console.log(`Subscribed to ${routingKey} on queue ${queueName}`);
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}

export { EXCHANGE_NAME };
