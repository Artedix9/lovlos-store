"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const, delay: i * 0.1 },
  }),
};

/*
  Archive grid — 3-column explicit CSS grid placement:

  [ 01 SILHOUETTE tall ] [ 02 ARCHITECTURE wide wide ]
  [ 01 SILHOUETTE tall ] [ 03 TEXTURE ] [ 04 SHADOW ]
  [ 05 MOTION wide wide ] [ 06 FORM tall ]
                          [ 06 FORM tall ]
*/
const ARCHIVE = [
  {
    id: "01",
    label: "SILHOUETTE",
    src: "https://images.unsplash.com/photo-1509629954671-66dead3f9ef9?auto=format&fit=crop&w=900&q=90",
    alt: "Silhouette in dark alley",
    // col 1, rows 1–2 (tall portrait)
    placement: "col-start-1 row-start-1 row-span-2",
  },
  {
    id: "02",
    label: "ARCHITECTURE",
    src: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1400&q=90",
    alt: "Minimal concrete architecture",
    // cols 2–3, row 1 (wide landscape)
    placement: "col-start-2 col-span-2 row-start-1",
  },
  {
    id: "03",
    label: "TEXTURE",
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=90",
    alt: "Fabric stitching macro",
    // col 2, row 2
    placement: "col-start-2 row-start-2",
  },
  {
    id: "04",
    label: "SHADOW",
    src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=90",
    alt: "Shadow geometry interior",
    // col 3, row 2
    placement: "col-start-3 row-start-2",
  },
  {
    id: "05",
    label: "MOTION",
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=90",
    alt: "Movement editorial",
    // cols 1–2, row 3 (wide landscape)
    placement: "col-start-1 col-span-2 row-start-3",
  },
  {
    id: "06",
    label: "FORM",
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=90",
    alt: "Editorial form portrait",
    // col 3, rows 3–4 (tall portrait)
    placement: "col-start-3 row-start-3 row-span-2",
  },
];

const LAB_DETAILS = [
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
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-6 text-zinc-500 hover:text-white transition-colors z-10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
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
        <Image
          src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=90"
          alt="LOVLOS Studio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />

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

      {/* ══ THE ARCHIVE ══ */}
      <section className="bg-zinc-950 py-24 md:py-32 px-6 md:px-10 lg:px-16">
        <div className="max-w-[1440px] mx-auto">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12"
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

          {/* ── Desktop: explicit CSS grid ── */}
          <div className="hidden md:grid md:grid-cols-3 md:auto-rows-[340px] lg:auto-rows-[380px] gap-3 lg:gap-4">
            {ARCHIVE.map((item, i) => (
              <motion.div
                key={item.id}
                custom={i * 0.5}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className={[
                  item.placement,
                  "group relative overflow-hidden bg-zinc-900 cursor-zoom-in",
                ].join(" ")}
                onClick={() => setLightboxSrc({ src: item.src, alt: item.alt })}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Darkening overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                {/* Corner label — slides up on hover */}
                <div className="absolute bottom-4 left-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/90 font-sans">
                    {item.id} / {item.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Mobile: vertical stack ── */}
          <div className="md:hidden flex flex-col gap-3">
            {ARCHIVE.map((item, i) => (
              <motion.div
                key={item.id}
                custom={i * 0.4}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="group relative overflow-hidden bg-zinc-900 cursor-zoom-in"
                onClick={() => setLightboxSrc({ src: item.src, alt: item.alt })}
              >
                <div className={[
                  "relative w-full overflow-hidden",
                  /* Alternate tall/wide to keep mobile feed varied */
                  i % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]",
                ].join(" ")}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="100vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute bottom-4 left-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-[9px] tracking-[0.3em] uppercase text-white/90 font-sans">
                      {item.id} / {item.label}
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
        <div className="max-w-[1440px] mx-auto">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12"
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

          {/* Philosophy — monospaced */}
          <motion.div
            variants={fadeUp}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-20 max-w-2xl border-l border-zinc-800 pl-6"
          >
            <p className="font-mono text-[11px] text-zinc-500 leading-[2] tracking-wide">
              Three principles. One intention.
            </p>
            <div className="mt-6 space-y-6 font-mono text-[11px] leading-[2] tracking-wide">
              <div>
                <span className="text-white">QUALITY —</span>
                <span className="text-zinc-500"> We source only what earns its place. Every gram of fabric, every thread count, every zipper pull is chosen with intent. If it doesn&apos;t feel right, it doesn&apos;t ship.</span>
              </div>
              <div>
                <span className="text-white">PRECISION —</span>
                <span className="text-zinc-500"> Our patterns are cut to the millimeter. Seams are double-locked. Proportions are mapped to the human form — structure without stiffness, shape without restriction.</span>
              </div>
              <div>
                <span className="text-white">VIBE —</span>
                <span className="text-zinc-500"> Design is energy. Before a piece is worn, it carries something. A feeling. A frequency. That&apos;s what LOVLOS is built on. Good vibes, defined.</span>
              </div>
            </div>
          </motion.div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {LAB_DETAILS.map((item, i) => (
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
                <div className="relative aspect-square overflow-hidden bg-zinc-900 mb-5">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
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
