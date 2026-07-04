"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { formatTZS } from "@/lib/products";

/* ── Mega menu data ── */
interface MegaColumn {
  heading: string;
  links: { label: string; href: string }[];
}

/* Subcategory links use the ?type= filter that CategoryShell reads,
   with #products so the grid is scrolled into view on landing. */
const MEGA_MENUS: Record<string, MegaColumn[]> = {
  Women: [
    {
      heading: "Clothing",
      links: [
        { label: "Shop All Women", href: "/women" },
        { label: "Tops & Crop Tops", href: "/women?type=tops#products" },
        { label: "Sports Bras", href: "/women?type=tops#products" },
        { label: "Bottoms", href: "/women?type=bottoms#products" },
        { label: "Outerwear", href: "/women?type=outerwear#products" },
      ],
    },
    {
      heading: "Highlights",
      links: [
        { label: "New Arrivals", href: "/women#products" },
        { label: "Best Sellers", href: "/women#products" },
        { label: "Lookbook", href: "/about" },
      ],
    },
    {
      heading: "Collections",
      links: [
        { label: "'Good Vibes' Essentials", href: "/women" },
      ],
    },
    {
      heading: "Accessories",
      links: [
        { label: "Bags & Totes", href: "/accessories?type=bags#products" },
        { label: "Hats & Caps", href: "/accessories?type=hats#products" },
        { label: "Shop All", href: "/accessories" },
      ],
    },
  ],
  Men: [
    {
      heading: "Clothing",
      links: [
        { label: "Shop All Men", href: "/men" },
        { label: "Tees & Tops", href: "/men?type=tops#products" },
        { label: "Hoodies & Sweatshirts", href: "/men?type=tops#products" },
        { label: "Pants & Shorts", href: "/men?type=bottoms#products" },
        { label: "Outerwear", href: "/men?type=outerwear#products" },
      ],
    },
    {
      heading: "Highlights",
      links: [
        { label: "New Arrivals", href: "/men#products" },
        { label: "Best Sellers", href: "/men#products" },
        { label: "Lookbook", href: "/about" },
      ],
    },
    {
      heading: "Collections",
      links: [
        { label: "'Good Vibes' Essentials", href: "/men" },
      ],
    },
    {
      heading: "Accessories",
      links: [
        { label: "Bags & Totes", href: "/accessories?type=bags#products" },
        { label: "Hats & Caps", href: "/accessories?type=hats#products" },
        { label: "Lifestyle", href: "/accessories?type=lifestyle#products" },
        { label: "Shop All", href: "/accessories" },
      ],
    },
  ],
  Accessories: [
    {
      heading: "Bags",
      links: [
        { label: "Shop All Accessories", href: "/accessories" },
        { label: "Canvas Tote Bags", href: "/accessories?type=bags#products" },
        { label: "Crossbody Bags", href: "/accessories?type=bags#products" },
        { label: "Backpacks", href: "/accessories?type=bags#products" },
      ],
    },
    {
      heading: "Hats & Caps",
      links: [
        { label: "Structured Caps", href: "/accessories?type=hats#products" },
        { label: "Beanies", href: "/accessories?type=hats#products" },
        { label: "Bucket Hats", href: "/accessories?type=hats#products" },
      ],
    },
    {
      heading: "Lifestyle",
      links: [
        { label: "Socks", href: "/accessories?type=lifestyle#products" },
        { label: "Belts", href: "/accessories?type=lifestyle#products" },
        { label: "Watches", href: "/accessories?type=lifestyle#products" },
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
  { label: "Wishlist", href: "/wishlist" },
  { label: "My Orders", href: "/orders" },
  { label: "About", href: "/about" },
];

const TRANSITION_MS = 300;

/* ── Search index entry served by /api/products ── */
interface SearchEntry {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
}

/* ── Mega menu panel ── */
function MegaMenu({ columns, onNavigate }: { columns: MegaColumn[]; onNavigate: () => void }) {
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
                    onClick={onNavigate}
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
  const [searchIndex, setSearchIndex] = useState<SearchEntry[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const menuRef = useFocusTrap<HTMLElement>(menuOpen, () => setMenuOpen(false));

  const { openCart, totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  /* Keyboard support for the mega menu: close when focus leaves the header,
     close on Escape and return focus to the trigger link. */
  useEffect(() => {
    if (!activeMenu) return;

    function onFocusIn(e: FocusEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        const trigger = activeMenu ? triggerRefs.current[activeMenu] : null;
        setActiveMenu(null);
        trigger?.focus();
      }
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeMenu]);

  /* Lazily fetch the product index the first time search opens */
  useEffect(() => {
    if (!searchOpen || searchIndex !== null) return;
    let cancelled = false;
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchEntry[]) => { if (!cancelled) setSearchIndex(data); })
      .catch(() => { if (!cancelled) setSearchIndex([]); });
    return () => { cancelled = true; };
  }, [searchOpen, searchIndex]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    searchButtonRef.current?.focus();
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !searchIndex) return [];
    return searchIndex
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, searchIndex]);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-white text-center py-2">
        <p className="text-xs tracking-widest uppercase">
          Free delivery on orders above TZS 150,000
        </p>
      </div>

      {/* Main Header */}
      <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-mercury">
        <div className="grid grid-cols-3 items-center h-14 md:h-16 px-4 md:px-10 lg:px-16">

          {/* Col 1 — Hamburger (mobile) | Left nav (desktop) */}
          <div className="flex items-center gap-7">
            {/* Hamburger — mobile only */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden text-primary hover:text-chicago transition-colors duration-200 p-2 -ml-2"
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
                      ref={(el) => { triggerRefs.current[item.label] = el; }}
                      onFocus={() => hasMega && openMega(item.label)}
                      aria-expanded={hasMega ? activeMenu === item.label : undefined}
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
          <div className="flex items-center justify-end gap-2 md:gap-7">
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary right navigation">
              {NAV_RIGHT.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search — available on all viewports */}
            <button
              ref={searchButtonRef}
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              className="text-primary hover:text-chicago transition-colors duration-200 p-2"
            >
              <IconSearch />
            </button>

            {/* My Orders */}
            <Link
              href="/orders"
              aria-label="My orders"
              className="text-primary hover:text-chicago transition-colors duration-200 p-2 hidden sm:block"
            >
              <IconParcel />
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` : ""}`}
              className="relative text-primary hover:text-chicago transition-colors duration-200 p-2 hidden sm:block"
            >
              <IconHeart />
              {wishlistCount > 0 && (
                <span
                  className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none"
                  aria-hidden="true"
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              aria-label={`Open shopping bag${totalItems > 0 ? `, ${totalItems} ${totalItems === 1 ? "item" : "items"}` : ""}`}
              onClick={openCart}
              className="relative text-primary hover:text-chicago transition-colors duration-200 p-2 -mr-2"
            >
              <IconBag />
              {totalItems > 0 && (
                <span
                  className={[
                    "absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none transition-transform",
                    badgePop ? "scale-125" : "scale-100",
                  ].join(" ")}
                  style={{ transitionDuration: "200ms" }}
                  aria-hidden="true"
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search drawer — all viewports, Escape closes */}
        {searchOpen && (
          <div
            className="border-t border-mercury bg-white"
            onKeyDown={(e) => { if (e.key === "Escape") closeSearch(); }}
          >
            <div className="max-w-xl mx-auto px-4 md:px-6 py-4">
              <div className="flex items-center gap-3 border-b border-primary pb-2">
                <IconSearch className="text-chicago shrink-0" />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search LOVLOS..."
                  aria-label="Search products"
                  className="w-full text-sm text-primary placeholder:text-chicago bg-transparent outline-none tracking-wide"
                />
                <button
                  onClick={closeSearch}
                  className="text-xs tracking-widest uppercase text-chicago hover:text-primary transition-colors duration-200 shrink-0 p-1"
                >
                  Close
                </button>
              </div>

              {/* Live results */}
              {searchQuery.trim() && (
                <div aria-live="polite">
                  {searchResults.length > 0 ? (
                    <ul className="py-3 divide-y divide-smoke">
                      {searchResults.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.id}`}
                            onClick={closeSearch}
                            className="flex items-center gap-4 py-2.5 group"
                          >
                            <div className="relative w-10 h-12 shrink-0 bg-smoke overflow-hidden">
                              {p.image && (
                                <Image
                                  src={p.image}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover object-top"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-primary group-hover:text-chicago transition-colors duration-150 truncate tracking-wide">
                                {p.name}
                              </p>
                              <p className="text-[10px] tracking-widest uppercase text-chicago">
                                {p.category}
                              </p>
                            </div>
                            <p className="text-xs text-chicago tracking-wide shrink-0">
                              {formatTZS(p.price)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-5 text-sm text-chicago tracking-wide text-center">
                      {searchIndex === null
                        ? "Searching…"
                        : `No results for “${searchQuery.trim()}”.`}
                    </p>
                  )}
                </div>
              )}
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
              <MegaMenu
                key={activeMenu}
                columns={MEGA_MENUS[activeMenu]}
                onNavigate={() => setActiveMenu(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Page backdrop when mega menu is open — desktop only.
          Sits below the z-50 header, so the header stays interactive. */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            key="mega-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed inset-0 z-30 bg-black/25"
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
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            className={[
              "fixed left-0 top-0 h-full w-[80vw] max-w-[320px] z-[85]",
              "bg-primary flex flex-col",
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
                className="text-white/60 hover:text-white transition-colors duration-200 p-2 -mr-2"
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
                    className="flex items-center justify-between px-6 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-colors duration-150 border-b border-white/[0.06]"
                  >
                    {item.label}
                    <span className="text-white/40" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="px-6 py-5 border-t border-white/[0.08]">
              <p className="text-[10px] tracking-ultra uppercase text-white/50">
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

function IconParcel({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconHeart({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
