"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatTZS } from "@/lib/products";

const WHATSAPP_LINK =
  "https://wa.me/255746704036?text=Hi%20LOVLOS!%20I%20just%20placed%20an%20order.%20Here%20is%20my%20payment%20confirmation%20screenshot.";

/* ── Inner component (reads searchParams) ── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const total = Number(searchParams.get("total") ?? "0");
  const payment = searchParams.get("payment") ?? "mobile-money";
  const region = searchParams.get("region") ?? "Tanzania";
  const isMobileMoney = payment === "mobile-money";
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Minimal top bar */}
      <div className="border-b border-mercury px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" aria-label="LOVLOS home">
          <Image
            src="/SVG/lovlos-logo.svg"
            alt="LOVLOS"
            height={32}
            width={27}
            className="h-8 w-auto"
          />
        </Link>
        <span className="text-[10px] tracking-widest uppercase text-chicago">
          Order Confirmed
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-md space-y-10">

          {/* ── Check mark ── */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#d8e1d5] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#3c4b37" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* ── Heading ── */}
          <div>
            <p className="text-[10px] tracking-ultra uppercase text-chicago mb-2">
              Thank you for your order
            </p>
            <h1 className="font-sans text-4xl md:text-5xl font-black uppercase tracking-tight text-primary leading-none">
              Order<br />Received
            </h1>
          </div>

          {/* ── Confirmation text ── */}
          <div className="space-y-2">
            {orderId && (
              <p className="text-[10px] tracking-ultra uppercase text-chicago">
                Order <span className="text-primary font-bold">{orderId}</span>
              </p>
            )}
            <p className="text-sm text-mine tracking-wide leading-relaxed">
              Your order has been recorded. We&apos;ll reach out via{" "}
              <strong className="text-primary">WhatsApp</strong> to confirm
              delivery to <strong className="text-primary">{region}</strong>.
            </p>
          </div>

          {/* ── Selcom Lipa Namba payment box (shown only for Mobile Money) ── */}
          {isMobileMoney && (
            <div className="bg-zinc-950 text-left px-6 py-6 space-y-5">
              <p className="text-[10px] font-bold tracking-ultra uppercase text-zinc-400">
                Complete Your Payment
              </p>

              {/* Payment details */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-white/[0.08] pb-3">
                  <span className="text-[10px] tracking-widest uppercase text-zinc-500">Method</span>
                  <span className="text-sm font-bold uppercase tracking-tight text-zinc-100">
                    Selcom Lipa Namba
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/[0.08] pb-3">
                  <span className="text-[10px] tracking-widest uppercase text-zinc-500">Lipa Number</span>
                  <span className="text-xl font-black text-white tracking-tight">70019014</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/[0.08] pb-3">
                  <span className="text-[10px] tracking-widest uppercase text-zinc-500">Name</span>
                  <span className="text-sm font-bold text-zinc-100 tracking-wide text-right">
                    Edrick Neckemia<br />Katabarula
                  </span>
                </div>
                {total > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] tracking-widest uppercase text-zinc-500">Amount</span>
                    <span className="text-base font-black text-white tracking-tight">
                      {formatTZS(total)}
                    </span>
                  </div>
                )}
              </div>

              {/* 5-step guide */}
              <div className="border-t border-white/[0.08] pt-5 space-y-3">
                <p className="text-[10px] font-bold tracking-ultra uppercase text-zinc-400">
                  To Complete Your Order
                </p>
                <ol className="space-y-2.5">
                  {[
                    "Dial your Mobile Money menu.",
                    "Choose 'Lipa kwa Selcom' or 'Pay Merchant'.",
                    "Enter Lipa Namba: 70019014.",
                    `Enter Amount: ${total > 0 ? formatTZS(total) : "your order total"}.`,
                    "Send screenshot to WhatsApp to confirm.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 text-zinc-400 text-[10px] font-black flex items-center justify-center leading-none">
                        {i + 1}
                      </span>
                      <span className="text-xs text-zinc-300 tracking-wide leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-3 w-full bg-white text-zinc-950 text-xs font-black tracking-ultra uppercase py-4 hover:bg-zinc-100 transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Payment Screenshot
              </a>
            </div>
          )}

          {/* ── Cash on Delivery message ── */}
          {!isMobileMoney && (
            <div className="bg-smoke border border-mercury px-6 py-5 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-ultra text-primary">
                Cash on Delivery
              </p>
              <p className="text-sm text-mine tracking-wide leading-relaxed">
                Please have <strong>{total > 0 ? formatTZS(total) : "the exact amount"}</strong> ready when your order arrives. Our delivery team will contact you to arrange a convenient time.
              </p>
            </div>
          )}

          {/* ── Back to shop ── */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/" className="btn-primary text-center">
              Continue Shopping
            </Link>
            <Link href="/women" className="btn-outline text-center">
              Browse New Arrivals
            </Link>
          </div>

          <p className="text-[10px] tracking-widest uppercase text-dawn">
            Questions? WhatsApp us at +255 746 704 036
          </p>
        </div>
      </div>
    </main>
  );
}

/* ── Suspense boundary required for useSearchParams in Next.js App Router ── */
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-chicago">Loading…</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
