"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { formatTZS } from "@/lib/products";

export default function WishlistContent() {
  const { items, remove, count } = useWishlist();
  const { showToast } = useToast();

  return (
    <>
      <Header />
      <main id="main-content" className="bg-white min-h-[60vh]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 py-14 md:py-20">

          {/* Page title */}
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-ultra uppercase text-chicago font-sans mb-2">
                Saved for later
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-primary">
                Wishlist
              </h1>
            </div>
            {count > 0 && (
              <span className="text-xs tracking-widest uppercase text-chicago" aria-live="polite">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
                Nothing Saved Yet.
              </p>
              <p className="mt-4 text-xs tracking-widest uppercase text-chicago">
                Tap the heart on any product to keep it here.
              </p>
              <Link href="/women" className="btn-primary mt-8">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {items.map((item) => (
                <article key={item.id} className="group flex flex-col">
                  <Link href={`/product/${item.id}`} className="relative block overflow-hidden bg-smoke aspect-[3/4]">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                  </Link>
                  <div className="mt-3 flex flex-col gap-1">
                    <Link
                      href={`/product/${item.id}`}
                      className="text-sm text-primary hover:text-chicago transition-colors duration-200 leading-snug tracking-wide focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-chicago tracking-wide">{formatTZS(item.price)}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <Link
                        href={`/product/${item.id}`}
                        className="text-[10px] tracking-widest uppercase text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-150"
                      >
                        View Item
                      </Link>
                      <button
                        onClick={() => {
                          remove(item.id);
                          showToast(`${item.name} removed from wishlist.`);
                        }}
                        aria-label={`Remove ${item.name} from wishlist`}
                        className="text-[10px] tracking-widest uppercase text-chicago underline underline-offset-2 hover:text-primary transition-colors duration-150"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
