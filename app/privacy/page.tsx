import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy — LOVLOS",
  description: "How LOVLOS collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We keep it simple: we only collect what we need to deliver your order, and we never sell your information."
    >
      <InfoSection title="What We Collect">
        <p>When you place an order, we collect:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Your name and phone number — to arrange delivery and confirm your order on WhatsApp.</li>
          <li>Your email address (optional) — for order updates.</li>
          <li>Your city and delivery note — so our team can find you.</li>
        </ul>
        <p>
          We do <strong className="text-primary">not</strong> collect or store card details. Payments happen directly
          through your mobile money provider or in cash on delivery.
        </p>
      </InfoSection>

      <InfoSection title="How We Use It">
        <ul className="space-y-2 list-disc pl-5">
          <li>To fulfil and deliver your order.</li>
          <li>To contact you on WhatsApp about your order status.</li>
          <li>To send occasional updates about new drops — only if you subscribe to our newsletter.</li>
        </ul>
        <p>We never sell, rent, or share your personal information with third parties for marketing.</p>
      </InfoSection>

      <InfoSection title="Cookies & Local Storage">
        <p>
          Your shopping bag is saved in your browser&apos;s local storage so it&apos;s still there when you come back.
          We don&apos;t use advertising or tracking cookies.
        </p>
      </InfoSection>

      <InfoSection title="Your Rights">
        <p>
          You can ask us to see, correct, or delete the information we hold about you at any time. Message us on
          WhatsApp at{" "}
          <a
            href="https://wa.me/255692928552"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
          >
            +255 692 928 552
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
