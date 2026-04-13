"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ── Reusable fade-up variant ── */
const fadeUp = {
  hidden: { opacity: 0, y: 52 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
      delay: i * 0.12,
    },
  }),
};

/* ── Campaign / lookbook data ── */
const CAMPAIGNS = [
  {
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 01 — Studio",
    label: "SS 2025 — Campaign 01",
    tall: true,
  },
  {
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 02 — Street",
    label: "SS 2025 — Campaign 02",
    tall: false,
  },
  {
    src: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 03 — Movement",
    label: "SS 2025 — Campaign 03",
    tall: false,
  },
  {
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 04 — Form",
    label: "SS 2025 — Campaign 04",
    tall: true,
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 05 — Identity",
    label: "SS 2025 — Campaign 05",
    tall: true,
  },
  {
    src: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=85",
    alt: "LOVLOS Campaign 06 — Edge",
    label: "SS 2025 — Campaign 06",
    tall: false,
  },
];

/* ── Lab / technical detail data ── */
const LAB = [
  {
    src: "https://images.unsplash.com/photo-1542574621-e088a4464cc6?auto=format&fit=crop&w=800&q=85",
    alt: "Premium fabric weight",
    caption: "PREMIUM WEIGHT",
    sub: "200–320 gsm. Every piece engineered to hold its shape.",
  },
  {
    src: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85",
    alt: "Precision stitching detail",
    caption: "PRECISION STITCH",
    sub: "Double-locked seams. Built for movement, made to last.",
  },
  {
    src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85",
    alt: "Defined fit construction",
    caption: "DEFINED FIT",
    sub: "Patterns cut for the human form. Relaxed without losing structure.",
  },
];

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-5 right-6 text-zinc-400 hover:text-white transition-colors duration-200 z-10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-2xl max-h-[90vh] aspect-[3/4]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 95vw, 700px"
          className="object-contain" priority />
      </motion.div>
    </motion.div>
  );
}

/* ── Main ── */
export default function StudioContent() {
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <Header />

      {/* ══ HERO ══ */}
      <section className="relative w-full h-screen overflow-hidden bg-black">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=90"
          alt="LOVLOS Studio — editorial"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />

        {/* Outlined STUDIO — sole typographic element, perfectly centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="font-display font-black uppercase leading-none"
            style={{
              fontSize: "clamp(7rem, 22vw, 24rem)",
              WebkitTextStroke: "1.5px white",
              color: "transparent",
              opacity: 0.45,
              letterSpacing: "-0.04em",
            }}
          >
            STUDIO
          </span>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-600">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-px h-6 bg-zinc-700"
          />
        </motion.div>
      </section>

      {/* ══ THE ARCHIVE — Lookbook Grid ══ */}
      <section className="bg-zinc-950 py-24 md:py-32 px-6 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-14"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-zinc-600 font-sans mb-3">
              Visual Archives
            </p>
            <h2
              className="font-display font-black uppercase text-white leading-none tracking-tighter"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              The Archive
            </h2>
          </motion.div>

          {/* 2-column masonry grid */}
          <div className="columns-1 sm:columns-2 gap-4 space-y-0">
            {CAMPAIGNS.map((item, i) => (
              <motion.div
                key={item.src}
                custom={i % 3}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="break-inside-avoid mb-4 group relative cursor-zoom-in overflow-hidden"
                onClick={() => setLightboxSrc({ src: item.src, alt: item.alt })}
              >
                <div className={[
                  "relative w-full overflow-hidden bg-zinc-900",
                  item.tall ? "aspect-[3/4]" : "aspect-[4/5]",
                ].join(" ")}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-400 flex items-end p-5">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-white/0 group-hover:text-white/80 transition-all duration-300 font-sans">
                      {item.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ THE LAB ══ */}
      <section className="bg-black py-24 md:py-32 px-6 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-14"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-zinc-600 font-sans mb-3">
              Materials &amp; Construction
            </p>
            <h2
              className="font-display font-black uppercase text-white leading-none tracking-tighter"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              The Lab
            </h2>
          </motion.div>

          {/* 3-column detail grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {LAB.map((item, i) => (
              <motion.div
                key={item.src}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="group cursor-zoom-in"
                onClick={() => setLightboxSrc({ src: item.src, alt: item.alt })}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-zinc-900 mb-5">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-400" />
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <div className="w-5 h-px bg-zinc-700" />
                  <p className="text-xs font-black tracking-[0.25em] uppercase text-white">
                    {item.caption}
                  </p>
                  <p className="text-[11px] tracking-wide text-zinc-500 font-sans font-light leading-relaxed">
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MANIFESTO STRIP ══ */}
      <section className="bg-zinc-950 border-t border-white/[0.05] py-20 px-6 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="font-display font-black uppercase text-white leading-[0.88] tracking-tighter mx-auto"
          style={{ fontSize: "clamp(2rem, 6vw, 5rem)", maxWidth: "900px" }}
        >
          Every stitch is a decision.<br />Every piece is a statement.
        </motion.p>
        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-[10px] tracking-[0.35em] uppercase text-zinc-600 mt-8 font-sans"
        >
          LOVLOS · Tanzania · Est. 2025
        </motion.p>
      </section>

      <Footer />

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox
            src={lightboxSrc.src}
            alt={lightboxSrc.alt}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
