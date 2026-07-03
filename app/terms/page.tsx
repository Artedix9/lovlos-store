import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Service — LOVLOS",
  description: "The terms that apply when you shop with LOVLOS.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="By placing an order with LOVLOS you agree to the terms below."
    >
      <InfoSection title="Orders & Confirmation">
        <p>
          An order is confirmed once our team verifies it on WhatsApp — for mobile money orders, after we receive your
          payment screenshot; for cash on delivery, after we confirm your delivery details. We may cancel orders we
          cannot verify or deliver.
        </p>
      </InfoSection>

      <InfoSection title="Pricing & Payment">
        <p>
          All prices are in <strong className="text-primary">Tanzanian Shillings (TZS)</strong> and include VAT where
          applicable. Payment is via M-Pesa, Tigo Pesa, or Airtel Money (Selcom Lipa Namba), or cash on delivery.
          Prices and availability may change without notice; the price at the time you place your order applies.
        </p>
      </InfoSection>

      <InfoSection title="Delivery">
        <p>
          Delivery timelines and fees are described on our{" "}
          <Link
            href="/shipping"
            className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
          >
            Shipping &amp; Returns
          </Link>{" "}
          page. Delivery estimates are made in good faith but are not guaranteed — factors like weather and transport
          availability can affect them.
        </p>
      </InfoSection>

      <InfoSection title="Returns">
        <p>
          Returns and exchanges are accepted within 14 days of delivery under the conditions on our{" "}
          <Link
            href="/shipping"
            className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
          >
            Shipping &amp; Returns
          </Link>{" "}
          page.
        </p>
      </InfoSection>

      <InfoSection title="Content & Brand">
        <p>
          All content on this site — the LOVLOS name, logo, photography, and designs — belongs to LOVLOS and may not
          be reproduced without permission.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Questions about these terms? WhatsApp us at{" "}
          <a
            href="https://wa.me/255746704036"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
          >
            +255 746 704 036
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
