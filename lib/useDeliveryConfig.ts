"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DELIVERY, type DeliveryConfig } from "./delivery";

/** Live delivery pricing for client components. Renders with the fallback
 *  constants first, then swaps in the admin-configured values. */
export function useDeliveryConfig(): DeliveryConfig {
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const fee = Number(data.fee);
        const threshold = Number(data.threshold);
        if (Number.isFinite(fee) && fee >= 0 && Number.isFinite(threshold) && threshold > 0) {
          setConfig({ fee, threshold });
        }
      })
      .catch(() => {}); /* fallbacks already rendered */
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
