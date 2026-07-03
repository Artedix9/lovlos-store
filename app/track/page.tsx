import type { Metadata } from "next";
import { Suspense } from "react";
import TrackContent from "./TrackContent";

export const metadata: Metadata = {
  title: "Track My Order — LOVLOS",
  description: "Check the status of your LOVLOS order with your order ID and phone number.",
};

/* Suspense boundary required for useSearchParams in the App Router */
export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-xs tracking-widest uppercase text-chicago">Loading…</p>
        </main>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
