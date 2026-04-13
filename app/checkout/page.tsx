"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { formatTZS } from "@/lib/products";

const REGIONS = [
  { value: "dar-es-salaam", label: "Dar es Salaam" },
  { value: "arusha",        label: "Arusha" },
  { value: "mwanza",        label: "Mwanza" },
  { value: "dodoma",        label: "Dodoma" },
  { value: "zanzibar",      label: "Zanzibar" },
  { value: "other",         label: "Other" },
];

const DELIVERY_FEE = 5000; // TZS — waived above 150,000
const FREE_DELIVERY_THRESHOLD = 150000;

interface FormState {
  name: string;
  phone: string;
  region: string;
  note: string;
  payment: "mobile-money" | "cash-on-delivery";
}

interface FormErrors {
  name?: string;
  phone?: string;
}

function InputField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-widest uppercase text-chicago">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-[#b00020] tracking-wide">{error}</p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, closeCart } = useCart();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    region: "dar-es-salaam",
    note: "",
    payment: "mobile-money",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [placing, setPlacing] = useState(false);

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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setPlacing(true);
    /* Simulate async order recording — replace with real API call */
    await new Promise((r) => setTimeout(r, 600));
    clearCart();
    closeCart();
    router.push(
      `/success?total=${total}&payment=${form.payment}&region=${encodeURIComponent(
        REGIONS.find((r) => r.value === form.region)?.label ?? form.region
      )}`
    );
  }

  /* ── Empty cart guard ── */
  if (items.length === 0 && !placing) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-ultra text-chicago">Your bag is empty</p>
          <h1 className="font-sans text-3xl font-black uppercase tracking-tight">Nothing to check out</h1>
          <Link href="/" className="btn-primary mt-4">Continue Shopping</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-14">

        {/* Page title */}
        <h1 className="font-sans text-2xl font-black uppercase tracking-tight mb-10">
          Checkout
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start"
        >
          {/* ══ LEFT — Delivery & Payment ══ */}
          <div className="space-y-10">

            {/* Delivery Info */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
                Delivery Information
              </h2>

              <div className="space-y-5">
                <InputField label="Full Name *" error={errors.name}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    placeholder="e.g. Amara Osei"
                    className={[
                      "border text-sm px-4 py-3 w-full outline-none transition-colors duration-200 bg-white",
                      errors.name ? "border-[#b00020]" : "border-mercury focus:border-primary",
                    ].join(" ")}
                  />
                </InputField>

                <InputField label="Phone Number *" error={errors.phone}>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="+255 746 704 036"
                    className={[
                      "border text-sm px-4 py-3 w-full outline-none transition-colors duration-200 bg-white",
                      errors.phone ? "border-[#b00020]" : "border-mercury focus:border-primary",
                    ].join(" ")}
                  />
                </InputField>

                <InputField label="Region">
                  <select
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className="border border-mercury text-sm px-4 py-3 w-full outline-none focus:border-primary transition-colors duration-200 bg-white appearance-none cursor-pointer"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Delivery Note (optional)">
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Landmark, building name, gate colour…"
                    className="border border-mercury text-sm px-4 py-3 w-full outline-none focus:border-primary transition-colors duration-200 bg-white resize-none"
                  />
                </InputField>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
                Payment Method
              </h2>

              <div className="space-y-3">
                {[
                  {
                    value: "mobile-money",
                    label: "Mobile Money",
                    sub: "M-Pesa · Tigo Pesa · Airtel Money",
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
                        ? "border-primary bg-smoke"
                        : "border-mercury hover:border-dawn",
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
                <div className="mt-4 bg-smoke border border-mercury px-4 py-3">
                  <p className="text-xs text-mine tracking-wide leading-relaxed">
                    After placing your order, you will be shown the M-Pesa payment details and a WhatsApp link to send your screenshot.
                  </p>
                </div>
              )}
            </section>

            {/* Place Order — mobile CTA (shown below form on small screens, hidden on desktop) */}
            <div className="lg:hidden">
              <PlaceOrderButton placing={placing} />
            </div>
          </div>

          {/* ══ RIGHT — Order Summary ══ */}
          <div className="lg:sticky lg:top-24 space-y-0">
            <h2 className="text-xs font-bold uppercase tracking-ultra text-primary mb-6 pb-3 border-b border-mercury">
              Order Summary
            </h2>

            {/* Items */}
            <ul className="divide-y divide-mercury">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}`} className="flex gap-4 py-4">
                  <div className="relative w-16 h-20 shrink-0 bg-smoke overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full leading-none">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-tight truncate">{item.name}</p>
                    <p className="text-[10px] tracking-widest uppercase text-chicago">
                      Size: {item.size}
                    </p>
                  </div>
                  <p className="text-sm text-primary shrink-0 self-center">
                    {formatTZS(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="pt-4 space-y-3 border-t border-mercury">
              <div className="flex justify-between text-sm">
                <span className="text-chicago tracking-wide">Subtotal</span>
                <span>{formatTZS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-chicago tracking-wide">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-[#758e6d] font-bold tracking-wide">Free</span>
                  ) : (
                    formatTZS(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-black uppercase tracking-tight pt-2 border-t border-mercury">
                <span>Total</span>
                <span>{formatTZS(total)}</span>
              </div>
            </div>

            {/* Place Order — desktop CTA */}
            <div className="hidden lg:block pt-6">
              <PlaceOrderButton placing={placing} />
            </div>

            <p className="text-[10px] tracking-widest uppercase text-dawn text-center pt-3">
              Secure · No card required
            </p>
          </div>
        </form>
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
      className="w-full bg-zinc-950 text-white text-xs font-bold tracking-ultra uppercase py-4 hover:bg-zinc-800 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {placing ? "Placing Order…" : "Place Order →"}
    </button>
  );
}
