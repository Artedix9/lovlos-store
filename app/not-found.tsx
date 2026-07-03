import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center bg-white">
        <p className="text-xs tracking-ultra uppercase text-chicago">Error 404</p>
        <h1 className="font-display text-display-xl font-black uppercase tracking-tight text-primary">
          Lost the vibe.
        </h1>
        <p className="text-sm text-mine tracking-wide leading-relaxed max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
          Let&apos;s get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/" className="btn-primary text-center">
            Back to Home
          </Link>
          <Link href="/women" className="btn-outline text-center">
            Shop New Arrivals
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
