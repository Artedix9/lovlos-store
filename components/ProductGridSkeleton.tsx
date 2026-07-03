/** Loading placeholder matching CategoryShell's layout — prevents CLS while the grid hydrates. */
export default function ProductGridSkeleton() {
  return (
    <section
      className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div className="md:grid md:grid-cols-[180px_1fr] md:gap-x-8 lg:gap-x-10">
        <aside className="hidden md:block">
          <div className="space-y-4">
            <div className="h-3 w-16 bg-smoke motion-safe:animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-24 bg-smoke motion-safe:animate-pulse" />
            ))}
          </div>
        </aside>

        <div>
          <div className="flex items-baseline justify-between mb-8">
            <div className="h-7 w-48 bg-smoke motion-safe:animate-pulse" />
            <div className="h-3 w-16 bg-smoke motion-safe:animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[3/4] bg-smoke motion-safe:animate-pulse" />
                <div className="h-3 w-3/4 bg-smoke motion-safe:animate-pulse" />
                <div className="h-3 w-1/3 bg-smoke motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
