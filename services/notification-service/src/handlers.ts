import { query } from "@fastfood/shared";

interface OrderStatusEvent {
  order_id: string;
  customer_name: string;
  status: string;
  message: string;
}

const notifications: OrderStatusEvent[] = [];

export function getNotifications() {
  return notifications;
}

export async function handleOrderStatusUpdated(
  data: unknown
): Promise<void> {
  const event = data as OrderStatusEvent;
  console.log(
    `Notification: Order ${event.order_id} → ${event.status}: ${event.message}`
  );

  notifications.push(event);

  await query(
    `INSERT INTO notifications (order_id, type, message) VALUES ($1, $2, $3)`,
    [event.order_id, `order.${event.status}`, event.message]
  );
}
