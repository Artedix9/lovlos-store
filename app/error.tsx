"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-white">
      <p className="text-xs tracking-ultra uppercase text-chicago">Something went wrong</p>
      <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight text-primary">
        Bad vibes,<br />briefly.
      </h1>
      <p className="text-sm text-mine tracking-wide leading-relaxed max-w-sm">
        An unexpected error occurred. It&apos;s not you — try again, or head back home.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn-outline text-center">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
