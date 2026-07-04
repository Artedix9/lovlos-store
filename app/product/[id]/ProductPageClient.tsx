"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatTZS, effectivePrice, type PDPProduct, type ProductColor } from "@/lib/products";
import type { Review } from "@/lib/reviews";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useFocusTrap } from "@/lib/useFocusTrap";
import SizeGuideModal from "@/components/SizeGuideModal";
import ProductCard, { type Product } from "@/components/ProductCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import WishlistButton from "@/components/WishlistButton";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";

/* ── Accordion — CSS Grid rows animation (no arbitrary maxHeight) ── */
function AccordionItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-mercury">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left group"
        aria-expanded={open}
      >
        <span className="text-xs tracking-widest uppercase text-primary group-hover:text-chicago transition-colors duration-200">
          {label}
        </span>
        <span
          className="text-lg leading-none text-chicago transition-transform duration-300 ease-in-out"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>

      {/* CSS Grid rows animation — collapses to 0fr without arbitrary maxHeight */}
      <div
        className="grid transition-all duration-400 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-sm text-mine leading-relaxed tracking-wide">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Lightbox ── */
function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  /* Traps Tab on the close button, closes on Escape, restores focus on exit */
  const trapRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      ref={trapRef}
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] bg-primary/95 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Product image lightbox"
    >
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-5 right-6 text-white/40 hover:text-white transition-colors duration-200 z-10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <motion.div
        key="lightbox-image"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-xl max-h-[90vh] aspect-[3/4]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 95vw, 600px"
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Star rating row ── */
function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} tracking-[0.15em] text-primary`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-mercury">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

/* ── Write-a-review form ── */
function ReviewForm({ productId }: { productId: string }) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Please select a star rating.");
      setState("error");
      return;
    }
    setState("sending");
    try {
      const form = new FormData();
      form.append("productId", productId);
      form.append("author", author);
      form.append("rating", String(rating));
      form.append("body", body);
      if (photo) form.append("photo", photo);
      const res = await fetch("/api/reviews", { method: "POST", body: form });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setErrorMsg(json?.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErrorMsg("Connection problem — please check your network and try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-mercury p-6 text-center">
        <p className="text-xs tracking-widest uppercase text-primary mb-1">Thank you ✓</p>
        <p className="text-xs text-chicago leading-relaxed">
          Your review has been submitted and will appear once it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-mercury p-6 space-y-4">
      <p className="text-xs tracking-widest uppercase text-primary">Write a Review</p>

      {/* Star picker */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => { setRating(n); if (state === "error") setState("idle"); }}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            className={`text-2xl leading-none transition-colors duration-100 ${
              n <= (hoverRating || rating) ? "text-primary" : "text-mercury"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Your name"
        required
        maxLength={60}
        className="w-full border border-mercury px-3 py-3 text-sm focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-alto"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="How's the fit, the fabric, the vibe?"
        required
        maxLength={1000}
        rows={4}
        className="w-full border border-mercury px-3 py-3 text-sm focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-alto resize-none"
      />

      {/* Optional photo */}
      <div className="flex items-center gap-3">
        <label className="text-xs tracking-widest uppercase text-chicago underline underline-offset-2 cursor-pointer hover:text-primary transition-colors duration-200">
          {photo ? "Change photo" : "Add a photo (optional)"}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {photo && (
          <span className="text-xs text-chicago truncate max-w-[180px]">
            {photo.name}
            <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo" className="ml-2 text-primary">×</button>
          </span>
        )}
      </div>

      {state === "error" && (
        <p role="alert" className="text-xs text-error tracking-wide">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-primary w-full sm:w-auto disabled:opacity-50"
      >
        {state === "sending" ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

/* ── Back-in-stock notify form (sold-out products) ── */
function RestockNotifyForm({ productId }: { productId: string }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function fail(msg: string) {
    setErrorMsg(msg);
    setState("error");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 9) {
      fail("Please enter a valid phone number and try again.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, phone }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        fail(json?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("done");
    } catch {
      fail("Connection problem — please check your network and try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-mercury p-5 mt-3 text-center">
        <p className="text-xs tracking-widest uppercase text-primary mb-1">You&apos;re on the list ✓</p>
        <p className="text-xs text-chicago leading-relaxed">
          We&apos;ll message you on WhatsApp as soon as it&apos;s back in stock.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-mercury p-5 mt-3">
      <p className="text-xs tracking-widest uppercase text-primary mb-1">Want it when it&apos;s back?</p>
      <p className="text-xs text-chicago leading-relaxed mb-3">
        Leave your WhatsApp number and we&apos;ll message you when it&apos;s restocked.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); if (state === "error") setState("idle"); }}
          placeholder="e.g. 0712 345 678"
          aria-label="WhatsApp number"
          required
          className="flex-1 min-w-0 border border-mercury px-3 py-3 text-sm focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-alto"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-primary text-white text-[11px] tracking-widest uppercase px-5 hover:bg-charcoal transition-colors duration-200 disabled:opacity-50"
        >
          {state === "sending" ? "..." : "Notify Me"}
        </button>
      </form>
      {state === "error" && (
        <p role="alert" className="mt-2 text-xs text-error tracking-wide">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

/* ── Main interactive PDP ── */
export default function ProductPageClient({
  product,
  related = [],
  reviews = [],
  styledWith = [],
}: {
  product: PDPProduct;
  related?: Product[];
  reviews?: Review[];
  styledWith?: Product[];
}) {
  const { addItem, openCart } = useCart();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors?.[0] ?? null
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const atcRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const heroImage = selectedColor?.image ?? product.images[0] ?? "";

  /* undefined stock (e.g. bundled fallback data) means "don't gate" */
  const soldOut = !product.isComingSoon && product.stock !== undefined && product.stock <= 0;
  const lowStock = !product.isComingSoon && product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const price = effectivePrice(product);
  const onSale = price < product.price;

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  /* Sticky mobile bar appears once the main Add to Bag scrolls out of view */
  useEffect(() => {
    if (product.isComingSoon || soldOut) return;
    const el = atcRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.isComingSoon, soldOut]);

  /* Log this product for the "Recently Viewed" strip */
  useEffect(() => {
    recordRecentlyViewed({
      id: product.id,
      name: product.name,
      price: effectivePrice(product),
      image: product.colors?.[0]?.image ?? product.images[0] ?? "",
    });
  }, [product]);

  const sortedImages = useMemo(
    () => [heroImage, ...product.images.filter((src) => src !== heroImage)],
    [heroImage, product.images]
  );

  /* Sync carousel to active slide on color change */
  useEffect(() => {
    setActiveSlide(0);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: "instant" });
    }
  }, [selectedColor]);

  function handleCarouselScroll() {
    if (!carouselRef.current) return;
    const idx = Math.round(
      carouselRef.current.scrollLeft / carouselRef.current.clientWidth
    );
    setActiveSlide(idx);
  }

  function scrollToSlide(idx: number) {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({
      left: idx * carouselRef.current.clientWidth,
      behavior: "smooth",
    });
    setActiveSlide(idx);
  }

  function handleAddToBag() {
    if (!selectedSize && product.sizes.length > 1) {
      setSizeError(true);
      sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      size: selectedSize ?? product.sizes[0] ?? "One Size",
      color: selectedColor?.name,
      price,
      image: heroImage,
      maxStock: product.stock,
    });
    openCart();
    showToast(
      `${product.name}${selectedColor ? ` — ${selectedColor.name}` : ""} added to bag.`
    );
    setSizeError(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <>
      <Header />

      <main id="main-content">
        {/* max-w cap keeps product imagery sane on ultra-wide monitors */}
        <div className="mx-auto max-w-screen-2xl lg:grid lg:grid-cols-2 lg:min-h-screen">

          {/* ══ LEFT — Images ══ */}
          <div>
            {/* Mobile: horizontal scroll-snap carousel */}
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="lg:hidden flex overflow-x-auto scrollbar-none snap-x snap-mandatory"
              aria-label="Product images"
            >
              {sortedImages.map((src, i) => (
                <div
                  key={src + i}
                  className="relative w-full shrink-0 aspect-[4/5] snap-center bg-smoke"
                  onClick={() => !product.isComingSoon && setLightboxSrc(src)}
                  role={product.isComingSoon ? undefined : "button"}
                  aria-label={product.isComingSoon ? undefined : `View image ${i + 1} fullscreen`}
                  tabIndex={product.isComingSoon ? undefined : 0}
                  onKeyDown={(e) => !product.isComingSoon && e.key === "Enter" && setLightboxSrc(src)}
                  style={{ cursor: product.isComingSoon ? "default" : "zoom-in" }}
                >
                  <Image
                    src={src}
                    alt={`${product.name} — image ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover object-top"
                  />
                  {product.isComingSoon && i === 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/70">
                      <p className="text-white font-bold uppercase tracking-[0.25em] text-sm">
                        Coming Soon
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dot indicators — mobile only */}
            {sortedImages.length > 1 && (
              <div className="lg:hidden flex justify-center items-center gap-2 py-4" aria-label="Image navigation">
                {sortedImages.map((_, i) => (
                  /* 32px hit area around a small visual dot (WCAG 2.5.8) */
                  <button
                    key={i}
                    onClick={() => scrollToSlide(i)}
                    aria-label={`Go to image ${i + 1}`}
                    aria-current={i === activeSlide ? "true" : undefined}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <span
                      className={[
                        "rounded-full transition-all duration-200",
                        i === activeSlide
                          ? "w-4 h-1.5 bg-primary"
                          : "w-1.5 h-1.5 bg-alto",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Desktop: vertical stack */}
            <div className="hidden lg:flex flex-col gap-1">
              {sortedImages.map((src, i) => (
                <div
                  key={src + i}
                  className={[
                    "relative w-full aspect-[4/5] bg-smoke overflow-hidden",
                    product.isComingSoon ? "cursor-default" : "cursor-zoom-in",
                  ].join(" ")}
                  onClick={() => !product.isComingSoon && setLightboxSrc(src)}
                  role={product.isComingSoon ? undefined : "button"}
                  aria-label={product.isComingSoon ? undefined : `View image ${i + 1} fullscreen`}
                  tabIndex={product.isComingSoon ? undefined : 0}
                  onKeyDown={(e) => !product.isComingSoon && e.key === "Enter" && setLightboxSrc(src)}
                >
                  <Image
                    src={src}
                    alt={`${product.name} — view ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="50vw"
                    className={[
                      "object-cover object-top transition-transform duration-700 ease-out",
                      product.isComingSoon ? "" : "hover:scale-105",
                    ].join(" ")}
                  />
                  {product.isComingSoon && i === 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/70">
                      <p className="text-white font-bold uppercase tracking-[0.25em] text-base md:text-lg">
                        Coming Soon
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT — Sticky product details ══ */}
          <div className="lg:sticky lg:self-start lg:h-[calc(100vh-var(--shell-top))] flex flex-col" style={{ top: "var(--shell-top)" }}>
            <div className="overflow-y-auto flex-1 px-6 md:px-10 lg:px-14 py-8 lg:py-12">

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 mb-6 text-[10px] tracking-widest uppercase text-chicago" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-primary transition-colors duration-200">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href={product.categoryHref} className="hover:text-primary transition-colors duration-200">
                  {product.category}
                </Link>
                <span aria-hidden="true">/</span>
                <span className="text-primary" aria-current="page">{product.name}</span>
              </nav>

              {product.badge && (
                <span className="inline-block bg-primary text-white text-[10px] tracking-widest uppercase px-2.5 py-1 mb-4 font-bold">
                  {product.badge}
                </span>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-primary leading-tight mb-2">
                {product.name}
              </h1>

              <p className="text-[11px] tracking-ultra uppercase text-chicago font-sans mb-5">
                Good vibes defined.
              </p>

              {reviews.length > 0 && (
                <a href="#reviews" className="flex items-center gap-2 mb-4 group w-fit">
                  <Stars rating={avgRating} />
                  <span className="text-xs text-chicago tracking-wide group-hover:text-primary transition-colors duration-200 underline underline-offset-2">
                    {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </a>
              )}

              {onSale ? (
                <p className={`font-display text-2xl font-semibold ${lowStock ? "mb-2" : "mb-6"}`}>
                  <span className="text-error">{formatTZS(price)}</span>
                  <span className="text-chicago line-through font-normal text-xl ml-3">{formatTZS(product.price)}</span>
                </p>
              ) : (
                <p className={`font-display text-2xl font-semibold text-primary ${lowStock ? "mb-2" : "mb-6"}`}>
                  {formatTZS(product.price)}
                </p>
              )}

              {lowStock && (
                <p className="text-xs tracking-widest uppercase text-error mb-6">
                  Only {product.stock} left in stock
                </p>
              )}

              {/* Color swatches */}
              {product.colors && product.colors.length > 1 && (
                <div className="mb-7">
                  <p className="text-xs tracking-widest uppercase text-primary mb-3">
                    Colour
                    {selectedColor && (
                      <span className="ml-2 font-normal text-chicago normal-case tracking-normal">
                        — {selectedColor.name}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2.5" role="group" aria-label="Select colour">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        title={color.name}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`${color.name}${selectedColor?.name === color.name ? " (selected)" : ""}`}
                        aria-pressed={selectedColor?.name === color.name}
                        className={[
                          "w-6 h-6 rounded-full border transition-all duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                          selectedColor?.name === color.name
                            ? "ring-2 ring-offset-2 ring-primary border-transparent"
                            : "border-transparent hover:ring-2 hover:ring-offset-2 hover:ring-chicago",
                        ].join(" ")}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="w-8 h-px bg-mercury mb-7" aria-hidden="true" />

              {/* Size selector — correct ARIA: radiogroup + radio */}
              {product.sizes.length > 1 && (
                <div className="mb-7" ref={sizeSectionRef}>
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-xs tracking-widest uppercase text-primary">
                      Size
                      {selectedSize && (
                        <span className="ml-2 font-normal text-chicago normal-case tracking-normal">
                          — {selectedSize}
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-[11px] tracking-widest uppercase text-chicago underline underline-offset-2 hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1"
                    >
                      Size Guide
                    </button>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Select size"
                    aria-required="true"
                    className="flex flex-wrap gap-2"
                  >
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        role="radio"
                        aria-checked={selectedSize === size}
                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                        className={[
                          "w-14 h-11 text-xs tracking-widest uppercase border transition-colors duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          selectedSize === size
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-primary border-mercury hover:border-primary",
                        ].join(" ")}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {sizeError && (
                    <p role="alert" className="mt-2 text-xs text-error tracking-wide">
                      Please select a size to continue.
                    </p>
                  )}
                </div>
              )}

              {/* Fit guidance */}
              {(product.fit || product.fitNotes) && (
                <div className="mb-7">
                  {product.fit && (
                    <div className="max-w-[300px]">
                      <div className="flex justify-between mb-1.5">
                        {([["runs-small", "Runs Small"], ["true-to-size", "True to Size"], ["runs-large", "Runs Large"]] as const).map(([v, label]) => (
                          <span
                            key={v}
                            className={`text-[10px] tracking-widest uppercase ${product.fit === v ? "text-primary font-bold" : "text-alto"}`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1" aria-hidden="true">
                        {(["runs-small", "true-to-size", "runs-large"] as const).map((v) => (
                          <span key={v} className={`h-0.5 flex-1 ${product.fit === v ? "bg-primary" : "bg-mercury"}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {product.fitNotes && (
                    <p className={`text-xs text-chicago tracking-wide ${product.fit ? "mt-2.5" : ""}`}>
                      {product.fitNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Add to Bag + wishlist */}
              <div className="flex items-stretch gap-2" ref={atcRef}>
                {product.isComingSoon ? (
                  <button
                    disabled
                    className="flex-1 py-4 text-xs tracking-[0.2em] uppercase bg-smoke text-chicago border border-mercury cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : soldOut ? (
                  <button
                    disabled
                    className="flex-1 py-4 text-xs tracking-[0.2em] uppercase bg-smoke text-chicago border border-mercury cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                ) : (
                  <button
                    onClick={handleAddToBag}
                    className={[
                      "flex-1 py-4 text-xs tracking-widest uppercase transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      added
                        ? "bg-success text-white"
                        : "bg-primary text-white hover:bg-charcoal",
                    ].join(" ")}
                  >
                    {added ? "Added to Bag ✓" : "Add to Bag"}
                  </button>
                )}
                <WishlistButton
                  variant="pdp"
                  item={{
                    id: product.id,
                    name: product.name,
                    price,
                    image: product.colors?.[0]?.image ?? product.images[0] ?? "",
                  }}
                />
              </div>

              {soldOut && <RestockNotifyForm productId={product.id} />}

              <p className="mt-3 text-center text-[11px] tracking-widest uppercase text-chicago">
                Free delivery on orders above TZS 150,000
              </p>

              {/* Accordion */}
              <div className="mt-10">
                <AccordionItem label="Product Description">
                  <p>{product.description}</p>
                </AccordionItem>

                <AccordionItem label="Materials & Care">
                  <p className="mb-3">{product.materials}</p>
                  <p className="text-chicago">{product.care}</p>
                </AccordionItem>

                <AccordionItem label="Shipping & Returns">
                  <ul className="space-y-2 text-mine">
                    <li>Free standard delivery to Dar es Salaam, Arusha, Mwanza, Dodoma, and all major Tanzanian cities on orders above TZS 150,000.</li>
                    <li className="pt-1">Standard delivery: 2–4 business days within Dar es Salaam.</li>
                    <li>Upcountry delivery: 4–7 business days depending on location.</li>
                    <li className="pt-1">Payment via M-Pesa, Tigo Pesa, Airtel Money, or Cash on Delivery.</li>
                    <li className="pt-1 text-chicago">
                      Returns accepted within 14 days of delivery. Items must be unworn and in original condition.{" "}
                      <Link href="/shipping" className="underline underline-offset-2 hover:text-primary transition-colors duration-200">
                        Full returns policy →
                      </Link>
                    </li>
                  </ul>
                </AccordionItem>

                <div className="border-t border-mercury" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Style It With — curated pairings ── */}
        {styledWith.length > 0 && (
          <section
            aria-label="Style it with"
            className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-16 border-t border-mercury"
          >
            <h2 className="heading-section mb-8">Style It With</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
              {styledWith.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        <section
          id="reviews"
          aria-label="Customer reviews"
          className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-16 border-t border-mercury scroll-mt-24"
        >
          <div className="max-w-2xl">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="heading-section">Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <Stars rating={avgRating} />
                  <span className="text-xs text-chicago tracking-wide">
                    {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>
              )}
            </div>

            {reviews.length === 0 && (
              <p className="text-sm text-chicago tracking-wide mb-8">
                No reviews yet — be the first to share how it fits.
              </p>
            )}

            <div className="space-y-8 mb-10">
              {reviews.map((r) => (
                <article key={r.id} className="border-b border-mercury pb-8 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4 mb-1.5">
                    <Stars rating={r.rating} />
                    <span className="text-[11px] text-chicago tracking-wide shrink-0">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-primary mb-2">{r.author}</p>
                  <p className="text-sm text-mine leading-relaxed tracking-wide">{r.body}</p>
                  {r.photo_url && (
                    <div className="relative w-24 h-24 mt-3 bg-smoke">
                      <Image
                        src={r.photo_url}
                        alt={`Photo from ${r.author}'s review`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            <ReviewForm productId={product.id} />
          </div>
        </section>

        {/* ── You May Also Like ── */}
        {related.length > 0 && (
          <section
            aria-label="You may also like"
            className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-16 border-t border-mercury"
          >
            <h2 className="heading-section mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed (excludes the product on screen) ── */}
        <RecentlyViewed excludeId={product.id} />
      </main>

      <Footer />

      {/* ── Sticky mobile Add to Bag — appears when the main button scrolls away ── */}
      {!product.isComingSoon && !soldOut && (
      <div
        className={[
          "lg:hidden fixed bottom-0 inset-x-0 z-[70] bg-white border-t border-mercury",
          "px-4 py-3 flex items-center gap-3 transition-transform duration-300 ease-out",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        aria-hidden={!showStickyBar}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary truncate tracking-wide">{product.name}</p>
          <p className="text-xs tracking-wide">
            {onSale ? (
              <>
                <span className="text-error">{formatTZS(price)}</span>
                <span className="text-chicago line-through ml-1.5">{formatTZS(product.price)}</span>
              </>
            ) : (
              <span className="text-chicago">{formatTZS(product.price)}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleAddToBag}
          tabIndex={showStickyBar ? 0 : -1}
          className={[
            "shrink-0 px-6 py-3 text-xs tracking-widest uppercase transition-colors duration-200",
            added ? "bg-success text-white" : "bg-primary text-white hover:bg-charcoal",
          ].join(" ")}
        >
          {added ? "Added ✓" : "Add to Bag"}
        </button>
      </div>
      )}

      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox
            src={lightboxSrc}
            alt={product.name}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sizeGuideOpen && (
          <SizeGuideModal
            category={product.category}
            onClose={() => setSizeGuideOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
