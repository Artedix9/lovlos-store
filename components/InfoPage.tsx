import Header from "@/components/Header";
import Footer from "@/components/Footer";

/** Shared shell for static info pages (shipping, privacy, terms, FAQ, …). Server-safe. */
export default function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-[10px] tracking-ultra uppercase text-chicago font-sans mb-3">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 text-sm text-mine tracking-wide leading-relaxed max-w-xl">
              {intro}
            </p>
          )}
          <div className="mt-12 space-y-12">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Section with the same heading treatment used on checkout. */
export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs font-black uppercase tracking-ultra text-primary mb-5 pb-3 border-b border-mercury">
        {title}
      </h2>
      <div className="space-y-4 text-sm text-mine tracking-wide leading-relaxed">
        {children}
      </div>
    </section>
  );
}
