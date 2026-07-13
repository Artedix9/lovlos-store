import type { SavedOrder } from "./orders";

/** Normalize TZ numbers to international format for wa.me: strip non-digits,
 *  convert leading 0 → 255 (e.g. 0712... → 255712...). */
export function waPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "255" + digits.slice(1);
  if (digits.startsWith("255")) return digits;
  return digits;
}

const SITE = "https://lovlos.com";

export const FOLLOWUP_TEMPLATES = {
  day2: (o: SavedOrder) => {
    const first = o.items?.[0]?.name ?? "order";
    const reviewUrl = o.items?.[0]?.id ? `${SITE}/product/${o.items[0].id}#reviews` : SITE;
    return (
      `Habari ${o.customer_name}! 😊 Hii ni LOVLOS. ` +
      `Order yako (${o.id}) imefika salama? ` +
      `Ukipata muda, tuma picha ukiwa umevaa ${first} — tunapenda ku-feature wateja wetu 📸 ` +
      `Na kama umeipenda, review hapa inatusaidia sana: ${reviewUrl} 🖤`
    );
  },
  day14: (o: SavedOrder) =>
    `Habari ${o.customer_name}! Ni LOVLOS 🖤 ` +
    `Tunatumaini ${o.items?.[0]?.name ?? "order yako"} inakupendeza. ` +
    `Tip ya styling: inaenda vizuri sana na vipande vyetu vingine — angalia looks mpya hapa: ${SITE} ✨`,
  day45: (o: SavedOrder) =>
    `${o.customer_name}, habari za siku nyingi! 🖤 ` +
    `Kama customer wa LOVLOS Drop 001, utapata early access ya drop ijayo kabla ya watu wengine. ` +
    `Tutakutumia link yako binafsi siku moja kabla. Karibu tena: ${SITE}`,
} as const;

export type FollowupKind = keyof typeof FOLLOWUP_TEMPLATES;

export function followupWaUrl(o: SavedOrder, kind: FollowupKind): string {
  return `https://wa.me/${waPhone(o.phone)}?text=${encodeURIComponent(FOLLOWUP_TEMPLATES[kind](o))}`;
}

/** Nudge for orders stuck in pending — payment never confirmed. */
export function pendingNudge(o: SavedOrder): string {
  return (
    `Habari ${o.customer_name}! Hii ni LOVLOS 🖤 ` +
    `Tumeona order yako ${o.id} (TZS ${o.total.toLocaleString("en-TZ")}) bado haijakamilika. ` +
    `Bado ungependa tuiendelee? Lipa kwa M-Pesa/Tigo Pesa/Airtel — Lipa Namba tutakutumia. ` +
    `Kama ulibadilisha mawazo, hakuna shida — tuambie tu 😊`
  );
}

export function pendingNudgeWaUrl(o: SavedOrder): string {
  return `https://wa.me/${waPhone(o.phone)}?text=${encodeURIComponent(pendingNudge(o))}`;
}
