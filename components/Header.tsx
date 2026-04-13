"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

const NAV_LEFT = [
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Accessories", href: "/accessories" },
];

const NAV_RIGHT = [
  { label: "About", href: "/about" },
];

const MOBILE_NAV = [
  { label: "Home", href: "/" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Accessories", href: "/accessories" },
  { label: "About", href: "/about" },
];

const TRANSITION_MS = 300;

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const { openCart, totalItems } = useCart();

  /* Mount/unmount mobile menu with animation window */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (menuOpen) {
      setMenuMounted(true);
    } else {
      t = setTimeout(() => setMenuMounted(false), TRANSITION_MS);
    }
    return () => clearTimeout(t);
  }, [menuOpen]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-white text-center py-2">
        <p className="text-xs tracking-widest uppercase">
          Free delivery on orders above TZS 150,000
        </p>
      </div>

      {/* Main Header — 3-column grid keeps logo perfectly centred */}
      <header className="sticky top-0 z-50 bg-white border-b border-mercury">
        <div className="grid grid-cols-3 items-center h-14 md:h-16 px-4 md:px-10 lg:px-16">

          {/* Col 1 — Hamburger (mobile) | Left nav (desktop) */}
          <div className="flex items-center gap-7">
            {/* Hamburger — mobile only */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden text-primary hover:text-chicago transition-colors duration-200 p-1 -ml-1"
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </button>

            {/* Desktop left nav */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary left navigation">
              {NAV_LEFT.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 2 — Logo (always centred) */}
          <div className="flex justify-center">
            <Link href="/" aria-label="LOVLOS home">
              <Image
                src="/SVG/lovlos-logo.svg"
                alt="LOVLOS"
                height={36}
                width={30}
                className="h-8 md:h-9 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Col 3 — Right nav (desktop) + icons */}
          <div className="flex items-center justify-end gap-4 md:gap-7">
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary right navigation">
              {NAV_RIGHT.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search — hidden on mobile to keep header clean */}
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden md:block text-primary hover:text-chicago transition-colors duration-200"
            >
              <IconSearch />
            </button>

            {/* Cart — always visible */}
            <button
              aria-label="Open shopping bag"
              onClick={openCart}
              className="relative text-primary hover:text-chicago transition-colors duration-200 p-1 -mr-1"
            >
              <IconBag />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Drawer — desktop only */}
        {searchOpen && (
          <div className="hidden md:block border-t border-mercury bg-white">
            <div className="max-w-xl mx-auto px-6 py-4">
              <div className="flex items-center gap-3 border-b border-primary pb-2">
                <IconSearch className="text-dawn shrink-0" />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search LOVLOS..."
                  className="w-full text-sm text-primary placeholder:text-dawn bg-transparent outline-none tracking-wide"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-xs tracking-widest uppercase text-chicago hover:text-primary transition-colors duration-200 shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ Mobile Nav Drawer ══ */}
      {menuMounted && (
        <>
          {/* Overlay */}
          <div
            aria-hidden="true"
            onClick={closeMenu}
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            className={[
              "fixed inset-0 z-[80] bg-black/60 transition-opacity md:hidden",
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
          />

          {/* Panel — slides from left */}
          <nav
            aria-label="Mobile navigation"
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            className={[
              "fixed left-0 top-0 h-full w-[80vw] max-w-[320px] z-[85]",
              "bg-zinc-950 flex flex-col",
              "transition-transform ease-in-out md:hidden",
              menuOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <Link href="/" onClick={closeMenu} aria-label="LOVLOS home">
                <Image
                  src="/SVG/lovlos-logo.svg"
                  alt="LOVLOS"
                  height={32}
                  width={27}
                  className="h-8 w-auto brightness-0 invert"
                />
              </Link>
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
              >
                <IconX />
              </button>
            </div>

            {/* Nav links */}
            <ul className="flex-1 overflow-y-auto py-4">
              {MOBILE_NAV.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center justify-between px-6 py-4 text-sm font-bold uppercase tracking-widest text-zinc-100 hover:text-white hover:bg-white/5 transition-colors duration-150 border-b border-white/[0.06]"
                  >
                    {item.label}
                    <span className="text-zinc-600" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Drawer footer */}
            <div className="px-6 py-5 border-t border-white/[0.08]">
              <p className="text-[10px] tracking-ultra uppercase text-zinc-600">
                Good vibes defined.
              </p>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

/* ── SVG Icons ── */

function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}


function IconBag({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
