export default function Loading() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white"
      aria-busy="true"
      aria-label="Loading page"
    >
      <p className="font-display text-2xl font-bold uppercase tracking-ultra text-primary motion-safe:animate-pulse">
        LOVLOS
      </p>
      <p className="text-[10px] tracking-ultra uppercase text-chicago">
        Good vibes loading
      </p>
    </main>
  );
}
