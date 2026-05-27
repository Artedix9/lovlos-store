import { getSupabase } from "./supabase";

export interface HeroImages {
  desktop_src: string;
  mobile_src: string;
}

export const HERO_DEFAULTS: Record<string, HeroImages> = {
  home: {
    desktop_src: "/new-banner02.jpg",
    mobile_src: "/Main Hero Banner-Mobile.png",
  },
  women: {
    desktop_src: "/women-hero-banner01.jpg",
    mobile_src:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
  },
  men: {
    desktop_src: "/men-hero-banner.jpg",
    mobile_src:
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1000&auto=format&fit=crop",
  },
  accessories: {
    desktop_src: "/hero-bannner-accessories01.jpg",
    mobile_src:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop",
  },
};

export async function getHeroImages(page: string): Promise<HeroImages> {
  const defaults = HERO_DEFAULTS[page] ?? HERO_DEFAULTS.home;
  try {
    const { data, error } = await getSupabase()
      .from("hero_images")
      .select("desktop_src, mobile_src")
      .eq("page", page)
      .maybeSingle();

    if (error || !data) return defaults;

    return {
      desktop_src: data.desktop_src || defaults.desktop_src,
      mobile_src: data.mobile_src || defaults.mobile_src,
    };
  } catch {
    return defaults;
  }
}

export async function getAllHeroImages(): Promise<Record<string, HeroImages>> {
  const pages = ["home", "women", "men", "accessories"] as const;
  try {
    const { data, error } = await getSupabase()
      .from("hero_images")
      .select("page, desktop_src, mobile_src");

    if (error || !data) {
      return Object.fromEntries(pages.map((p) => [p, HERO_DEFAULTS[p]]));
    }

    const dbMap = Object.fromEntries(data.map((r) => [r.page, r]));
    return Object.fromEntries(
      pages.map((p) => {
        const row = dbMap[p];
        const def = HERO_DEFAULTS[p];
        return [
          p,
          {
            desktop_src: row?.desktop_src || def.desktop_src,
            mobile_src: row?.mobile_src || def.mobile_src,
          },
        ];
      })
    );
  } catch {
    return Object.fromEntries(pages.map((p) => [p, HERO_DEFAULTS[p]]));
  }
}
