import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  desktopSrc: string;
  mobileSrc: string;
}

export default function Hero({ desktopSrc, mobileSrc }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-smoke">

      {/* Mobile image — visible below md breakpoint */}
      <div className="relative w-full min-h-[80vh] md:hidden">
        <Image
          src={mobileSrc}
          alt="LOVLOS — New Season Arrivals"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Desktop image — visible at md and above */}
      <div className="relative w-full h-[80vh] hidden md:block">
        <Image
          src={desktopSrc}
          alt="LOVLOS — New Season Arrivals"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
        <div className="max-w-lg">
          {/* Eyebrow */}
          <p className="text-xs tracking-ultra uppercase text-charcoal mb-3 font-sans">
            New Arrivals
          </p>

          {/* Tagline */}
          <h1 className="font-display text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-primary leading-none mb-4 md:mb-6">
            Good vibes<br />defined.
          </h1>

          {/* Sub-copy */}
          <p className="text-sm tracking-wide text-mine mb-8 max-w-xs font-sans leading-relaxed">
            Discover the new season collection. Effortless pieces designed for movement and life.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link href="/women" className="btn-primary">
              Shop Women
            </Link>
            <Link href="/men" className="btn-outline">
              Shop Men
            </Link>
          </div>

          {/* Currency indicator */}
          <p className="mt-6 text-xs tracking-widest uppercase text-chicago">
            Prices shown in TZS
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 right-8 md:right-16 flex flex-col items-center gap-2 text-chicago">
        <div className="w-px h-10 bg-dawn animate-pulse" aria-hidden="true" />
        <p className="text-[10px] tracking-ultra uppercase" style={{ writingMode: "vertical-rl" }}>
          Scroll
        </p>
      </div>
    </section>
  );
}
