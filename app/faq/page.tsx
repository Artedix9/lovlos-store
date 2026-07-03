import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "FAQ — LOVLOS",
  description: "Answers to common questions about ordering, payment, delivery, sizing, and returns at LOVLOS.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I place an order?",
    a: (
      <>
        Add items to your bag, go to checkout, and enter your name, phone number, and city. After placing the order,
        WhatsApp opens with your invoice — that&apos;s where we confirm everything with you. No account needed.
      </>
    ),
  },
  {
    q: "How do I pay?",
    a: (
      <>
        Via <strong className="text-primary">M-Pesa, Tigo Pesa, or Airtel Money</strong> using Selcom Lipa Namba{" "}
        <strong className="text-primary">70019014</strong>, or with <strong className="text-primary">cash on
        delivery</strong>. For mobile money, send your payment screenshot on WhatsApp to confirm the order.
      </>
    ),
  },
  {
    q: "How much is delivery, and how long does it take?",
    a: (
      <>
        Delivery is TZS 5,000 — free on orders above TZS 150,000. Dar es Salaam takes 2–4 business days; other
        regions 4–7. Full details on our{" "}
        <Link href="/shipping" className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200">
          Shipping &amp; Returns
        </Link>{" "}
        page.
      </>
    ),
  },
  {
    q: "Which size should I choose?",
    a: (
      <>
        Check our{" "}
        <Link href="/size-guide" className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200">
          Size Guide
        </Link>{" "}
        for measurements in centimetres. Between sizes? Size up for a relaxed fit — or WhatsApp us and we&apos;ll help.
      </>
    ),
  },
  {
    q: "Can I return or exchange an item?",
    a: (
      <>
        Yes — within 14 days of delivery, as long as the item is unworn with tags attached. Message us on WhatsApp
        with your order ID to start. Exchanges within Dar es Salaam are free.
      </>
    ),
  },
  {
    q: "How do I know my order went through?",
    a: (
      <>
        You&apos;ll get an order ID (like LVL-XXXXXX) on the confirmation page, and our team confirms every order
        personally on WhatsApp before dispatch. You can also check its status any time on{" "}
        <Link href="/track" className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200">
          Track My Order
        </Link>
        .
      </>
    ),
  },
  {
    q: "Do you have a physical store?",
    a: (
      <>
        Not yet — LOVLOS is online-first. Follow us on Instagram{" "}
        <a
          href="https://www.instagram.com/lovlos.official/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
        >
          @lovlos.official
        </a>{" "}
        for pop-up announcements.
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="FAQ"
      intro="Quick answers to the questions we hear most. Can't find yours? WhatsApp us at +255 746 704 036."
    >
      <div className="divide-y divide-mercury border-y border-mercury">
        {FAQS.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-bold tracking-widest uppercase text-primary">
                {item.q}
              </span>
              <span
                className="text-lg leading-none text-chicago transition-transform duration-300 group-open:rotate-45 shrink-0"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <div className="pb-6 text-sm text-mine tracking-wide leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
