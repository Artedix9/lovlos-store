"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { label: "About LOVLOS", href: "/about" },
      { label: "Store Locator", href: "/stores" },
    ],
  },
  {
    heading: "Shop",
    links: [
      { label: "Women", href: "/women" },
      { label: "Men", href: "/men" },
      { label: "Accessories", href: "/accessories" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping & Returns", href: "/shipping" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "FAQ", href: "/faq" },
      { label: "Track My Order", href: "/track" },
    ],
  },
  {
    heading: "Follow Us",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/lovlos.official/" },
      { label: "TikTok", href: "https://www.tiktok.com/@lovlos.official" },
      { label: "Pinterest", href: "https://www.pinterest.com/lovlos/" },
      { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61588690423860" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  }

  return (
    <footer className="bg-primary text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold uppercase tracking-widest">Stay in the vibe.</p>
            <p className="text-xs tracking-widest uppercase text-white/50 mt-1">
              New arrivals, exclusive drops &amp; more.
            </p>
          </div>

          {subscribed ? (
            <div className="flex items-center gap-3 text-sm text-white/70 tracking-wide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              You&apos;re on the list. Good vibes incoming.
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-0 max-w-sm">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 min-w-0 bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm px-4 py-3 outline-none focus-visible:border-white/60 transition-colors duration-200"
              />
              <button
                type="submit"
                className="bg-white text-primary text-xs tracking-widest uppercase px-6 py-3 hover:bg-smoke transition-colors duration-200 shrink-0 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 4-column link grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs tracking-widest uppercase text-white/40 mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-sm text-white/70 hover:text-white transition-colors duration-200 tracking-wide focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" aria-label="LOVLOS home">
            <Image
              src="/SVG/lovlos-logo.svg"
              alt="LOVLOS"
              height={44}
              width={37}
              className="h-11 w-auto brightness-0 invert"
            />
          </Link>
          <div className="flex flex-wrap gap-6 text-xs tracking-widest uppercase text-white/35">
            <Link href="/privacy" className="hover:text-white/60 transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors duration-200">
              Terms of Service
            </Link>
            <span>© {new Date().getFullYear()} LOVLOS — Good Vibes Defined.</span>
          </div>
          <div className="text-xs tracking-widest uppercase text-white/35">
            Prices in TZS
          </div>
        </div>
      </div>
    </footer>
  );
}
