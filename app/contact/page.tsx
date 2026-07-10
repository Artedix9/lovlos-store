import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Contact Us — LOVLOS",
  description: "Get in touch with LOVLOS on WhatsApp, phone, or social media.",
};

const SOCIALS = [
  { label: "Instagram", handle: "@lovlos.official", href: "https://www.instagram.com/lovlos.official/" },
  { label: "TikTok", handle: "@lovlos.official", href: "https://www.tiktok.com/@lovlos.official" },
  { label: "Pinterest", handle: "lovlos", href: "https://www.pinterest.com/lovlos/" },
  { label: "Facebook", handle: "LOVLOS", href: "https://www.facebook.com/profile.php?id=61588690423860" },
];

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Contact Us"
      intro="The fastest way to reach us is WhatsApp — orders, sizing help, returns, anything. We usually reply within the hour during business hours."
    >
      {/* WhatsApp CTA card */}
      <div className="bg-primary px-6 py-8 text-center space-y-4">
        <p className="text-[10px] font-bold tracking-ultra uppercase text-white/70">
          WhatsApp — fastest response
        </p>
        <p className="text-2xl font-black text-white tracking-tight">+255 692 928 552</p>
        <a
          href="https://wa.me/255692928552?text=Hi%20LOVLOS!%20I%20have%20a%20question."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-white text-primary text-xs font-black tracking-ultra uppercase py-4 px-8 hover:bg-smoke transition-colors duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat on WhatsApp
        </a>
        <p className="text-[10px] tracking-widest uppercase text-white/50">
          Mon–Sat · 9:00–18:00 EAT
        </p>
      </div>

      <InfoSection title="Follow Us">
        <ul className="space-y-3">
          {SOCIALS.map((s) => (
            <li key={s.label} className="flex items-baseline justify-between gap-4">
              <span className="text-[10px] font-bold tracking-ultra uppercase text-chicago">{s.label}</span>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
              >
                {s.handle}
              </a>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Orders & Returns">
        <p>
          For anything about an existing order, include your order ID (e.g. LVL-XXXXXX) in your message so we can
          find it right away.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
