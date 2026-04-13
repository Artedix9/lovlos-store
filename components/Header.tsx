"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

/* ── Mega menu data ── */
interface MegaColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const MEGA_MENUS: Record<string, MegaColumn[]> = {
  Women: [
    {
      heading: "Clothing",
      links: [
        { label: "Shop All Women", href: "/women" },
        { label: "Tops & Crop Tops", href: "/women/tops" },
        { label: "Long Sleeves", href: "/women/long-sleeves" },
        { label: "Sports Bras", href: "/women/sports-bras" },
        { label: "Bottoms", href: "/women/bottoms" },
        { label: "Outerwear", href: "/women/outerwear" },
      ],
    },
    {
      heading: "Highlights",
      links: [
        { label: "New Arrivals", href: "/women" },
        { label: "Best Sellers", href: "/women" },
        { label: "Lookbook", href: "/about" },
      ],
    },
    {
      heading: "Collections",
      links: [
        { label: "'Good Vibes' Essentials", href: "/women" },
        { label: "Studio Collection", href: "/women/studio" },
        { label: "Technical Gear", href: "/women/studio" },
      ],
    },
    {
      heading: "Accessories",
      links: [
        { label: "Bags & Totes", href: "/accessories/bags" },
        { label: "Hats & Caps", href: "/accessories/hats" },
        { label: "Yoga & Studio", href: "/accessories/yoga" },
        { label: "Shop All", href: "/accessories" },
      ],
    },
  ],
  Men: [
    {
      heading: "Clothing",
      links: [
        { label: "Shop All Men", href: "/men" },
        { label: "Tees & Tops", href: "/men/tops" },
        { label: "Hoodies & Sweatshirts", href: "/men/tops" },
        { label: "Pants & Joggers", href: "/men/bottoms" },
        { label: "Shorts", href: "/men/bottoms" },
        { label: "Outerwear", href: "/men/outerwear" },
      ],
    },
    {
      heading: "Highlights",
      links: [
        { label: "New Arrivals", href: "/men" },
        { label: "Best Sellers", href: "/men" },
        { label: "Lookbook", href: "/about" },
      ],
    },
    {
      heading: "Collections",
      links: [
        { label: "'Good Vibes' Essentials", href: "/men" },
        { label: "Studio Collection", href: "/men/studio" },
        { label: "Technical Gear", href: "/men/studio" },
      ],
    },
    {
      heading: "Accessories",
      links: [
        { label: "Bags & Totes", href: "/accessories/bags" },
        { label: "Hats & Caps", href: "/accessories/hats" },
        { label: "Lifestyle", href: "/accessories/lifestyle" },
        { label: "Shop All", href: "/accessories" },
      ],
    },
  ],
  Accessories: [
    {
      heading: "Bags",
      links: [
        { label: "Shop All Accessories", href: "/accessories" },
        { label: "Canvas Tote Bags", href: "/accessories/bags" },
        { label: "Crossbody Bags", href: "/accessories/bags" },
        { label: "Backpacks", href: "/accessories/bags" },
      ],
    },
    {
      heading: "Hats & Caps",
      links: [
        { label: "Structured Caps", href: "/accessories/hats" },
        { label: "Beanies", href: "/accessories/hats" },
        { label: "Bucket Hats", href: "/accessories/hats" },
      ],
    },
    {
      heading: "Yoga & Studio",
      links: [
        { label: "Yoga Mats", href: "/accessories/yoga" },
        { label: "Water Bottles", href: "/accessories/yoga" },
        { label: "Resistance Bands", href: "/accessories/yoga" },
      ],
    },
    {
      heading: "Lifestyle",
      links: [
        { label: "Socks", href: "/accessories/lifestyle" },
        { label: "Belts", href: "/accessories/lifestyle" },
        { label: "Watches", href: "/accessories/lifestyle" },
      ],
    },
  ],
};

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

/* ── Mega menu panel ── */
function MegaMenu({ columns }: { columns: MegaColumn[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full left-0 w-full bg-white border-t border-mercury shadow-lg z-40"
    >
      <div className="max-w-7xl mx-auto px-10 lg:px-16 py-10 grid grid-cols-4 gap-10">
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-[10px] font-bold tracking-ultra uppercase text-charcoal mb-5">
              {col.heading}
            </p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-mine tracking-wide hover:text-primary transition-colors duration-150 font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { openCart, totalItems } = useCart();
  const prevTotalRef = useRef(totalItems);

  /* Badge pop animation */
  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setBadgePop(true);
      const t = setTimeout(() => setBadgePop(false), 400);
      prevTotalRef.current = totalItems;
      return () => clearTimeout(t);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  /* Mobile menu mount/unmount */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (menuOpen) {
      setMenuMounted(true);
    } else {
      t = setTimeout(() => setMenuMounted(false), TRANSITION_MS);
    }
    return () => clearTimeout(t);
  }, [menuOpen]);

  /* Lock body scroll for mobile menu */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function closeMenu() { setMenuOpen(false); }

  /* Hover intent — small delay prevents flickering on quick mouse passes */
  const openMega = useCallback((label: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveMenu(label);
  }, []);

  const closeMega = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const stayOpen = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-white text-center py-2">
        <p className="text-xs tracking-widest uppercase">
          Free delivery on orders above TZS 150,000
        </p>
      </div>

      {/* Main Header */}
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

            {/* Desktop left nav with mega menu triggers */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary left navigation">
              {NAV_LEFT.map((item) => {
                const hasMega = item.label in MEGA_MENUS;
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => hasMega && openMega(item.label)}
                    onMouseLeave={closeMega}
                  >
                    <Link
                      href={item.href}
                      className={[
                        "nav-link transition-colors duration-200",
                        activeMenu === item.label ? "text-primary" : "",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Col 2 — Logo */}
          <div className="flex justify-center">
            <Link href="/" aria-label="LOVLOS home" onClick={() => setActiveMenu(null)}>
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

          {/* Col 3 — Right nav + icons */}
          <div className="flex items-center justify-end gap-4 md:gap-7">
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary right navigation">
              {NAV_RIGHT.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search */}
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden md:block text-primary hover:text-chicago transition-colors duration-200"
            >
              <IconSearch />
            </button>

            {/* Cart */}
            <button
              aria-label="Open shopping bag"
              onClick={openCart}
              className="relative text-primary hover:text-chicago transition-colors duration-200 p-1 -mr-1"
            >
              <IconBag />
              {totalItems > 0 && (
                <span
                  className={[
                    "absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none transition-transform",
                    badgePop ? "scale-125" : "scale-100",
                  ].join(" ")}
                  style={{ transitionDuration: "200ms" }}
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search drawer */}
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

        {/* Mega menu — desktop only, rendered inside sticky header so it stacks correctly */}
        <div
          className="hidden md:block"
          onMouseEnter={stayOpen}
          onMouseLeave={closeMega}
        >
          <AnimatePresence>
            {activeMenu && MEGA_MENUS[activeMenu] && (
              <MegaMenu key={activeMenu} columns={MEGA_MENUS[activeMenu]} />
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Page backdrop when mega menu is open — desktop only */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            key="mega-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed inset-0 z-30 bg-black/25"
            style={{ top: "calc(var(--header-height, 0px))" }}
            onClick={() => setActiveMenu(null)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ══ Mobile Nav Drawer ══ */}
      {menuMounted && (
        <>
          <div
            aria-hidden="true"
            onClick={closeMenu}
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            className={[
              "fixed inset-0 z-[80] bg-black/60 transition-opacity md:hidden",
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
          />

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
