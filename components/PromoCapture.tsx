"use client";

import { useEffect } from "react";
import { storePromoFromUrl } from "@/lib/promoStorage";

/** Renders nothing — on first load, stashes a ?promo=CODE / ?code=CODE
 *  query param so checkout can apply it automatically. Lives in Providers
 *  so every campaign landing page captures the code. */
export default function PromoCapture() {
  useEffect(() => {
    storePromoFromUrl(window.location.search);
  }, []);
  return null;
}
