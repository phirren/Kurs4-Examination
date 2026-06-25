import { query, publishEvent } from "@fastfood/shared";

interface OrderCreatedEvent {
  order_id: string;
  customer_name: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export async function handleOrderCreated(data: unknown): Promise<void> {
  const event = data as OrderCreatedEvent;
  console.log(`Kitchen received order: ${event.order_id}`);

  await query(
    `INSERT INTO kitchen_tickets (order_id, status) VALUES ($1, 'received')`,
    [event.order_id]
  );

  await query(`UPDATE orders SET status = 'received' WHERE id = $1`, [
    event.order_id,
  ]);

  await publishEvent("order.status.updated", {
    order_id: event.order_id,
    customer_name: event.customer_name,
    status: "received",
    message: `Order received by kitchen`,
  });
}
