export interface PDPProduct {
  id: string;
  name: string;
  category: string;
  categoryHref: string;
  price: number;         // TZS
  badge?: string;
  images: string[];      // ordered: hero first
  sizes: string[];
  description: string;
  materials: string;
  care: string;
  isComingSoon?: boolean;
}

export const PRODUCTS: Record<string, PDPProduct> = {
  "essential-slip-dress": {
    id: "essential-slip-dress",
    name: "Essential Slip Dress",
    category: "Women",
    categoryHref: "/women",
    price: 165000,
    badge: "New",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "The Essential Slip Dress is cut from a whisper-light fabric that drapes effortlessly against the body. A bias-cut silhouette creates natural movement with every step — designed for the woman who dresses with intention. Wear it as a standalone piece or layer it over a relaxed tee for a studio-to-street look.",
    materials:
      "93% LENZING™ ECOVERO™ Viscose, 7% Elastane. Fabric weight: 130 gsm. OEKO-TEX® certified. Lining: 100% Recycled Polyester.",
    care: "Machine wash cold on delicate cycle. Do not tumble dry. Lay flat to dry. Cool iron if needed. Do not bleach.",
  },

  "fluid-wide-leg-trousers": {
    id: "fluid-wide-leg-trousers",
    name: "Fluid Wide-Leg Trousers",
    category: "Women",
    categoryHref: "/women",
    price: 145000,
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Relaxed through the hip and dramatically wide at the hem. These trousers are finished with a clean, elasticated waistband and deep side pockets — the silhouette that makes everything look intentional. Cut from a fabric that moves like water.",
    materials:
      "100% TENCEL™ Lyocell. Fabric weight: 160 gsm. OEKO-TEX® certified.",
    care: "Hand wash or machine wash cold. Do not tumble dry. Iron on low heat.",
  },

  "essential-tee": {
    id: "essential-tee",
    name: "Oversize Tee",
    category: "Men",
    categoryHref: "/men",
    price: 75000,
    badge: "Best Seller",
    images: [
      "/Oversize Tee (alo) front-a.png",
      "/Oversize Tee (alo) front-bpng.png",
      "/Oversize Tee (alo)back.png",
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    description:
      "The benchmark of a clean wardrobe. Slightly boxy through the chest with a relaxed hem drop, the Essential Tee is built from a mid-weight pique cotton that holds its shape wash after wash. A timeless piece engineered to outlast trends.",
    materials:
      "100% Supima Cotton. Fabric weight: 200 gsm. Pre-washed for a lived-in feel from day one.",
    care: "Machine wash cold. Tumble dry low. Do not iron directly on print.",
  },

  "merino-crewneck": {
    id: "merino-crewneck",
    name: "Merino Crewneck",
    category: "Men",
    categoryHref: "/men",
    price: 195000,
    badge: "New",
    images: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1485125639709-a60c3a500bf1?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A fine-gauge Merino crewneck knitted to a relaxed but structured fit. Temperature-regulating and naturally odour-resistant — perfectly suited for Dar es Salaam evenings and cool highland mornings. The ribbed collar and cuffs offer a clean finish that pairs with everything.",
    materials:
      "100% Extra-Fine Merino Wool (17.5 micron). ZQ Merino certified. Knit weight: 12-gauge.",
    care: "Hand wash in cool water with wool detergent. Lay flat to dry. Do not tumble dry or bleach.",
  },

  "canvas-tote": {
    id: "canvas-tote",
    name: "Canvas Tote Bag",
    category: "Accessories",
    categoryHref: "/accessories",
    price: 65000,
    badge: "New",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["One Size"],
    description:
      "The LOVLOS Canvas Tote is crafted from heavyweight washed canvas with a structured base that keeps its shape even when fully loaded. Reinforced handles and an interior zip pocket make this the bag you reach for every day.",
    materials:
      "Exterior: 100% Washed Canvas (600g). Interior lining: 100% Recycled Polyester. Hardware: Brushed brass.",
    care: "Spot clean with a damp cloth. Do not machine wash. Store in dust bag when not in use.",
  },
};

export function getProduct(id: string): PDPProduct | null {
  return PRODUCTS[id] ?? null;
}

export function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}
