"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProduct, formatTZS } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

/* ── Accordion item ── */
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
          className="text-lg leading-none text-chicago transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{ maxHeight: open ? "600px" : "0px" }}
      >
        <div className="pb-5 text-sm text-mine leading-relaxed tracking-wide">
          {children}
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
  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Lock scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] bg-zinc-950/95 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Product image lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-5 right-6 text-zinc-400 hover:text-white transition-colors duration-200 z-10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Image — stops click from closing when clicking the image itself */}
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
          priority
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Main PDP ── */
export default function ProductPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const product = getProduct(id);

  const { addItem, openCart } = useCart();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function handleAddToBag() {
    if (!selectedSize && product && product.sizes.length > 1) {
      setSizeError(true);
      return;
    }
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        size: selectedSize ?? "One Size",
        price: product.price,
        image: product.images[0],
      });
      openCart();
      showToast(`${product.name} added to bag.`);
    }
    setSizeError(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  /* ── 404 state ── */
  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6">
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight">Product not found</h1>
          <p className="text-sm text-chicago tracking-wide">
            The item you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="btn-outline mt-4">
            Back to Home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main>
        {/* ── Two-column layout ── */}
        <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">

          {/* ══ LEFT — Scrollable image stack ══ */}
          <div className="flex flex-col gap-1">
            {product.images.map((src, i) => (
              <div
                key={src}
                className={[
                  "relative w-full aspect-[4/5] bg-smoke overflow-hidden",
                  product.isComingSoon ? "cursor-default" : "cursor-zoom-in",
                ].join(" ")}
                onClick={() => !product.isComingSoon && setLightboxSrc(src)}
                role={product.isComingSoon ? undefined : "button"}
                aria-label={product.isComingSoon ? undefined : `View ${product.name} — image ${i + 1} fullscreen`}
                tabIndex={product.isComingSoon ? undefined : 0}
                onKeyDown={(e) => !product.isComingSoon && e.key === "Enter" && setLightboxSrc(src)}
              >
                <Image
                  src={src}
                  alt={`${product.name} — view ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={[
                    "object-cover object-top transition-transform duration-700 ease-out",
                    product.isComingSoon ? "" : "hover:scale-105",
                  ].join(" ")}
                />
                {/* Coming soon overlay — hero image only */}
                {product.isComingSoon && i === 0 && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-black/40">
                    <p className="text-white font-black uppercase tracking-[0.2em] text-base md:text-lg">
                      Coming Soon
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ══ RIGHT — Sticky product details ══ */}
          <div className="lg:sticky lg:top-16 lg:self-start lg:h-[calc(100vh-4rem)] flex flex-col">
            <div className="overflow-y-auto flex-1 px-8 md:px-12 lg:px-14 py-10 lg:py-14">

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 mb-8 text-[10px] tracking-widest uppercase text-chicago">
                <Link href="/" className="hover:text-primary transition-colors duration-200">Home</Link>
                <span>/</span>
                <Link href={product.categoryHref} className="hover:text-primary transition-colors duration-200">
                  {product.category}
                </Link>
                <span>/</span>
                <span className="text-primary">{product.name}</span>
              </nav>

              {/* Badge */}
              {product.badge && (
                <span className="inline-block bg-primary text-white text-[10px] tracking-widest uppercase px-2.5 py-1 mb-4">
                  {product.badge}
                </span>
              )}

              {/* Product name */}
              <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-primary leading-tight mb-2">
                {product.name}
              </h1>

              {/* Tagline */}
              <p className="text-[11px] tracking-ultra uppercase text-chicago font-sans mb-5">
                Good vibes defined.
              </p>

              {/* Price */}
              <p className="font-display text-2xl font-bold text-primary mb-8">
                {formatTZS(product.price)}
              </p>

              <div className="w-8 h-px bg-mercury mb-8" aria-hidden="true" />

              {/* ── Size selector ── */}
              {product.sizes.length > 1 && (
                <div className="mb-7">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs tracking-widest uppercase text-primary">
                      Size
                      {selectedSize && (
                        <span className="ml-2 font-normal text-chicago normal-case tracking-normal">
                          — {selectedSize}
                        </span>
                      )}
                    </span>
                    <button className="text-[11px] tracking-widest uppercase text-chicago underline underline-offset-2 hover:text-primary transition-colors duration-200">
                      Size Guide
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        className={[
                          "w-14 h-11 text-xs tracking-widest uppercase border transition-colors duration-150",
                          selectedSize === size
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-primary border-mercury hover:border-primary",
                        ].join(" ")}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {sizeError && (
                    <p className="mt-2 text-xs text-[#b00020] tracking-wide">
                      Please select a size to continue.
                    </p>
                  )}
                </div>
              )}

              {/* ── Add to Bag / Coming Soon ── */}
              {product.isComingSoon ? (
                <button
                  disabled
                  className="w-full py-4 text-xs tracking-[0.2em] uppercase bg-smoke text-chicago border border-mercury cursor-not-allowed"
                >
                  Coming Soon
                </button>
              ) : (
                <button
                  onClick={handleAddToBag}
                  className={[
                    "w-full py-4 text-xs tracking-widest uppercase transition-all duration-200",
                    added
                      ? "bg-[#758e6d] text-white"
                      : "bg-primary text-white hover:bg-charcoal",
                  ].join(" ")}
                >
                  {added ? "Added to Bag ✓" : "Add to Bag"}
                </button>
              )}

              {/* Trust strip */}
              <p className="mt-3 text-center text-[11px] tracking-widest uppercase text-chicago">
                Free delivery on orders above TZS 150,000
              </p>

              {/* ── Accordion ── */}
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
                    <li className="pt-1 text-chicago">Returns accepted within 14 days of delivery. Items must be unworn and in original condition. <Link href="/shipping" className="underline underline-offset-2 hover:text-primary transition-colors duration-200">Full returns policy →</Link></li>
                  </ul>
                </AccordionItem>

                <div className="border-t border-mercury" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox
            src={lightboxSrc}
            alt={product.name}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
