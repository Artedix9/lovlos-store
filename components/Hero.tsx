import Link from "next/link";

interface HeroProps {
  desktopSrc: string;
  mobileSrc: string;
  isFullScreen?: boolean;
  darkBackground?: boolean;
}

export default function Hero({ desktopSrc, mobileSrc, isFullScreen = false, darkBackground = false }: HeroProps) {
  const heightCls = isFullScreen ? "min-h-[75vh] md:h-[75vh]" : "min-h-[80vh] md:h-[80vh]";

  return (
    <section className="relative w-full overflow-hidden bg-smoke">

      {/* picture — browser downloads only the matching source */}
      <div className={`relative ${heightCls}`}>
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopSrc} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileSrc}
            alt="LOVLOS — New Season Arrivals"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16 px-5 md:px-16 lg:px-24">
        <div className="max-w-lg">
          <p className={`text-xs tracking-ultra uppercase mb-3 font-sans ${darkBackground ? "text-white" : "text-charcoal"}`}>
            New Arrivals
          </p>
          <h1 className={`font-display text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-none mb-4 md:mb-6 ${darkBackground ? "text-white" : "text-primary"}`}>
            Good vibes<br />defined.
          </h1>
          <p className={`text-sm tracking-wide mb-8 max-w-xs font-sans leading-relaxed ${darkBackground ? "text-white" : "text-mine"}`}>
            Discover the new season collection. Effortless pieces designed for movement and life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/women"
              className={darkBackground
                ? "bg-white text-black text-xs font-normal tracking-widest uppercase px-8 py-3 transition-opacity duration-200 hover:opacity-90"
                : "btn-primary"}
            >
              Shop Women
            </Link>
            <Link
              href="/men"
              className={darkBackground
                ? "bg-transparent border border-white text-white text-xs font-normal tracking-widest uppercase px-8 py-3 transition-colors duration-200 hover:bg-white hover:text-black"
                : "btn-outline"}
            >
              Shop Men
            </Link>
          </div>
          <p className={`mt-6 text-xs tracking-widest uppercase ${darkBackground ? "text-white/70" : "text-chicago"}`}>
            Prices shown in TZS
          </p>
        </div>
      </div>

      {/* Scroll indicator — centered, only shown on full-screen */}
      {isFullScreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className={`text-[9px] tracking-[0.3em] uppercase font-sans ${darkBackground ? "text-white" : "text-chicago"}`}>Scroll</p>
          <div className={`w-px h-8 animate-pulse ${darkBackground ? "bg-white" : "bg-dawn"}`} aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
