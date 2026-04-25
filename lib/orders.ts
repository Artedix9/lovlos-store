import type { CartItem } from "@/context/CartContext";

export interface OrderPayload {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  delivery_note: string;
  payment_method: "mobile-money" | "cash-on-delivery";
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export interface SavedOrder extends OrderPayload {
  id: string;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  created_at: string;
}

/** Generate a short human-readable order ID: LVL-XXXXXX */
export function generateOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LVL-${id}`;
}

/** Build the WhatsApp deep-link message */
export function buildWhatsAppUrl(order: SavedOrder): string {
  const itemLines = order.items
    .map((item) => `  • ${item.name} (${item.size}) x${item.quantity} — TZS ${(item.price * item.quantity).toLocaleString("en-TZ")}`)
    .join("\n");

  const message =
    `🛍️ NEW ORDER: LOVLOS — ${order.id}\n\n` +
    `Customer: ${order.customer_name}\n` +
    `Phone: ${order.phone}\n` +
    `Email: ${order.email}\n` +
    `Delivery: ${order.city}${order.delivery_note ? ` — ${order.delivery_note}` : ""}\n` +
    `Payment: ${order.payment_method === "mobile-money" ? "Mobile Money" : "Cash on Delivery"}\n\n` +
    `Items:\n${itemLines}\n\n` +
    `Subtotal: TZS ${order.subtotal.toLocaleString("en-TZ")}\n` +
    `Delivery: ${order.delivery_fee === 0 ? "Free" : `TZS ${order.delivery_fee.toLocaleString("en-TZ")}`}\n` +
    `Total: TZS ${order.total.toLocaleString("en-TZ")}\n\n` +
    `Please confirm M-Pesa / TigoPesa payment to start delivery.`;

  return `https://wa.me/255746704036?text=${encodeURIComponent(message)}`;
}
