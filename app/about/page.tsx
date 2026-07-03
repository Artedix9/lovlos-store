import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — LOVLOS",
  description:
    "LOVLOS was created for those who move with intention. Boldness, confidence, and radical self-acceptance — own your vibe.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content">

      {/* ── Hero — full viewport, centred ── */}
      <section className="w-full h-screen bg-primary flex flex-col items-center justify-center px-8 overflow-hidden gap-8 md:gap-10">

        {/* Eyebrow */}
        <p className="text-[10px] tracking-ultra uppercase text-white/60 font-sans">
          Spring / Summer 2025
        </p>

        {/* Headline — fluid from 320px up; min size keeps the nowrap line inside narrow viewports */}
        <h1 className="font-display font-black uppercase text-white text-display-2xl tracking-tighter whitespace-nowrap">
          Good Vibes Defined.
        </h1>

        {/* Divider */}
        <div className="w-12 h-px bg-white/30" aria-hidden="true" />

        {/* Philosophy */}
        <p className="text-sm md:text-base font-sans font-light text-white/70 tracking-widest text-center leading-relaxed max-w-3xl uppercase">
          LOVLOS was created for those who move with intention. We believe that
          true style isn&apos;t about fitting in — it&apos;s about the confidence
          to accept who you are and the boldness to show it to the world.
        </p>

      </section>

      {/* ── Brand Story ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">

          {/* Left — product image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-smoke">
            <Image
              src="/Oversize Tee (alo) front-a.png"
              alt="LOVLOS Oversize Tee — the vibe, defined"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>

          {/* Right — copy */}
          <div className="flex flex-col justify-center gap-8">
            <p className="text-xs tracking-ultra uppercase text-chicago font-sans">
              Our Story
            </p>

            <h2 className="font-display font-black uppercase text-primary text-display-lg tracking-tight">
              Born in Tanzania.<br />Built for the world.
            </h2>

            <p className="text-sm md:text-base text-mine font-sans font-light leading-loose tracking-wide max-w-md">
              LOVLOS started with a simple belief: that where you&apos;re from
              should never limit how far you can go. We make premium streetwear
              for people who carry their identity with pride and wear it without
              apology.
            </p>

            <p className="text-sm md:text-base text-mine font-sans font-light leading-loose tracking-wide max-w-md">
              From Dar es Salaam to Arusha, from Mwanza to the world — every
              LOVLOS piece is a declaration that you are enough, exactly as you
              are.
            </p>

            <div className="w-12 h-px bg-primary" />

            <p className="text-xs tracking-ultra uppercase text-chicago font-sans">
              Est. Tanzania, 2025
            </p>
          </div>
        </div>
      </section>

      {/* ── Join the Movement ── */}
      <section className="w-full bg-smoke px-5 md:px-16 lg:px-24 py-24 md:py-36 flex flex-col items-center text-center gap-10">
        <p className="text-xs tracking-ultra uppercase text-chicago font-sans">
          The Collection
        </p>
        <h2 className="font-display font-black uppercase text-primary text-display-xl tracking-tight">
          Join the movement.
        </h2>
        <p className="text-sm font-sans font-light text-mine tracking-wide leading-relaxed max-w-xs">
          Premium pieces for the bold. Shop the full LOVLOS collection and wear
          your confidence.
        </p>
        <Link
          href="/women"
          className="bg-primary text-white text-xs tracking-widest uppercase px-12 py-4 hover:bg-charcoal transition-colors duration-200"
        >
          Shop the Collection
        </Link>
      </section>

      </main>
      <Footer />
    </>
  );
}
