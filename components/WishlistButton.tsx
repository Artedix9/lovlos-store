"use client";

import { useWishlist, type WishlistItem } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";

/** Heart toggle used on product cards (image overlay) and the PDP (square
    button beside Add to Bag). Saved state is shared via WishlistContext. */
export default function WishlistButton({
  item,
  variant = "card",
}: {
  item: WishlistItem;
  variant?: "card" | "pdp";
}) {
  const { has, toggle } = useWishlist();
  const { showToast } = useToast();
  const saved = has(item.id);

  function handleClick(e: React.MouseEvent) {
    /* Cards render inside a product Link — never navigate on toggle */
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(item);
    showToast(added ? `${item.name} saved to wishlist.` : `${item.name} removed from wishlist.`);
  }

  if (variant === "pdp") {
    return (
      <button
        onClick={handleClick}
        aria-label={saved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
        aria-pressed={saved}
        className={[
          "shrink-0 w-14 self-stretch flex items-center justify-center border transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          saved
            ? "border-primary bg-primary text-white"
            : "border-primary text-primary hover:bg-smoke",
        ].join(" ")}
      >
        <IconHeart filled={saved} size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
      aria-pressed={saved}
      className={[
        "absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center",
        "bg-white/90 shadow-sm transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        saved ? "text-primary" : "text-chicago hover:text-primary",
      ].join(" ")}
    >
      <IconHeart filled={saved} size={15} />
    </button>
  );
}

function IconHeart({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
