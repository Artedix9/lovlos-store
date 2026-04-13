"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProduct, formatTZS } from "@/lib/products";
import { useCart } from "@/context/CartContext";

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

/* ── Main PDP ── */
export default function ProductPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const product = getProduct(id);

  const { addItem, openCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

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
              <div key={src} className="relative w-full aspect-[4/5] bg-smoke overflow-hidden">
                <Image
                  src={src}
                  alt={`${product.name} — view ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
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

              {/* ── Add to Bag ── */}
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
    </>
  );
}
