"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { formatTZS } from "@/lib/products";
import { buildWhatsAppUrl, generateOrderId } from "@/lib/orders";
import type { OrderPayload, SavedOrder } from "@/lib/orders";

const CITIES = [
  "Dar es Salaam",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Zanzibar",
  "Mbeya",
  "Tanga",
  "Morogoro",
  "Other",
];

const DELIVERY_FEE = 5000;
const FREE_DELIVERY_THRESHOLD = 150000;

interface FormState {
  name: string;
  phone: string;
  email: string;
  city: string;
  note: string;
  payment: "mobile-money" | "cash-on-delivery";
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

/* ── Field wrapper ── */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold tracking-ultra uppercase text-zinc-600">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 tracking-wide">{error}</p>
      )}
    </div>
  );
}

const inputCls = (hasError?: string) =>
  [
    "w-full bg-white border text-sm text-zinc-900 px-4 py-3.5 outline-none",
    "placeholder:text-zinc-400 tracking-wide transition-all duration-200",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-zinc-900 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-900/10",
  ].join(" ");

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, closeCart } = useCart();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    city: "Dar es Salaam",
    note: "",
    payment: "mobile-money",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [placing, setPlacing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!/^(\+255|0)[67]\d{8}$/.test(form.phone.replace(/\s/g, ""))) {
      next.phone = "Enter a valid Tanzanian number (e.g. 0746 704 036).";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setPlacing(true);
    setApiError(null);

    const payload: OrderPayload = {
      id: generateOrderId(),
      customer_name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city,
      delivery_note: form.note.trim(),
      payment_method: form.payment,
      items,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      const { order }: { order: SavedOrder } = await res.json();

      /* Open WhatsApp in a new tab with the full invoice message */
      window.open(buildWhatsAppUrl(order), "_blank", "noopener,noreferrer");

      clearCart();
      closeCart();

      router.push(
        `/success?total=${total}&payment=${form.payment}&region=${encodeURIComponent(form.city)}&orderId=${order.id}`
      );
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
      setPlacing(false);
    }
  }

  /* ── Empty cart guard ── */
  if (items.length === 0 && !placing) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
          <p className="text-xs font-bold uppercase tracking-ultra text-zinc-500">Your bag is empty</p>
          <h1 className="font-sans text-3xl font-black uppercase tracking-tight text-zinc-950">Nothing to check out</h1>
          <Link href="/" className="btn-primary mt-4">Continue Shopping</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-14">

          {/* Page title */}
          <div className="mb-10">
            <p className="text-[10px] tracking-ultra uppercase text-zinc-500 font-sans mb-2">
              Almost there
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-950">
              Checkout
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start"
          >
            {/* ══ LEFT — Delivery & Payment ══ */}
            <div className="space-y-10">

              {/* Delivery Info */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-ultra text-zinc-950 mb-6 pb-3 border-b border-zinc-200">
                  Delivery Information
                </h2>

                <div className="space-y-5">
                  <Field label="Full Name *" error={errors.name}>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="e.g. Amara Osei"
                      className={inputCls(errors.name)}
                    />
                  </Field>

                  <Field label="Phone Number *" error={errors.phone}>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder="+255 746 704 036"
                      className={inputCls(errors.phone)}
                    />
                  </Field>

                  <Field label="Email Address (optional)" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={inputCls(errors.email)}
                    />
                  </Field>

                  <Field label="City / Delivery Area">
                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-900 text-sm text-zinc-900 px-4 py-3.5 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-900/10 transition-all duration-200 cursor-pointer appearance-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Delivery Note (optional)">
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Landmark, building name, gate colour…"
                      className="w-full bg-white border border-zinc-900 text-sm text-zinc-900 px-4 py-3.5 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-900/10 transition-all duration-200 placeholder:text-zinc-400 resize-none tracking-wide"
                    />
                  </Field>
                </div>
              </section>

              {/* Payment Method */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-ultra text-zinc-950 mb-6 pb-3 border-b border-zinc-200">
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      value: "mobile-money",
                      label: "Selcom Lipa Namba",
                      sub: "Pay via M-Pesa, Tigo Pesa, or Airtel Money.",
                    },
                    {
                      value: "cash-on-delivery",
                      label: "Cash on Delivery",
                      sub: "Pay when your order arrives",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={[
                        "flex items-start gap-4 p-4 border cursor-pointer transition-colors duration-150",
                        form.payment === option.value
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-400",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.value}
                        checked={form.payment === option.value}
                        onChange={handleChange}
                        className="mt-0.5 accent-zinc-900 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight text-zinc-950">
                          {option.label}
                        </p>
                        <p className="text-xs text-zinc-500 tracking-wide mt-0.5">
                          {option.sub}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {form.payment === "mobile-money" && (
                  <div className="mt-4 border border-zinc-900 bg-zinc-50 px-4 py-4 space-y-3">
                    <p className="text-[10px] font-bold tracking-ultra uppercase text-zinc-500">
                      Payment Details
                    </p>
                    <div className="flex justify-between items-baseline border-b border-zinc-200 pb-2.5">
                      <span className="text-[10px] tracking-widest uppercase text-zinc-500">Lipa Number</span>
                      <span className="text-sm font-black tracking-tight text-zinc-950">70019014</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] tracking-widest uppercase text-zinc-500">Name</span>
                      <span className="text-sm font-bold text-zinc-900 tracking-wide">Edrick Katabarula</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 tracking-wide leading-relaxed pt-1 border-t border-zinc-200">
                      After placing your order, WhatsApp will open with your invoice. Send your payment screenshot to confirm.
                    </p>
                  </div>
                )}
              </section>

              {/* API error */}
              {apiError && (
                <p className="text-sm text-red-600 tracking-wide border border-red-300 bg-red-50 px-4 py-3">
                  {apiError}
                </p>
              )}

              {/* Place Order — mobile */}
              <div className="lg:hidden">
                <PlaceOrderButton placing={placing} />
              </div>
            </div>

            {/* ══ RIGHT — Order Summary ══ */}
            <div className="lg:sticky lg:top-24 space-y-0 bg-zinc-50 p-6">
              <h2 className="text-xs font-black uppercase tracking-ultra text-zinc-950 mb-6 pb-3 border-b border-zinc-200">
                Order Summary
              </h2>

              {/* Items */}
              <ul className="divide-y divide-zinc-100">
                {items.map((item) => (
                  <li key={`${item.id}-${item.size}-${item.color ?? ""}`} className="flex gap-4 py-4">
                    <div className="relative w-16 h-20 shrink-0 bg-zinc-100 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-950 text-white text-[10px] flex items-center justify-center rounded-full leading-none font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-tight truncate text-zinc-900">
                        {item.name}
                      </p>
                      <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                        Size: {item.size}
                      </p>
                      {item.color && (
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                          Colour: {item.color}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 shrink-0 self-center">
                      {formatTZS(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="pt-4 space-y-3 border-t border-zinc-200">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 tracking-wide">Subtotal</span>
                  <span className="text-zinc-700">{formatTZS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 tracking-wide">Delivery</span>
                  <span className="text-zinc-700">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-bold tracking-wide">Free</span>
                    ) : (
                      formatTZS(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t border-zinc-200 text-zinc-950">
                  <span>Total</span>
                  <span>{formatTZS(total)}</span>
                </div>
              </div>

              {/* Place Order — desktop */}
              <div className="hidden lg:block pt-6">
                <PlaceOrderButton placing={placing} />
              </div>

              <p className="text-[10px] tracking-widest uppercase text-zinc-400 text-center pt-3">
                Secure · No card required
              </p>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}

function PlaceOrderButton({ placing }: { placing: boolean }) {
  return (
    <button
      type="submit"
      disabled={placing}
      className="w-full bg-zinc-950 text-white text-xs font-black tracking-[0.15em] uppercase py-6 px-8 flex items-center justify-center hover:bg-zinc-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {placing ? "Placing Order…" : "Place Order"}
    </button>
  );
}
