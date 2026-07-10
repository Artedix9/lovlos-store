"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatTZS } from "@/lib/products";

/* Mirrors the SavedOrder lifecycle in lib/orders.ts */
const STEPS = [
  { key: "pending", label: "Order Received", desc: "We have your order and will confirm it on WhatsApp." },
  { key: "confirmed", label: "Confirmed", desc: "Payment verified — we're preparing your items." },
  { key: "dispatched", label: "Dispatched", desc: "Your order is on its way." },
  { key: "delivered", label: "Delivered", desc: "Enjoy. Good vibes defined." },
] as const;

interface TrackedItem {
  name: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
  preorder?: boolean;
}

interface TrackedOrder {
  id: string;
  status: string;
  created_at: string;
  city: string;
  payment_method: string;
  items: TrackedItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export default function TrackContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError("Enter your order ID and the phone number used for the order.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const cancelled = order?.status === "cancelled";

  return (
    <>
      <Header />
      <main id="main-content" className="bg-white min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-6 md:px-10 py-16 md:py-24">

          <p className="text-[10px] tracking-ultra uppercase text-chicago font-sans mb-3">
            Support
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
            Track My Order
          </h1>
          <p className="mt-6 text-sm text-mine tracking-wide leading-relaxed max-w-xl">
            Enter your order ID (e.g. LVL-XXXXXX) and the phone number you used at checkout.
          </p>

          {/* ── Lookup form ── */}
          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="track-id" className="text-[10px] font-bold tracking-ultra uppercase text-chicago">
                Order ID
              </label>
              <input
                id="track-id"
                type="text"
                value={orderId}
                onChange={(e) => { setOrderId(e.target.value); setError(null); }}
                placeholder="LVL-XXXXXX"
                autoComplete="off"
                className="w-full bg-white border border-primary text-sm text-primary px-4 py-3.5 outline-none placeholder:text-chicago tracking-widest uppercase focus:border-mine focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="track-phone" className="text-[10px] font-bold tracking-ultra uppercase text-chicago">
                Phone Number
              </label>
              <input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(null); }}
                placeholder="+255 692 928 552"
                autoComplete="tel"
                className="w-full bg-white border border-primary text-sm text-primary px-4 py-3.5 outline-none placeholder:text-chicago tracking-wide focus:border-mine focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-error tracking-wide border border-error/40 bg-error-tint px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white text-xs font-black tracking-widest uppercase py-4 hover:bg-charcoal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Looking Up…" : "Track Order"}
            </button>
          </form>

          {/* ── Result ── */}
          {order && (
            <div className="mt-14 space-y-10" aria-live="polite">
              {/* Order header */}
              <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-mercury">
                <div>
                  <p className="text-[10px] tracking-ultra uppercase text-chicago mb-1">Order</p>
                  <p className="text-lg font-black tracking-tight text-primary">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-ultra uppercase text-chicago mb-1">Placed</p>
                  <p className="text-sm text-mine tracking-wide">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {cancelled ? (
                <div className="border border-error/40 bg-error-tint px-5 py-5 space-y-2">
                  <p className="text-xs font-black uppercase tracking-ultra text-error">
                    Order Cancelled
                  </p>
                  <p className="text-sm text-mine tracking-wide leading-relaxed">
                    This order was cancelled. If that doesn&apos;t look right, message us on WhatsApp at{" "}
                    <a
                      href="https://wa.me/255692928552"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      +255 692 928 552
                    </a>{" "}
                    and we&apos;ll sort it out.
                  </p>
                </div>
              ) : (
                /* ── Status timeline ── */
                <ol className="space-y-0">
                  {STEPS.map((step, i) => {
                    const done = i < stepIndex;
                    const current = i === stepIndex;
                    const last = i === STEPS.length - 1;
                    return (
                      <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Connector line */}
                        {!last && (
                          <span
                            className={[
                              "absolute left-[11px] top-6 bottom-0 w-px",
                              done ? "bg-primary" : "bg-mercury",
                            ].join(" ")}
                            aria-hidden="true"
                          />
                        )}
                        {/* Dot */}
                        <span
                          className={[
                            "relative z-10 w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-colors",
                            done || current
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-mercury",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {done ? (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : current ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <div className="pt-0.5">
                          <p
                            className={[
                              "text-xs tracking-widest uppercase",
                              current ? "font-black text-primary" : done ? "font-bold text-primary" : "text-chicago",
                            ].join(" ")}
                          >
                            {step.label}
                            {current && (
                              <span className="ml-2 text-[9px] bg-primary text-white px-1.5 py-0.5 tracking-widest align-middle">
                                Current
                              </span>
                            )}
                          </p>
                          <p className={["mt-1 text-sm tracking-wide leading-relaxed", current ? "text-mine" : "text-chicago"].join(" ")}>
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* ── Items + totals ── */}
              <div className="bg-smoke/60 p-6">
                <h2 className="text-xs font-black uppercase tracking-ultra text-primary mb-4 pb-3 border-b border-mercury">
                  Order Summary
                </h2>
                <ul className="divide-y divide-mercury/60">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-tight text-primary truncate">
                          {item.name} <span className="font-normal text-chicago">× {item.quantity}</span>
                          {item.preorder && (
                            <span className="ml-1.5 text-[9px] tracking-widest uppercase text-chicago border border-mercury px-1.5 py-0.5 font-normal">Pre-Order</span>
                          )}
                        </p>
                        <p className="text-[10px] tracking-widest uppercase text-chicago mt-0.5">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <p className="text-sm text-mine shrink-0">
                        {formatTZS(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="pt-3 space-y-2 border-t border-mercury text-sm">
                  <div className="flex justify-between">
                    <span className="text-chicago tracking-wide">Delivery to {order.city}</span>
                    <span className="text-mine">
                      {order.delivery_fee === 0 ? "Free" : formatTZS(order.delivery_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t border-mercury text-primary">
                    <span>Total</span>
                    <span>{formatTZS(order.total)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-chicago tracking-wide leading-relaxed">
                Questions about this order? WhatsApp us at{" "}
                <a
                  href={`https://wa.me/255692928552?text=${encodeURIComponent(`Hi LOVLOS! I have a question about my order ${order.id}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
                >
                  +255 692 928 552
                </a>{" "}
                — include your order ID.
              </p>
            </div>
          )}

          {/* Help hint below the form when nothing found yet */}
          {!order && (
            <p className="mt-10 text-xs text-chicago tracking-wide leading-relaxed">
              Can&apos;t find your order ID? It&apos;s on your confirmation page and in your WhatsApp invoice.
              Need help? Visit{" "}
              <Link href="/contact" className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200">
                Contact Us
              </Link>
              .
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
