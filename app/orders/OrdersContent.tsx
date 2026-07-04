"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatTZS } from "@/lib/products";
import { getOrderHistory, type LocalOrder } from "@/lib/orderHistory";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_CLS: Record<string, string> = {
  pending: "text-amber-700 border-amber-300 bg-amber-50",
  confirmed: "text-sky-700 border-sky-300 bg-sky-50",
  dispatched: "text-violet-700 border-violet-300 bg-violet-50",
  delivered: "text-emerald-700 border-emerald-300 bg-emerald-50",
  cancelled: "text-error border-error/30 bg-error-tint",
};

export default function OrdersContent() {
  const [orders, setOrders] = useState<LocalOrder[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const history = getOrderHistory();
    setOrders(history);

    /* Fetch live status for each order — id+phone were saved at checkout */
    history.forEach(async (o) => {
      try {
        const res = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: o.id, phone: o.phone }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.order?.status) {
          setStatuses((prev) => ({ ...prev, [o.id]: json.order.status }));
        }
      } catch {
        /* offline — the order still lists without a live status */
      }
    });
  }, []);

  /* orders === null only before the first client render */
  if (orders === null) return null;

  return (
    <>
      <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-primary mb-3">
        My Orders
      </h1>
      <p className="text-sm text-chicago tracking-wide mb-10">
        Orders placed from this device. Statuses update as we process them.
      </p>

      {orders.length === 0 ? (
        <div className="border border-mercury p-10 text-center">
          <p className="text-sm text-chicago tracking-wide mb-6">
            No orders on this device yet — your next order will show up here automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/women" className="btn-primary">Shop Women</Link>
            <Link href="/men" className="btn-outline">Shop Men</Link>
          </div>
          <p className="text-xs text-chicago tracking-wide mt-6">
            Ordered from another phone?{" "}
            <Link href="/track" className="underline underline-offset-2 hover:text-primary transition-colors duration-200">
              Track it by order ID →
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const status = statuses[o.id];
            return (
              <div key={o.id} className="border border-mercury p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold tracking-widest text-primary">{o.id}</p>
                  <p className="text-xs text-chicago tracking-wide mt-1">
                    {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{o.city}
                  </p>
                </div>

                <p className="text-sm text-primary tracking-wide tabular-nums">{formatTZS(o.total)}</p>

                {status ? (
                  <span className={`text-[10px] tracking-widest uppercase border px-2.5 py-1 ${STATUS_CLS[status] ?? "text-chicago border-mercury"}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                ) : (
                  <span className="text-[10px] tracking-widest uppercase text-alto border border-mercury px-2.5 py-1">
                    ...
                  </span>
                )}

                <Link
                  href={`/track?id=${o.id}`}
                  className="text-xs tracking-widest uppercase text-chicago underline underline-offset-2 hover:text-primary transition-colors duration-200"
                >
                  Details
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
