import type { Metadata } from "next";
import WishlistContent from "./WishlistContent";

export const metadata: Metadata = {
  title: "Wishlist — LOVLOS",
  description: "Products you've saved for later at LOVLOS.",
};

export default function WishlistPage() {
  return <WishlistContent />;
}
