"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { formatTZS } from "@/lib/products";
import { buildWhatsAppUrl, generateOrderId } from "@/lib/orders";
import type { OrderPayload, SavedOrder } from "@/lib/orders";
import { deliveryFeeFor } from "@/lib/delivery";
import { recordOrder, getCheckoutProfile, saveCheckoutProfile } from "@/lib/orderHistory";

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

/* ── Field wrapper — wires label, control, and error together for AT ── */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[10px] font-bold tracking-ultra uppercase text-chicago">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[11px] text-error tracking-wide">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError?: string) =>
  [
    "w-full bg-white border text-sm text-primary px-4 py-3.5 outline-none",
    "placeholder:text-chicago tracking-wide transition-all duration-200",
    hasError
      ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
      : "border-primary focus:border-mine focus:ring-2 focus:ring-primary/10",
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

  /* Returning customers: prefill from the last order's details */
  useEffect(() => {
    const profile = getCheckoutProfile();
    if (profile) {
      setForm((prev) => ({
        ...prev,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        city: profile.city || prev.city,
      }));
    }
  }, []);

  const deliveryFee = deliveryFeeFor(subtotal);
  const total = subtotal + deliveryFee;

  function validate(): FormErrors {
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
    return next;
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
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      /* Move keyboard/AT users straight to the first invalid field */
      const firstInvalid = ["name", "phone", "email"].find(
        (key) => nextErrors[key as keyof FormErrors]
      );
      if (firstInvalid) {
        (document.getElementById(`checkout-${firstInvalid}`) as HTMLElement | null)?.focus();
      }
      return;
    }
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

      /* Remember this order and the customer's details for next time */
      recordOrder({
        id: order.id,
        phone: order.phone,
        total: order.total,
        city: order.city,
        created_at: order.created_at,
      });
      saveCheckoutProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city,
      });

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
          <p className="text-xs font-bold uppercase tracking-ultra text-chicago">Your bag is empty</p>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-primary">Nothing to check out</h1>
          <Link href="/" className="btn-primary mt-4">Continue Shopping</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main id="main-content" className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-14">

          {/* Page title */}
          <div className="mb-10">
            <p className="text-[10px] tracking-ultra uppercase text-chicago font-sans mb-2">
              Almost there
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-primary">
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
                <h2 className="text-xs font-black uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
                  Delivery Information
                </h2>

                <div className="space-y-5">
                  <Field id="checkout-name" label="Full Name *" error={errors.name}>
                    <input
                      id="checkout-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="e.g. Amara Osei"
                      aria-invalid={errors.name ? true : undefined}
                      aria-describedby={errors.name ? "checkout-name-error" : undefined}
                      className={inputCls(errors.name)}
                    />
                  </Field>

                  <Field id="checkout-phone" label="Phone Number *" error={errors.phone}>
                    <input
                      id="checkout-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder="+255 746 704 036"
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
                      className={inputCls(errors.phone)}
                    />
                  </Field>

                  <Field id="checkout-email" label="Email Address (optional)" error={errors.email}>
                    <input
                      id="checkout-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? "checkout-email-error" : undefined}
                      className={inputCls(errors.email)}
                    />
                  </Field>

                  <Field id="checkout-city" label="City / Delivery Area">
                    <div className="relative">
                      <select
                        id="checkout-city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full bg-white border border-primary text-sm text-primary px-4 py-3.5 pr-10 outline-none focus:border-mine focus:ring-2 focus:ring-primary/10 transition-all duration-200 cursor-pointer appearance-none"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {/* Chevron — appearance-none removes the native indicator */}
                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary"
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </Field>

                  <Field id="checkout-note" label="Delivery Note (optional)">
                    <textarea
                      id="checkout-note"
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Landmark, building name, gate colour…"
                      className="w-full bg-white border border-primary text-sm text-primary px-4 py-3.5 outline-none focus:border-mine focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-chicago resize-none tracking-wide"
                    />
                  </Field>
                </div>
              </section>

              {/* Payment Method */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
                  Payment Method
                </h2>

                <div className="space-y-3" role="radiogroup" aria-label="Payment method">
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
                        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1",
                        form.payment === option.value
                          ? "border-primary bg-smoke/60"
                          : "border-mercury hover:border-chicago",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.value}
                        checked={form.payment === option.value}
                        onChange={handleChange}
                        className="mt-0.5 accent-black shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight text-primary">
                          {option.label}
                        </p>
                        <p className="text-xs text-chicago tracking-wide mt-0.5">
                          {option.sub}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {form.payment === "mobile-money" && (
                  <div className="mt-4 border border-primary bg-smoke/60 px-4 py-4 space-y-3">
                    <p className="text-[10px] font-bold tracking-ultra uppercase text-chicago">
                      Payment Details
                    </p>
                    <div className="flex justify-between items-baseline border-b border-mercury pb-2.5">
                      <span className="text-[10px] tracking-widest uppercase text-chicago">Lipa Number</span>
                      <span className="text-sm font-black tracking-tight text-primary">70019014</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] tracking-widest uppercase text-chicago">Name</span>
                      <span className="text-sm font-bold text-primary tracking-wide">Edrick Katabarula</span>
                    </div>
                    <p className="text-[11px] text-chicago tracking-wide leading-relaxed pt-1 border-t border-mercury">
                      After placing your order, WhatsApp will open with your invoice. Send your payment screenshot to confirm.
                    </p>
                  </div>
                )}
              </section>

              {/* API error */}
              {apiError && (
                <p role="alert" className="text-sm text-error tracking-wide border border-error/40 bg-error-tint px-4 py-3">
                  {apiError}
                </p>
              )}

              {/* Place Order — mobile */}
              <div className="lg:hidden">
                <PlaceOrderButton placing={placing} />
              </div>
            </div>

            {/* ══ RIGHT — Order Summary ══ */}
            <div className="lg:sticky space-y-0 bg-smoke/60 p-6" style={{ top: "var(--shell-top)" }}>
              <h2 className="text-xs font-black uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
                Order Summary
              </h2>

              {/* Items */}
              <ul className="divide-y divide-mercury/60">
                {items.map((item) => (
                  <li key={`${item.id}-${item.size}-${item.color ?? ""}`} className="flex gap-4 py-4">
                    <div className="relative w-16 h-20 shrink-0 bg-smoke overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full leading-none font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-tight truncate text-primary">
                        {item.name}
                      </p>
                      {item.preorder && (
                        <p className="text-[9px] tracking-widest uppercase text-chicago">
                          Pre-Order
                        </p>
                      )}
                      <p className="text-[10px] tracking-widest uppercase text-chicago">
                        Size: {item.size}
                      </p>
                      {item.color && (
                        <p className="text-[10px] tracking-widest uppercase text-chicago">
                          Colour: {item.color}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-mine shrink-0 self-center">
                      {formatTZS(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              {items.some((i) => i.preorder) && (
                <p className="text-[11px] text-chicago tracking-wide border border-mercury px-3 py-2.5">
                  Your bag includes pre-order items — they ship when released, and we&apos;ll
                  confirm the expected timing with you on WhatsApp.
                </p>
              )}

              {/* Totals */}
              <div className="pt-4 space-y-3 border-t border-mercury">
                <div className="flex justify-between text-sm">
                  <span className="text-chicago tracking-wide">Subtotal</span>
                  <span className="text-mine">{formatTZS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-chicago tracking-wide">Delivery</span>
                  <span className="text-mine">
                    {deliveryFee === 0 ? (
                      <span className="text-success font-bold tracking-wide">Free</span>
                    ) : (
                      formatTZS(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t border-mercury text-primary">
                  <span>Total</span>
                  <span>{formatTZS(total)}</span>
                </div>
              </div>

              {/* Place Order — desktop */}
              <div className="hidden lg:block pt-6">
                <PlaceOrderButton placing={placing} />
              </div>

              <p className="text-[10px] tracking-widest uppercase text-chicago text-center pt-3">
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
      className="w-full bg-primary text-white text-xs font-black tracking-widest uppercase py-5 px-8 flex items-center justify-center hover:bg-charcoal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {placing ? "Placing Order…" : "Place Order"}
    </button>
  );
}
