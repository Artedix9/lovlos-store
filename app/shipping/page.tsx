import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Shipping & Returns — LOVLOS",
  description:
    "LOVLOS delivery times, fees, and returns policy for Dar es Salaam and all of Tanzania.",
};

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Shipping & Returns"
      intro="We deliver across Tanzania. Here is everything you need to know about how your order gets to you — and what to do if it isn't right."
    >
      <InfoSection title="Delivery Times">
        <ul className="space-y-3">
          <li>
            <strong className="text-primary">Dar es Salaam</strong> — 2–4 business days.
          </li>
          <li>
            <strong className="text-primary">Arusha, Mwanza, Dodoma, Zanzibar &amp; other major cities</strong> — 4–7
            business days depending on location.
          </li>
          <li>
            <strong className="text-primary">Upcountry &amp; remote areas</strong> — up to 7 business days. Our team
            will confirm the exact timeline on WhatsApp after you order.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Delivery Fees">
        <p>
          Standard delivery is <strong className="text-primary">TZS 5,000</strong>. Orders above{" "}
          <strong className="text-primary">TZS 150,000</strong> ship free anywhere in Tanzania.
        </p>
      </InfoSection>

      <InfoSection title="Payment">
        <p>
          Pay via <strong className="text-primary">M-Pesa, Tigo Pesa, or Airtel Money</strong> (Selcom Lipa Namba{" "}
          <strong className="text-primary">70019014</strong>) or choose{" "}
          <strong className="text-primary">Cash on Delivery</strong>. After placing an order, WhatsApp opens with your
          invoice — send your payment screenshot there to confirm.
        </p>
      </InfoSection>

      <InfoSection title="Returns & Exchanges">
        <ul className="space-y-3">
          <li>Returns are accepted within <strong className="text-primary">14 days</strong> of delivery.</li>
          <li>Items must be unworn, unwashed, and in their original condition with tags attached.</li>
          <li>
            To start a return or exchange, message us on WhatsApp at{" "}
            <a
              href="https://wa.me/255746704036"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
            >
              +255 746 704 036
            </a>{" "}
            with your order ID (e.g. LVL-XXXXXX) and the reason.
          </li>
          <li>
            Exchanges for a different size or colour are free within Dar es Salaam. For refunds, the delivery fee is
            non-refundable and return transport is covered by the customer unless the item arrived damaged or
            incorrect.
          </li>
          <li>Refunds are sent via mobile money within 3 business days of receiving the returned item.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
