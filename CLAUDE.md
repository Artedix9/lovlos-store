# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: LOVLOS E-commerce

Full-scale e-commerce website for **LOVLOS** clothing brand.
- **Inspiration:** Alo Yoga — clean, premium, minimalist
- **Target Market:** Tanzania (primary currency: TZS)
- **Tagline:** "Good vibes defined."
- **Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI (planned)

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
```

## Architecture

### Directory Structure
```
app/           # Next.js App Router — layouts, pages, global CSS
components/    # Shared React components (Header, Hero, etc.)
public/        # Static assets (images, fonts)
```

### Key Files
- [app/layout.tsx](app/layout.tsx) — Root layout; loads Inter + Cormorant Garamond fonts, sets metadata
- [app/globals.css](app/globals.css) — Tailwind base + CSS custom properties for the LOVLOS design system
- [tailwind.config.ts](tailwind.config.ts) — Extended Tailwind palette matching `inspiration_styles.css` tokens
- [components/Header.tsx](components/Header.tsx) — Sticky nav with centered wordmark, split left/right nav links, search drawer, cart badge
- [components/Hero.tsx](components/Hero.tsx) — Full-viewport hero with tagline, CTAs, and TZS currency note

### Design System
Design tokens are derived from `inspiration_styles.css` (Alo Yoga source). Key values:
- **Colors:** `--primary: #000`, grays from `--charcoal` (#242424) through `--smoke` (#f2f2f2), `--sand` (#e0d7d1), `--highlight-medium` (#ceb18f)
- **Typography:** `font-sans` (Inter) for body/nav — `font-display` (Cormorant Garamond) for headings/logo
- **Nav style:** `text-xs tracking-widest uppercase` — never bold, always minimal
- **Buttons:** `.btn-primary` (black fill) and `.btn-outline` (black border) — defined as Tailwind `@layer utilities`

### Business Logic
- **Currency:** TZS — display prices as `TZS X,XXX,XXX` format
- **Payments:** Mobile Money (M-Pesa / Tigo Pesa / Airtel Money) + Cash on Delivery — orders are recorded for manual follow-up, no automated payment gateway
- **Checkout flow:** customer provides delivery details → selects payment method → order saved for staff to action

### Image Strategy
Use `next/image` with placeholder `bg-smoke` / gradient backgrounds until real assets arrive. Set `priority` on above-the-fold images.
