import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  desktopSrc: string;
  mobileSrc: string;
  isFullScreen?: boolean;
}

export default function Hero({ desktopSrc, mobileSrc, isFullScreen = false }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-smoke">

      {/* Mobile image — visible below md breakpoint */}
      <div className={`relative w-full md:hidden ${isFullScreen ? "min-h-[75vh]" : "min-h-[80vh]"}`}>
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
      <div className={`relative w-full hidden md:block ${isFullScreen ? "h-[75vh]" : "h-[80vh]"}`}>
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
          <p className="text-xs tracking-ultra uppercase text-charcoal mb-3 font-sans">
            New Arrivals
          </p>
          <h1 className="font-display text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-primary leading-none mb-4 md:mb-6">
            Good vibes<br />defined.
          </h1>
          <p className="text-sm tracking-wide text-mine mb-8 max-w-xs font-sans leading-relaxed">
            Discover the new season collection. Effortless pieces designed for movement and life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/women" className="btn-primary">
              Shop Women
            </Link>
            <Link href="/men" className="btn-outline">
              Shop Men
            </Link>
          </div>
          <p className="mt-6 text-xs tracking-widest uppercase text-chicago">
            Prices shown in TZS
          </p>
        </div>
      </div>

      {/* Scroll indicator — centered, only shown on full-screen */}
      {isFullScreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-[9px] tracking-[0.3em] uppercase text-chicago font-sans">Scroll</p>
          <div className="w-px h-8 bg-dawn animate-pulse" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
