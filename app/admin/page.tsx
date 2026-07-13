"use client";

import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { effectivePrice, type PDPProduct } from "@/lib/products";
import type { SavedOrder } from "@/lib/orders";
import { waPhone, followupWaUrl, pendingNudgeWaUrl, type FollowupKind } from "@/lib/followups";
import { promoLabel, type PromoCode } from "@/lib/promo";
import { SITE_URL } from "@/lib/site";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorEntry {
  name: string;
  hex: string;
  image: string;    // primary — swatch/card thumbnail and gallery hero
  images: string[]; // per-color gallery shown on the product page
}

interface RestockRequest {
  id: string;
  product_id: string;
  phone: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

interface AdminReview {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  body: string;
  photo_url: string | null;
  approved: boolean;
  created_at: string;
}

interface FormState {
  name: string;
  category: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  badge: string;
  images: string[];
  hasColors: boolean;
  colors: ColorEntry[];
  description: string;
  materials: string;
  care: string;
  isComingSoon: boolean;
  preorder: boolean;
  releaseNote: string;
  fit: string;
  fitNotes: string;
  styledWith: string[];
  sizes: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  category: "Women",
  price: "",
  salePrice: "",
  costPrice: "",
  stock: "",
  badge: "",
  images: [],
  hasColors: false,
  colors: [],
  description: "",
  materials: "",
  care: "",
  isComingSoon: false,
  preorder: false,
  releaseNote: "",
  fit: "",
  fitNotes: "",
  styledWith: [],
  sizes: "XS, S, M, L, XL",
};

const SIZE_PRESETS: [string, string][] = [
  ["Apparel", "XS, S, M, L, XL"],
  ["One Size", "One Size"],
  ["Numeric", "38, 39, 40, 41, 42, 43, 44"],
];

const CATEGORIES = ["Men", "Women", "Accessories"] as const;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

const ORDER_STATUSES = ["pending", "confirmed", "dispatched", "delivered", "cancelled"] as const;

/** Confirmed = payment screenshot received, so these count as paid revenue. */
const PAID_STATUSES: ReadonlySet<SavedOrder["status"]> = new Set(["confirmed", "dispatched", "delivered"]);

const STATUS_CLS: Record<SavedOrder["status"], string> = {
  pending: "text-[rgb(var(--adm-amber)/var(--adm-a80))] border-[rgb(var(--adm-amber)/var(--adm-a30))]",
  confirmed: "text-[rgb(var(--adm-sky)/var(--adm-a80))] border-[rgb(var(--adm-sky)/var(--adm-a30))]",
  dispatched: "text-[rgb(var(--adm-violet)/var(--adm-a80))] border-[rgb(var(--adm-violet)/var(--adm-a30))]",
  delivered: "text-[rgb(var(--adm-emerald)/var(--adm-a80))] border-[rgb(var(--adm-emerald)/var(--adm-a30))]",
  cancelled: "text-[rgb(var(--adm-red)/var(--adm-a60))] border-[rgb(var(--adm-red)/var(--adm-a25))]",
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}


/** One-tap customer status update: prefilled WhatsApp message for the order's
 *  current status, or null when there's nothing worth sending (cancelled). */
function statusUpdateLink(o: SavedOrder): { label: string; url: string } | null {
  const total = `TZS ${o.total.toLocaleString("en-TZ")}`;
  let text: string;
  let label: string;
  switch (o.status) {
    case "pending":
      text = `Hello ${o.customer_name}! Thanks for your LOVLOS order ${o.id} (${total}). Please send your payment screenshot here to confirm it — or reply if you have any questions.`;
      label = "Send payment reminder";
      break;
    case "confirmed":
      text = `Hello ${o.customer_name}! Your LOVLOS order ${o.id} is confirmed ✅ We're preparing it for delivery to ${o.city} and will message you the moment it's on the way.`;
      label = "Send confirmation";
      break;
    case "dispatched":
      text = `Hello ${o.customer_name}! Your LOVLOS order ${o.id} is on its way to ${o.city} 🚚 Keep your phone close — you'll get a call on arrival.`;
      label = "Send dispatch update";
      break;
    case "delivered":
      text = `Hello ${o.customer_name}! We hope you're loving your LOVLOS order ${o.id} 🖤 Thank you for shopping with us — we'd love to hear what you think.`;
      label = "Send thank-you";
      break;
    default:
      return null;
  }
  return {
    label,
    url: `https://wa.me/${waPhone(o.phone.replace(/\D/g, ""))}?text=${encodeURIComponent(text)}`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uploadFile(file: File, adminKey: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "x-admin-key": adminKey },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.url as string;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-6">
      <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-3">{label}</p>
      <p className="text-4xl font-light text-[rgb(var(--adm-fg))] tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a40))] mb-1.5 font-bold">
        {label}{required && <span className="text-[rgb(var(--adm-fg)/var(--adm-a30))] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))]";
const textareaCls = "w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))] resize-none";
const selectCls = "w-full bg-[var(--adm-bg2)] border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors";

// ─── ImageGalleryEditor ───────────────────────────────────────────────────────
// Manages an ordered list of image URLs. First = hero.

function ImageGalleryEditor({
  adminKey,
  images,
  onChange,
}: {
  adminKey: string;
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const add = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const url = await uploadFile(file, adminKey);
      onChange([...images, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) add(file);
  };

  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a40))] mb-2 font-bold">
        Product Images
        <span className="text-[rgb(var(--adm-fg)/var(--adm-a20))] ml-1 normal-case tracking-normal font-normal"> — first image is the hero</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative group w-20 h-20 flex-shrink-0 border border-[rgb(var(--adm-fg)/var(--adm-a15))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] tracking-wider uppercase bg-[rgb(var(--adm-fg)/var(--adm-a80))] text-[var(--adm-bg)] py-0.5">
                Hero
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white/70 hover:text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add slot */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`w-20 h-20 border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0 transition-colors ${
            dragOver ? "border-[rgb(var(--adm-fg)/var(--adm-a50))] bg-[rgb(var(--adm-fg)/var(--adm-a05))]" : "border-[rgb(var(--adm-fg)/var(--adm-a15))] hover:border-[rgb(var(--adm-fg)/var(--adm-a35))]"
          } ${uploading ? "opacity-50 cursor-default" : ""}`}
        >
          {uploading ? (
            <div className="w-4 h-4 border border-[rgb(var(--adm-fg)/var(--adm-a30))] border-t-[rgb(var(--adm-fg)/var(--adm-a70))] rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 text-[rgb(var(--adm-fg)/var(--adm-a30))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[8px] tracking-wide uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))]">Add</span>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mt-1.5">{error}</p>}

      <input ref={inputRef} type="file" accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f); e.target.value = ""; }} className="hidden" />
    </div>
  );
}

// ─── ColorVariationsEditor ────────────────────────────────────────────────────

function CompactImageUpload({
  adminKey,
  value,
  onChange,
}: {
  adminKey: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, adminKey);
      onChange(url);
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      {value ? (
        <div className="w-10 h-10 border border-[rgb(var(--adm-fg)/var(--adm-a20))] overflow-hidden group cursor-pointer" onClick={() => inputRef.current?.click()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-10 h-10 border border-dashed border-[rgb(var(--adm-fg)/var(--adm-a20))] hover:border-[rgb(var(--adm-fg)/var(--adm-a40))] flex items-center justify-center transition-colors"
          title="Add color image (optional)"
        >
          {uploading ? (
            <div className="w-3 h-3 border border-[rgb(var(--adm-fg)/var(--adm-a30))] border-t-[rgb(var(--adm-fg)/var(--adm-a70))] rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-[rgb(var(--adm-fg)/var(--adm-a25))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} className="hidden" />
    </div>
  );
}

/** Per-color gallery strip — upload several photos, remove on hover. */
function ColorGalleryUpload({
  adminKey,
  images,
  onChange,
}: {
  adminKey: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAll = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        try {
          urls.push(await uploadFile(file, adminKey));
        } catch {
          /* skip the failed file; the rest still land */
        }
      }
      if (urls.length) onChange([...images, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {images.map((src, i) => (
        <div key={src + i} className="relative w-10 h-10 border border-[rgb(var(--adm-fg)/var(--adm-a15))] overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            aria-label="Remove image"
            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white text-sm leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        title="Add photos for this color"
        className="w-10 h-10 border border-dashed border-[rgb(var(--adm-fg)/var(--adm-a20))] hover:border-[rgb(var(--adm-fg)/var(--adm-a40))] flex items-center justify-center transition-colors text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a60))]"
      >
        {uploading ? (
          <div className="w-3 h-3 border border-[rgb(var(--adm-fg)/var(--adm-a30))] border-t-[rgb(var(--adm-fg)/var(--adm-a70))] rounded-full animate-spin" />
        ) : (
          "+"
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) uploadAll(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

function ColorVariationsEditor({
  adminKey,
  enabled,
  colors,
  onToggle,
  onChange,
}: {
  adminKey: string;
  enabled: boolean;
  colors: ColorEntry[];
  onToggle: (on: boolean) => void;
  onChange: (colors: ColorEntry[]) => void;
}) {
  const addColor = () => onChange([...colors, { name: "", hex: "#000000", image: "", images: [] }]);
  const removeColor = (i: number) => onChange(colors.filter((_, idx) => idx !== i));
  const updateColor = (i: number, patch: Partial<ColorEntry>) =>
    onChange(colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-4 space-y-3">
      {/* Toggle header */}
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a40))] font-bold">Color Variations</p>
          <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mt-0.5">Optional — enables per-color swatches and images on the product page</p>
        </div>
        <div
          onClick={() => onToggle(!enabled)}
          className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-[rgb(var(--adm-fg))]" : "bg-[rgb(var(--adm-fg)/var(--adm-a15))]"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--adm-bg)] transition-all ${enabled ? "left-[18px]" : "left-0.5"}`} />
        </div>
      </label>

      {enabled && (
        <div className="space-y-2 pt-1">
          {/* Column headers */}
          {colors.length > 0 && (
            <div className="grid grid-cols-[40px_1fr_minmax(0,_120px)_40px_24px] gap-2 items-center">
              <span className="text-[8px] uppercase tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a20))]">Swatch</span>
              <span className="text-[8px] uppercase tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a20))]">Color Name</span>
              <span className="text-[8px] uppercase tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a20))]">Hex</span>
              <span className="text-[8px] uppercase tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a20))]">Main</span>
              <span />
            </div>
          )}

          {colors.map((c, i) => (
            <div key={i} className="space-y-2 pb-3 border-b border-[rgb(var(--adm-fg)/var(--adm-a06))] last:border-b-0 last:pb-0">
            <div className="grid grid-cols-[40px_1fr_minmax(0,_120px)_40px_24px] gap-2 items-center">
              {/* Live swatch preview */}
              <div className="w-8 h-8 rounded-full border border-[rgb(var(--adm-fg)/var(--adm-a20))] flex-shrink-0" style={{ backgroundColor: c.hex }} />

              {/* Name */}
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
                placeholder="e.g. Ivory"
                className="bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-2 py-1.5 text-xs focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a15))]"
              />

              {/* Hex */}
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="w-7 h-7 rounded border border-[rgb(var(--adm-fg)/var(--adm-a20))] bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={c.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  maxLength={7}
                  className="bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors w-full"
                />
              </div>

              {/* Optional image */}
              <CompactImageUpload
                adminKey={adminKey}
                value={c.image}
                onChange={(url) => updateColor(i, { image: url })}
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-[rgb(var(--adm-fg)/var(--adm-a20))] hover:text-[rgb(var(--adm-red)/var(--adm-a70))] transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Per-color gallery — these photos replace the shared images
                on the product page when this color is selected */}
            <div className="pl-[48px]">
              <p className="text-[8px] uppercase tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-1.5">
                Photos for this color {c.images.length > 0 && `· ${c.images.length}`}
              </p>
              <ColorGalleryUpload
                adminKey={adminKey}
                images={c.images}
                onChange={(images) => updateColor(i, { images })}
              />
            </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addColor}
            className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors border border-dashed border-[rgb(var(--adm-fg)/var(--adm-a15))] hover:border-[rgb(var(--adm-fg)/var(--adm-a30))] w-full py-2 mt-1"
          >
            + Add Color
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HeroSlot ─────────────────────────────────────────────────────────────────

function HeroSlot({
  adminKey,
  value,
  label,
  onChange,
}: {
  adminKey: string;
  value: string;
  label: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, adminKey);
      onChange(url);
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">{label}</p>
      <div
        className="relative h-24 w-full border border-dashed border-[rgb(var(--adm-fg)/var(--adm-a15))] overflow-hidden cursor-pointer hover:border-[rgb(var(--adm-fg)/var(--adm-a35))] transition-colors group"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {value && !uploading ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[9px] tracking-[0.25em] uppercase text-white font-bold">Replace</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <div className="w-4 h-4 border border-[rgb(var(--adm-fg)/var(--adm-a30))] border-t-[rgb(var(--adm-fg)/var(--adm-a70))] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-[rgb(var(--adm-fg)/var(--adm-a20))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[8px] tracking-wide uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Upload</span>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  // Theme — dark is the default; preference persists per browser
  const [adminTheme, setAdminTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    if (localStorage.getItem("lvl-admin-theme") === "light") setAdminTheme("light");
  }, []);
  const toggleAdminTheme = () =>
    setAdminTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("lvl-admin-theme", next);
      return next;
    });
  const themeCls = adminTheme === "light" ? "adm-light" : "adm-dark";

  // Auth
  const [inputKey, setInputKey] = useState("");
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [products, setProducts] = useState<PDPProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "followups" | "inventory" | "reviews" | "promos" | "hero">("overview");
  const [showModal, setShowModal] = useState(false);

  // Inventory filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "Men" | "Women" | "Accessories">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "coming-soon" | "out-of-stock">("all");
  const [filterBadge, setFilterBadge] = useState<"all" | "New" | "Best Seller" | "none">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Orders
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [statusSaving, setStatusSaving] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [resettingOrders, setResettingOrders] = useState(false);
  const [followupSaving, setFollowupSaving] = useState<string | null>(null);

  // Restock waitlist
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [restockClearing, setRestockClearing] = useState<string | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewActing, setReviewActing] = useState<string | null>(null);

  // Promo codes
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState("");
  const [promoForm, setPromoForm] = useState({ code: "", type: "percent" as PromoCode["discount_type"], value: "", minSubtotal: "", maxUses: "", expiresAt: "" });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoActing, setPromoActing] = useState<string | null>(null);

  // Welcome offer (code shown after email sign-up)
  const [welcomePromo, setWelcomePromo] = useState("");
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [welcomeError, setWelcomeError] = useState("");

  // Order alerts (web push)
  const [pushState, setPushState] = useState<"idle" | "enabling" | "enabled" | "denied" | "unsupported" | "error">("idle");
  const [pushDevices, setPushDevices] = useState<number | null>(null);
  const [pushError, setPushError] = useState("");

  // Email subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberClearing, setSubscriberClearing] = useState<string | null>(null);
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Announcement bar
  const [announcement, setAnnouncement] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  // Delivery pricing
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("");
  const [deliveryThresholdInput, setDeliveryThresholdInput] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliverySaved, setDeliverySaved] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  // Hero images
  const [heroImages, setHeroImages] = useState<Record<string, { desktop_src: string; mobile_src: string }>>({});
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroSaving, setHeroSaving] = useState<string | null>(null);
  const [heroError, setHeroError] = useState("");

  // ── Session restore ────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = sessionStorage.getItem("lvl-admin-key");
    if (stored) setAdminKey(stored);
  }, []);

  const fetchHeroImages = useCallback(async (key: string) => {
    setHeroLoading(true);
    try {
      const res = await fetch("/api/admin/hero", { headers: { "x-admin-key": key } });
      if (res.ok) setHeroImages(await res.json());
    } catch { /* silent */ } finally {
      setHeroLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (key: string) => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": key } });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setOrders(await res.json());
    } catch (e) {
      setOrdersError(e instanceof Error && e.message ? `Failed to load orders: ${e.message}` : "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchRestock = useCallback(async (key: string) => {
    try {
      const res = await fetch("/api/admin/restock", { headers: { "x-admin-key": key } });
      if (res.ok) setRestockRequests(await res.json());
    } catch { /* silent — waitlist is non-critical */ }
  }, []);

  const fetchReviews = useCallback(async (key: string) => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const res = await fetch("/api/admin/reviews", { headers: { "x-admin-key": key } });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setReviews(await res.json());
    } catch (e) {
      setReviewsError(e instanceof Error && e.message ? `Failed to load reviews: ${e.message}` : "Failed to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async (key: string) => {
    try {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": key } });
      if (res.ok) {
        const json = await res.json();
        setAnnouncement(json.announcement ?? "");
        setWelcomePromo(json.welcome_promo ?? "");
        setDeliveryFeeInput(json.delivery_fee ?? "5000");
        setDeliveryThresholdInput(json.free_delivery_threshold ?? "150000");
      }
    } catch { /* silent — editor starts blank */ }
  }, []);

  const fetchPromos = useCallback(async (key: string) => {
    setPromosLoading(true);
    setPromosError("");
    try {
      const res = await fetch("/api/admin/promos", { headers: { "x-admin-key": key } });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setPromos(await res.json());
    } catch (e) {
      setPromosError(e instanceof Error && e.message ? `Failed to load promo codes: ${e.message}` : "Failed to load promo codes.");
    } finally {
      setPromosLoading(false);
    }
  }, []);

  const fetchSubscribers = useCallback(async (key: string) => {
    try {
      const res = await fetch("/api/admin/subscribers", { headers: { "x-admin-key": key } });
      if (res.ok) setSubscribers(await res.json());
    } catch { /* silent — list is non-critical */ }
  }, []);

  const fetchProducts = useCallback(async (key: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-key": key } });
      if (!res.ok) return false;
      setProducts(await res.json());
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    fetchProducts(adminKey).then((ok) => {
      if (!ok) {
        sessionStorage.removeItem("lvl-admin-key");
        setAdminKey(null);
      }
    });
    fetchHeroImages(adminKey);
    fetchOrders(adminKey);
    fetchRestock(adminKey);
    fetchReviews(adminKey);
    fetchSettings(adminKey);
    fetchSubscribers(adminKey);
    fetchPromos(adminKey);
  }, [adminKey, fetchProducts, fetchHeroImages, fetchOrders, fetchRestock, fetchReviews, fetchSettings, fetchSubscribers, fetchPromos]);

  const handleSaveDelivery = async () => {
    if (!adminKey || deliverySaving) return;
    setDeliverySaving(true);
    setDeliveryError("");
    setDeliverySaved(false);
    try {
      for (const [key, value] of [
        ["delivery_fee", deliveryFeeInput.trim()],
        ["free_delivery_threshold", deliveryThresholdInput.trim()],
      ] as const) {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error ?? "Failed to save.");
        }
      }
      setDeliverySaved(true);
      setTimeout(() => setDeliverySaved(false), 2500);
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setDeliverySaving(false);
    }
  };

  /** Mark a Day-2/14/45 touchpoint as sent — removes it from the queue for good. */
  const handleFollowupDone = async (orderId: string, kind: FollowupKind) => {
    if (!adminKey) return;
    setFollowupSaving(`${orderId}:${kind}`);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id: orderId, followup: kind }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, followups_done: { ...(o.followups_done ?? {}), [kind]: true } } : o
        )
      );
    } catch {
      setOrdersError("Failed to mark the follow-up as done. Try again.");
    } finally {
      setFollowupSaving(null);
    }
  };

  /** Testing-phase reset: wipes every order, releases held stock, zeroes
   *  promo redemption counts. Guarded by a typed confirmation. */
  const handleResetOrders = async () => {
    if (!adminKey || resettingOrders) return;
    const typed = window.prompt(
      `This permanently deletes ALL ${orders.length} orders and resets revenue, profit, and promo redemption counts to zero. Stock held by confirmed orders is added back.\n\nProducts, promo codes, reviews, and subscribers are NOT touched.\n\nType RESET to continue:`
    );
    if (typed !== "RESET") return;
    setResettingOrders(true);
    setOrdersError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Reset failed.");
      }
      setOrders([]);
      setExpandedOrder(null);
      /* Stock and promo counters changed server-side — refresh both */
      fetchProducts(adminKey);
      fetchPromos(adminKey);
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setResettingOrders(false);
    }
  };

  // ── Promo code actions ─────────────────────────────────────────────────────

  const handleCreatePromo = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!adminKey) return;
    setPromoSaving(true);
    setPromosError("");
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          code: promoForm.code,
          discount_type: promoForm.type,
          discount_value: Number(promoForm.value),
          min_subtotal: Number(promoForm.minSubtotal) || 0,
          max_uses: promoForm.maxUses.trim() === "" ? null : Number(promoForm.maxUses),
          expires_at: promoForm.expiresAt ? new Date(promoForm.expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to create promo code.");
      }
      setPromoForm({ code: "", type: "percent", value: "", minSubtotal: "", maxUses: "", expiresAt: "" });
      await fetchPromos(adminKey);
    } catch (err) {
      setPromosError(err instanceof Error ? err.message : "Failed to create promo code.");
    } finally {
      setPromoSaving(false);
    }
  };

  const handleTogglePromo = async (promo: PromoCode) => {
    if (!adminKey) return;
    setPromoActing(promo.code);
    setPromosError("");
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ code: promo.code, active: !promo.active }),
      });
      if (!res.ok) throw new Error();
      setPromos((prev) => prev.map((p) => (p.code === promo.code ? { ...p, active: !p.active } : p)));
    } catch {
      setPromosError("Failed to update promo code.");
    } finally {
      setPromoActing(null);
    }
  };

  const handleDeletePromo = async (code: string) => {
    if (!adminKey || !confirm(`Delete promo code ${code}? Customers will no longer be able to use it.`)) return;
    setPromoActing(code);
    setPromosError("");
    try {
      const res = await fetch(`/api/admin/promos?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error();
      setPromos((prev) => prev.filter((p) => p.code !== code));
    } catch {
      setPromosError("Failed to delete promo code.");
    } finally {
      setPromoActing(null);
    }
  };

  const handleSaveWelcome = async () => {
    if (!adminKey) return;
    setWelcomeSaving(true);
    setWelcomeError("");
    setWelcomeSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ key: "welcome_promo", value: welcomePromo }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to save.");
      }
      setWelcomeSaved(true);
      setTimeout(() => setWelcomeSaved(false), 2500);
    } catch (err) {
      setWelcomeError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setWelcomeSaving(false);
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-key": inputKey } });
      if (res.ok) {
        sessionStorage.setItem("lvl-admin-key", inputKey);
        setAdminKey(inputKey);
        setProducts(await res.json());
      } else if (res.status === 429) {
        const json = await res.json().catch(() => null);
        setLoginError(json?.error ?? "Too many attempts. Try again in a few minutes.");
      } else {
        setLoginError("Invalid access key.");
      }
    } catch {
      setLoginError("Connection error. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("lvl-admin-key");
    setAdminKey(null);
    setProducts([]);
    setInputKey("");
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setActionError("");
    setShowModal(true);
  }

  function openEdit(p: PDPProduct) {
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      salePrice: p.salePrice != null ? String(p.salePrice) : "",
      costPrice: p.costPrice != null ? String(p.costPrice) : "",
      stock: String(p.stock ?? 0),
      badge: p.badge ?? "",
      images: p.images ?? [],
      hasColors: (p.colors?.length ?? 0) > 0,
      colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex, image: c.image ?? "", images: c.images ?? [] })),
      description: p.description ?? "",
      materials: p.materials ?? "",
      care: p.care ?? "",
      isComingSoon: p.isComingSoon ?? false,
      preorder: p.preorder ?? false,
      releaseNote: p.releaseNote ?? "",
      fit: p.fit ?? "",
      fitNotes: p.fitNotes ?? "",
      styledWith: p.styledWith ?? [],
      sizes: (p.sizes ?? []).join(", "),
    });
    setActionError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(DEFAULT_FORM);
    setEditId(null);
    setActionError("");
  }

  // ── Save (add or edit) ─────────────────────────────────────────────────────

  const handleSave = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!adminKey) return;
    setSaving(true);
    setActionError("");

    const payload = {
      ...(editId ? { id: editId } : {}),
      name: form.name,
      category: form.category,
      price: Number(form.price),
      salePrice: form.salePrice.trim() === "" ? null : Number(form.salePrice),
      costPrice: form.costPrice.trim() === "" ? null : Number(form.costPrice),
      stock: Number(form.stock) || 0,
      badge: form.badge || undefined,
      images: form.images,
      colors: form.hasColors
        ? form.colors.map((c) => ({
            name: c.name,
            hex: c.hex,
            ...(c.image ? { image: c.image } : {}),
            ...(c.images.filter(Boolean).length ? { images: c.images.filter(Boolean) } : {}),
          }))
        : [],
      description: form.description,
      materials: form.materials,
      care: form.care,
      isComingSoon: form.isComingSoon,
      preorder: form.isComingSoon && form.preorder,
      releaseNote: form.releaseNote,
      fit: form.fit || null,
      fitNotes: form.fitNotes,
      styledWith: form.styledWith,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Save failed");
      }
      const saved: PDPProduct = await res.json();
      if (editId) {
        setProducts((prev) => prev.map((p) => (p.id === editId ? saved : p)));
      } else {
        setProducts((prev) => [...prev, saved]);
      }
      closeModal();
    } catch (e) {
      setActionError(e instanceof Error && e.message !== "Save failed" ? `Failed to save: ${e.message}` : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!adminKey) return;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setActionError(e instanceof Error && e.message ? `Delete failed: ${e.message}` : "Delete failed. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Restock waitlist ───────────────────────────────────────────────────────

  const handleClearRequest = async (id: string) => {
    if (!adminKey) return;
    setRestockClearing(id);
    try {
      const res = await fetch(`/api/admin/restock?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) setRestockRequests((prev) => prev.filter((r) => r.id !== id));
    } catch { /* silent — row stays, admin can retry */ } finally {
      setRestockClearing(null);
    }
  };

  // ── Order alerts (web push) ────────────────────────────────────────────────

  useEffect(() => {
    if (!adminKey) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushState("unsupported");
      return;
    }
    // Reflect an existing subscription and fetch the device count
    navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setPushState("enabled");
    });
    fetch("/api/admin/push", { headers: { "x-admin-key": adminKey } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json) setPushDevices(json.devices); })
      .catch(() => { /* count is cosmetic */ });
  }, [adminKey]);

  const handleEnablePush = async () => {
    if (!adminKey) return;
    setPushState("enabling");
    setPushError("");
    try {
      const keyRes = await fetch("/api/admin/push", { headers: { "x-admin-key": adminKey } });
      const keyJson = await keyRes.json();
      if (!keyRes.ok) throw new Error(keyJson?.error ?? "Push not configured");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) as BufferSource,
        }));

      const saveRes = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ subscription }),
      });
      if (!saveRes.ok) {
        const json = await saveRes.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to save subscription");
      }
      setPushState("enabled");
      setPushDevices((n) => (n ?? 0) + 1);
    } catch (e) {
      setPushError(e instanceof Error && e.message ? e.message : "Could not enable alerts.");
      setPushState("error");
    }
  };

  // ── Review moderation ──────────────────────────────────────────────────────

  const handleReviewApprove = async (id: string, approved: boolean) => {
    if (!adminKey) return;
    setReviewActing(id);
    setReviewsError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id, approved }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)));
    } catch (e) {
      setReviewsError(e instanceof Error && e.message ? `Failed to update review: ${e.message}` : "Failed to update review.");
    } finally {
      setReviewActing(null);
    }
  };

  const handleReviewDelete = async (id: string) => {
    if (!adminKey) return;
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setReviewActing(id);
    setReviewsError("");
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setReviewsError(e instanceof Error && e.message ? `Failed to delete review: ${e.message}` : "Failed to delete review.");
    } finally {
      setReviewActing(null);
    }
  };

  // ── Email subscribers ──────────────────────────────────────────────────────

  const handleRemoveSubscriber = async (id: string) => {
    if (!adminKey) return;
    setSubscriberClearing(id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch { /* row stays, admin can retry */ } finally {
      setSubscriberClearing(null);
    }
  };

  const handleCopyEmails = async () => {
    try {
      await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "));
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch { /* clipboard blocked — admin can select manually */ }
  };

  // ── Announcement bar save ──────────────────────────────────────────────────

  const handleSaveAnnouncement = async () => {
    if (!adminKey) return;
    setAnnouncementSaving(true);
    setAnnouncementError("");
    setAnnouncementSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ key: "announcement", value: announcement.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setAnnouncementSaved(true);
      setTimeout(() => setAnnouncementSaved(false), 2500);
    } catch (e) {
      setAnnouncementError(e instanceof Error && e.message ? `Failed to save: ${e.message}` : "Failed to save. Try again.");
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // ── Order status update ────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, status: SavedOrder["status"]) => {
    if (!adminKey) return;
    setStatusSaving(id);
    setOrdersError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setOrdersError(e instanceof Error && e.message ? `Failed to update status: ${e.message}` : "Failed to update status. Try again.");
    } finally {
      setStatusSaving(null);
    }
  };

  // ── Hero save ──────────────────────────────────────────────────────────────

  const handleSaveHero = async (page: string) => {
    if (!adminKey || !heroImages[page]) return;
    setHeroSaving(page);
    setHeroError("");
    try {
      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ page, ...heroImages[page] }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
    } catch (e) {
      setHeroError(e instanceof Error && e.message ? `Failed to save: ${e.message}` : "Failed to save. Try again.");
    } finally {
      setHeroSaving(null);
    }
  };

  // ── Reorder (storefront display order) ─────────────────────────────────────

  const canReorder = !search && filterCategory === "all" && filterStatus === "all" && filterBadge === "all";

  const handleMove = async (index: number, dir: -1 | 1) => {
    if (!adminKey) return;
    const target = index + dir;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    setProducts(next);
    try {
      const res = await fetch("/api/admin/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "");
      }
    } catch (e) {
      fetchProducts(adminKey); // fall back to the server's order
      setActionError(e instanceof Error && e.message ? `Failed to reorder: ${e.message}` : "Failed to reorder. Try again.");
    }
  };

  // ── Filtered inventory ─────────────────────────────────────────────────────

  const visibleProducts = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterStatus === "live" && p.isComingSoon) return false;
    if (filterStatus === "coming-soon" && !p.isComingSoon) return false;
    if (filterStatus === "out-of-stock" && (p.stock ?? 0) > 0) return false;
    if (filterBadge === "none" && p.badge) return false;
    if (filterBadge !== "all" && filterBadge !== "none" && p.badge !== filterBadge) return false;
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const men = products.filter((p) => p.category === "Men").length;
  const women = products.filter((p) => p.category === "Women").length;
  const accessories = products.filter((p) => p.category === "Accessories").length;
  const unitsInStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const stockValue = products.reduce((sum, p) => sum + (p.stock ?? 0) * effectivePrice(p), 0);
  const stockCost = products.reduce((sum, p) => sum + (p.stock ?? 0) * (p.costPrice ?? 0), 0);
  const outOfStock = products.filter((p) => !p.isComingSoon && (p.stock ?? 0) === 0).length;
  const lowStock = products.filter((p) => !p.isComingSoon && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;

  const pendingReviews = reviews.filter((r) => !r.approved).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const paidOrders = orders.filter((o) => PAID_STATUSES.has(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const now = new Date();
  const monthRevenue = paidOrders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);

  /* Gross profit = item sales − discounts − buying costs. Delivery fees are
     treated as pass-through and excluded. Cost comes from the snapshot taken
     at sale time, falling back to the product's current buying price. */
  let grossProfit = 0;
  let monthProfit = 0;
  let unknownCostUnits = 0;
  for (const o of paidOrders) {
    let cogs = 0;
    for (const item of o.items ?? []) {
      const qty = item.quantity || 1;
      const cost = item.cost ?? products.find((p) => p.id === item.id)?.costPrice ?? null;
      if (cost == null) unknownCostUnits += qty;
      else cogs += cost * qty;
    }
    const orderProfit = o.subtotal - (o.discount ?? 0) - cogs;
    grossProfit += orderProfit;
    const d = new Date(o.created_at);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      monthProfit += orderProfit;
    }
  }
  const missingCostProducts = products.filter((p) => p.costPrice == null).length;

  /* ── Follow-up queue (Day-2 review ask · Day-14 styling tip · Day-45 win-back) ── */
  const daysSince = (iso: string) => (now.getTime() - new Date(iso).getTime()) / 86_400_000;
  const deliveredOrdersList = orders.filter(
    (o) => o.status === "delivered" && o.status_history?.delivered
  );
  const day2Queue = deliveredOrdersList.filter((o) => {
    const d = daysSince(o.status_history!.delivered!);
    return d >= 2 && d <= 6 && !o.followups_done?.day2;
  });
  const day14Queue = deliveredOrdersList.filter((o) => {
    const d = daysSince(o.status_history!.delivered!);
    return d >= 13 && d <= 20 && !o.followups_done?.day14;
  });
  const day45Queue = deliveredOrdersList.filter((o) => {
    if (daysSince(o.status_history!.delivered!) < 42 || o.followups_done?.day45) return false;
    /* Never win-back someone who already came back on their own */
    const phone = waPhone(o.phone);
    return !orders.some(
      (x) =>
        x.id !== o.id &&
        waPhone(x.phone) === phone &&
        new Date(x.created_at) > new Date(o.created_at)
    );
  });
  const stalePending = orders
    .filter((o) => o.status === "pending" && daysSince(o.created_at) >= 1)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const followupsDue = day2Queue.length + day14Queue.length + day45Queue.length + stalePending.length;

  /* Promo performance — cancelled orders excluded so abandoned promos don't inflate the numbers */
  const promoOrders = orders.filter((o) => o.promo_code && (o.discount ?? 0) > 0 && o.status !== "cancelled");
  const discountGiven = promoOrders.reduce((sum, o) => sum + (o.discount ?? 0), 0);
  const totalRedemptions = promos.reduce((sum, p) => sum + p.use_count, 0);
  const activeCodes = promos.filter(
    (p) =>
      p.active &&
      (p.expires_at == null || new Date(p.expires_at).getTime() >= Date.now()) &&
      (p.max_uses == null || p.use_count < p.max_uses)
  ).length;
  const promoRows = promos
    .map((p) => {
      const codeOrders = promoOrders.filter((o) => o.promo_code === p.code);
      return {
        code: p.code,
        label: promoLabel(p),
        uses: p.use_count,
        discount: codeOrders.reduce((sum, o) => sum + (o.discount ?? 0), 0),
        revenue: codeOrders.filter((o) => PAID_STATUSES.has(o.status)).reduce((sum, o) => sum + o.total, 0),
      };
    })
    .filter((r) => r.uses > 0)
    .sort((a, b) => b.uses - a.uses);

  // ── Login screen ───────────────────────────────────────────────────────────

  if (!adminKey) {
    return (
      <div className={`${themeCls} min-h-screen bg-[var(--adm-bg)] flex flex-col items-center justify-center p-6`}>
        <div className="w-full max-w-[340px]">
          <p className="text-[9px] tracking-[0.5em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] text-center mb-1">LOVLOS</p>
          <h1 className="text-xl font-light text-[rgb(var(--adm-fg))] text-center tracking-[0.35em] uppercase mb-10">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="ACCESS KEY"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              autoFocus
              required
              className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))] px-4 py-3 text-xs tracking-widest uppercase focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors"
            />
            {loginError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-widest text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[10px] tracking-[0.3em] uppercase py-3 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40"
            >
              {loginLoading ? "VERIFYING..." : "ENTER"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className={`${themeCls} min-h-screen bg-[var(--adm-bg)] text-[rgb(var(--adm-fg))]`}>
      <header className="border-b border-[rgb(var(--adm-fg)/var(--adm-a08))] px-6 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="text-[10px] tracking-[0.45em] uppercase font-bold">LOVLOS</span>
          <span className="text-[rgb(var(--adm-fg)/var(--adm-a15))] text-lg leading-none">|</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))]">ADMIN</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleAdminTheme}
            aria-label={adminTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors"
          >
            {adminTheme === "dark" ? "☀ LIGHT" : "☾ DARK"}
          </button>
          <button onClick={handleSignOut} className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors">
            SIGN OUT
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <nav className="flex gap-8 border-b border-[rgb(var(--adm-fg)/var(--adm-a08))] mb-10">
          {(["overview", "orders", "followups", "inventory", "reviews", "promos", "hero"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] tracking-[0.3em] uppercase transition-colors ${
                activeTab === tab ? "text-[rgb(var(--adm-fg))] border-b border-[rgb(var(--adm-fg))] -mb-px" : "text-[rgb(var(--adm-fg)/var(--adm-a25))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))]"
              }`}
            >
              {tab === "hero" ? "Site & Banners" : tab === "followups" ? "Follow-ups" : tab}
              {tab === "followups" && followupsDue > 0 && (
                <span className="ml-1.5 text-[8px] text-[rgb(var(--adm-amber)/var(--adm-a80))] tabular-nums">{followupsDue}</span>
              )}
              {tab === "orders" && pendingOrders > 0 && (
                <span className="ml-1.5 text-[8px] text-[rgb(var(--adm-amber)/var(--adm-a80))] tabular-nums">{pendingOrders}</span>
              )}
              {tab === "reviews" && pendingReviews > 0 && (
                <span className="ml-1.5 text-[8px] text-[rgb(var(--adm-amber)/var(--adm-a80))] tabular-nums">{pendingReviews}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-6">Orders &amp; Revenue</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Orders" value={orders.length} />
              <StatCard label="Pending" value={pendingOrders} sub="Awaiting payment confirmation" />
              <StatCard label="Delivered" value={deliveredOrders} />
              <StatCard label="Email Subscribers" value={subscribers.length} sub="Footer + checkout sign-ups" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-10">
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-6">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-3">Revenue</p>
                <p className="text-4xl font-light">TZS {revenue.toLocaleString("en-TZ")}</p>
                <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-1.5">
                  Confirmed, dispatched &amp; delivered orders · TZS {monthRevenue.toLocaleString("en-TZ")} this month
                </p>
              </div>
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-6">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-3">Gross Profit</p>
                <p className={`text-4xl font-light ${grossProfit < 0 ? "text-[rgb(var(--adm-red)/var(--adm-a80))]" : ""}`}>
                  TZS {grossProfit.toLocaleString("en-TZ")}
                </p>
                <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-1.5">
                  Sales − discounts − buying costs (delivery excluded) · TZS {monthProfit.toLocaleString("en-TZ")} this month
                </p>
                {unknownCostUnits > 0 && (
                  <p className="text-[10px] text-[rgb(var(--adm-amber)/var(--adm-a60))] mt-1.5">
                    {unknownCostUnits} sold {unknownCostUnits === 1 ? "unit has" : "units have"} no buying price — profit is overstated until costs are filled in
                  </p>
                )}
              </div>
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-6">Promotions</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Active Codes" value={activeCodes} sub="Live, unexpired, not fully redeemed" />
              <StatCard label="Redemptions" value={totalRedemptions} />
              <StatCard label="Discount Given" value={`TZS ${discountGiven.toLocaleString("en-TZ")}`} sub="Across all non-cancelled orders" />
              <StatCard label="Promo Revenue" value={`TZS ${promoRows.reduce((s, r) => s + r.revenue, 0).toLocaleString("en-TZ")}`} sub="Paid orders that used a code" />
            </div>
            {promoRows.length > 0 && (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] mb-10 overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-[rgb(var(--adm-fg)/var(--adm-a08))]">
                      {["Code", "Uses", "Discount (TZS)", "Revenue (TZS)"].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promoRows.map((r) => (
                      <tr key={r.code} className="border-b border-[rgb(var(--adm-fg)/var(--adm-a04))]">
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-[rgb(var(--adm-fg))]">{r.code}</span>
                          <span className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a30))] ml-2">{r.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] tabular-nums">{r.uses}</td>
                        <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] tabular-nums">{r.discount.toLocaleString("en-TZ")}</td>
                        <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a80))] tabular-nums">{r.revenue.toLocaleString("en-TZ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {promoRows.length === 0 && <div className="mb-10" />}

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-6">Inventory Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Products" value={products.length} />
              <StatCard label="Men's Items" value={men} />
              <StatCard label="Women's Items" value={women} />
              <StatCard label="Accessories" value={accessories} />
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-6 mt-10">Stock &amp; Value</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatCard label="Units in Stock" value={unitsInStock.toLocaleString("en-TZ")} sub="Total units across all products" />
              <StatCard label="Low Stock" value={lowStock} sub="Live products with 5 or fewer units" />
              <StatCard label="Out of Stock" value={outOfStock} sub="Live products with zero units" />
            </div>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-3">Stock Value</p>
              <p className="text-4xl font-light">TZS {stockValue.toLocaleString("en-TZ")}</p>
              <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-1.5">Units in stock × price — revenue if everything on hand sells</p>
              <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-1.5">
                Tied up in stock: TZS {stockCost.toLocaleString("en-TZ")} · potential profit TZS {(stockValue - stockCost).toLocaleString("en-TZ")}
                {missingCostProducts > 0 && (
                  <span className="text-[rgb(var(--adm-amber)/var(--adm-a60))]"> · {missingCostProducts} {missingCostProducts === 1 ? "product has" : "products have"} no buying price</span>
                )}
              </p>
            </div>
          </section>
        )}

        {/* ── Orders ────────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))]">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                {pendingOrders > 0 && <span className="text-[rgb(var(--adm-amber)/var(--adm-a60))] ml-2">· {pendingOrders} pending</span>}
              </p>
              <div className="flex items-center gap-5">
                {orders.length > 0 && (
                  <button
                    onClick={handleResetOrders}
                    disabled={resettingOrders}
                    title="Delete all orders and reset revenue — for the testing phase"
                    className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-red)/var(--adm-a50))] hover:text-[rgb(var(--adm-red)/var(--adm-a90))] transition-colors disabled:opacity-40"
                  >
                    {resettingOrders ? "Resetting..." : "Reset All (Test Data)"}
                  </button>
                )}
                <button
                  onClick={() => adminKey && fetchOrders(adminKey)}
                  disabled={ordersLoading}
                  className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors disabled:opacity-40"
                >
                  Refresh
                </button>
              </div>
            </div>

            {ordersError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mb-4">{ordersError}</p>}

            {ordersLoading ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Loading...</div>
            ) : (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-[rgb(var(--adm-fg)/var(--adm-a08))]">
                      {["Order", "Date", "Customer", "City", "Payment", "Total (TZS)", "Status"].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <Fragment key={o.id}>
                        <tr
                          onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                          className="border-b border-[rgb(var(--adm-fg)/var(--adm-a04))] hover:bg-[rgb(var(--adm-fg)/var(--adm-a015))] transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-[rgb(var(--adm-fg))]">{o.id}</span>
                            {o.items.some((i) => i.preorder) && (
                              <span className="ml-2 text-[8px] tracking-wider uppercase border border-[rgb(var(--adm-sky)/var(--adm-a30))] text-[rgb(var(--adm-sky)/var(--adm-a70))] px-1.5 py-0.5">Pre-Order</span>
                            )}
                            <span className={`ml-2 inline-block text-[rgb(var(--adm-fg)/var(--adm-a25))] text-[9px] transition-transform ${expandedOrder === o.id ? "rotate-90" : ""}`}>▸</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] whitespace-nowrap">{formatOrderDate(o.created_at)}</td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a80))]">{o.customer_name}</p>
                            <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a30))] mt-0.5">{o.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))]">{o.city}</td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] whitespace-nowrap">
                            {o.payment_method === "mobile-money" ? "Mobile Money" : "Cash on Delivery"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a80))] tabular-nums">{o.total.toLocaleString("en-TZ")}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={o.status}
                              disabled={statusSaving === o.id}
                              onChange={(e) => handleStatusChange(o.id, e.target.value as SavedOrder["status"])}
                              className={`bg-[var(--adm-bg2)] border text-[9px] tracking-[0.15em] uppercase px-2 py-1.5 focus:outline-none transition-colors disabled:opacity-40 cursor-pointer ${STATUS_CLS[o.status]}`}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s} className="text-[rgb(var(--adm-fg))] bg-[var(--adm-bg2)]">{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {expandedOrder === o.id && (
                          <tr className="border-b border-[rgb(var(--adm-fg)/var(--adm-a04))] bg-[rgb(var(--adm-fg)/var(--adm-a01))]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
                                {/* Items */}
                                <div>
                                  <p className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Items</p>
                                  <div className="space-y-1.5">
                                    {o.items.map((item, i) => (
                                      <div key={i} className="flex items-baseline justify-between gap-4 text-xs">
                                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a70))]">
                                          {item.name}
                                          {item.preorder && (
                                            <span className="text-[8px] tracking-wider uppercase text-[rgb(var(--adm-sky)/var(--adm-a70))] ml-1.5">Pre-Order</span>
                                          )}
                                          <span className="text-[rgb(var(--adm-fg)/var(--adm-a30))] ml-2">
                                            {[item.color, item.size].filter(Boolean).join(" · ")} × {item.quantity}
                                          </span>
                                        </span>
                                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a50))] tabular-nums whitespace-nowrap">
                                          {(item.price * item.quantity).toLocaleString("en-TZ")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="border-t border-[rgb(var(--adm-fg)/var(--adm-a06))] mt-3 pt-2 space-y-1 text-[11px]">
                                    <div className="flex justify-between text-[rgb(var(--adm-fg)/var(--adm-a40))]">
                                      <span>Subtotal</span><span className="tabular-nums">{o.subtotal.toLocaleString("en-TZ")}</span>
                                    </div>
                                    {(o.discount ?? 0) > 0 && (
                                      <div className="flex justify-between text-[rgb(var(--adm-emerald)/var(--adm-a60))]">
                                        <span>Discount{o.promo_code ? ` (${o.promo_code})` : ""}</span>
                                        <span className="tabular-nums">−{(o.discount ?? 0).toLocaleString("en-TZ")}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-[rgb(var(--adm-fg)/var(--adm-a40))]">
                                      <span>Delivery</span><span className="tabular-nums">{o.delivery_fee.toLocaleString("en-TZ")}</span>
                                    </div>
                                    <div className="flex justify-between text-[rgb(var(--adm-fg)/var(--adm-a80))]">
                                      <span>Total</span><span className="tabular-nums">{o.total.toLocaleString("en-TZ")}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Contact / delivery */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-1">Contact</p>
                                    <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a60))]">{o.email || "—"}</p>
                                    <a
                                      href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "255")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[rgb(var(--adm-emerald)/var(--adm-a70))] hover:text-[rgb(var(--adm-emerald))] transition-colors"
                                    >
                                      WhatsApp {o.phone}
                                    </a>
                                    {(() => {
                                      const update = statusUpdateLink(o);
                                      return update ? (
                                        <a
                                          href={update.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block mt-1.5 text-[10px] tracking-[0.15em] uppercase text-[rgb(var(--adm-sky)/var(--adm-a70))] hover:text-[rgb(var(--adm-sky))] transition-colors"
                                        >
                                          {update.label} ↗
                                        </a>
                                      ) : null;
                                    })()}
                                  </div>
                                  <div>
                                    <p className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-1">Delivery Note</p>
                                    <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a60))]">{o.delivery_note || "—"}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a15))]">
                          No orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Follow-ups ────────────────────────────────────────────────────── */}
        {activeTab === "followups" && (
          <section>
            {ordersError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mb-4">{ordersError}</p>}

            {followupsDue === 0 && (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">
                All caught up — nothing due today
              </div>
            )}

            {([
              {
                kind: "day2" as const,
                title: "Day 2 — Review & photo ask",
                hint: "Delivered 2–6 days ago. Ask how it fits, invite a review and a photo.",
                queue: day2Queue,
              },
              {
                kind: "day14" as const,
                title: "Day 14 — Styling tip",
                hint: "Delivered about two weeks ago. Share a styling idea, point at new looks.",
                queue: day14Queue,
              },
              {
                kind: "day45" as const,
                title: "Day 45 — Win-back",
                hint: "No repeat order in 6+ weeks. Offer early access to the next drop.",
                queue: day45Queue,
              },
            ]).map(({ kind, title, hint, queue }) =>
              queue.length === 0 ? null : (
                <div key={kind} className="mb-10">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-1">
                    {title} · {queue.length}
                  </p>
                  <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">{hint}</p>
                  <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] divide-y divide-[rgb(var(--adm-fg)/var(--adm-a04))]">
                    {queue.map((o) => (
                      <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-xs">
                        <span className="font-mono text-[rgb(var(--adm-fg))]">{o.id}</span>
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a70))]">{o.customer_name}</span>
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a40))]">{o.phone}</span>
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a40))] flex-1 min-w-0 truncate">
                          {o.items?.[0]?.name}
                          {(o.items?.length ?? 0) > 1 ? ` +${o.items.length - 1} more` : ""}
                        </span>
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a30))] tabular-nums whitespace-nowrap">
                          {Math.floor(daysSince(o.status_history!.delivered!))}d since delivery
                        </span>
                        <a
                          href={followupWaUrl(o, kind)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[rgb(var(--adm-emerald)/var(--adm-a70))] hover:text-[rgb(var(--adm-emerald))] transition-colors whitespace-nowrap"
                        >
                          Message ↗
                        </a>
                        <button
                          onClick={() => handleFollowupDone(o.id, kind)}
                          disabled={followupSaving === `${o.id}:${kind}`}
                          className="text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a70))] transition-colors disabled:opacity-40"
                        >
                          {followupSaving === `${o.id}:${kind}` ? "..." : "Done"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {stalePending.length > 0 && (
              <div className="mb-10">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-amber)/var(--adm-a70))] mb-1">
                  Stale pending · {stalePending.length}
                </p>
                <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">
                  Ordered over 24h ago, payment never confirmed. Nudge them — oldest first. Rows clear when the order is confirmed or cancelled.
                </p>
                <div className="border border-[rgb(var(--adm-amber)/var(--adm-a20))] divide-y divide-[rgb(var(--adm-fg)/var(--adm-a04))]">
                  {stalePending.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-xs">
                      <span className="font-mono text-[rgb(var(--adm-fg))]">{o.id}</span>
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a70))]">{o.customer_name}</span>
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a40))]">{o.phone}</span>
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a40))] flex-1 min-w-0 truncate tabular-nums">
                        TZS {o.total.toLocaleString("en-TZ")}
                      </span>
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a30))] tabular-nums whitespace-nowrap">
                        {Math.floor(daysSince(o.created_at))}d pending
                      </span>
                      <a
                        href={pendingNudgeWaUrl(o)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgb(var(--adm-emerald)/var(--adm-a70))] hover:text-[rgb(var(--adm-emerald))] transition-colors whitespace-nowrap"
                      >
                        Message ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Inventory ─────────────────────────────────────────────────────── */}
        {activeTab === "inventory" && (
          <section>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))]">
                {visibleProducts.length === products.length
                  ? `${products.length} ${products.length === 1 ? "Product" : "Products"}`
                  : `${visibleProducts.length} of ${products.length}`}
              </p>
              <button
                onClick={openAdd}
                className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-5 py-2 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors"
              >
                + ADD PRODUCT
              </button>
            </div>

            {/* Restock waitlist — customers waiting on sold-out products */}
            {restockRequests.length > 0 && (
              <div className="border border-[rgb(var(--adm-amber)/var(--adm-a20))] p-4 mb-6">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-amber)/var(--adm-a70))] mb-3">
                  Restock Waitlist · {restockRequests.length} {restockRequests.length === 1 ? "customer" : "customers"} waiting
                </p>
                <div className="space-y-2">
                  {restockRequests.map((r) => {
                    const product = products.find((p) => p.id === r.product_id);
                    const name = product?.name ?? r.product_id;
                    const waText = encodeURIComponent(
                      `Hello! Great news — the ${name} you asked about is back in stock at LOVLOS. Order it here: ${SITE_URL}/product/${r.product_id}`
                    );
                    return (
                      <div key={r.id} className="flex items-center gap-4 text-xs">
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a70))] flex-1 min-w-0 truncate">{name}</span>
                        <a
                          href={`https://wa.me/${waPhone(r.phone)}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[rgb(var(--adm-emerald)/var(--adm-a70))] hover:text-[rgb(var(--adm-emerald))] transition-colors whitespace-nowrap"
                        >
                          WhatsApp {r.phone}
                        </a>
                        <span className="text-[rgb(var(--adm-fg)/var(--adm-a25))] whitespace-nowrap hidden sm:inline">{formatOrderDate(r.created_at)}</span>
                        <button
                          onClick={() => handleClearRequest(r.id)}
                          disabled={restockClearing === r.id}
                          title="Notified — remove from waitlist"
                          className="text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a70))] transition-colors disabled:opacity-30"
                        >
                          {restockClearing === r.id ? "..." : "Done"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] p-4 mb-6 space-y-3">
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a15))] text-[rgb(var(--adm-fg))] text-xs px-3 py-2 focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a40))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))]"
              />

              {/* Pills row */}
              <div className="flex flex-wrap gap-4">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))] shrink-0">Category</span>
                  <div className="flex gap-1">
                    {(["all", "Men", "Women", "Accessories"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setFilterCategory(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterCategory === v
                            ? "border-[rgb(var(--adm-fg)/var(--adm-a60))] text-[rgb(var(--adm-fg))] bg-[rgb(var(--adm-fg)/var(--adm-a10))]"
                            : "border-[rgb(var(--adm-fg)/var(--adm-a15))] text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:border-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))]"
                        }`}
                      >
                        {v === "all" ? "All" : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))] shrink-0">Status</span>
                  <div className="flex gap-1">
                    {([["all", "All"], ["live", "Live"], ["coming-soon", "Coming Soon"], ["out-of-stock", "Out of Stock"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setFilterStatus(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterStatus === v
                            ? "border-[rgb(var(--adm-fg)/var(--adm-a60))] text-[rgb(var(--adm-fg))] bg-[rgb(var(--adm-fg)/var(--adm-a10))]"
                            : "border-[rgb(var(--adm-fg)/var(--adm-a15))] text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:border-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))] shrink-0">Badge</span>
                  <div className="flex gap-1">
                    {([["all", "All"], ["New", "New"], ["Best Seller", "Best Seller"], ["none", "None"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setFilterBadge(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterBadge === v
                            ? "border-[rgb(var(--adm-fg)/var(--adm-a60))] text-[rgb(var(--adm-fg))] bg-[rgb(var(--adm-fg)/var(--adm-a10))]"
                            : "border-[rgb(var(--adm-fg)/var(--adm-a15))] text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:border-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear — only shown when any filter is active */}
                {(search || filterCategory !== "all" || filterStatus !== "all" || filterBadge !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setFilterCategory("all"); setFilterStatus("all"); setFilterBadge("all"); }}
                    className="text-[8px] tracking-[0.2em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] hover:text-[rgb(var(--adm-fg)/var(--adm-a50))] transition-colors ml-auto"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {actionError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mb-4">{actionError}</p>}

            {loading ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Loading...</div>
            ) : (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[rgb(var(--adm-fg)/var(--adm-a08))]">
                      {["", "Name", "Category", "Price (TZS)", "Stock", "Badge", "Status", ""].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p, rowIdx) => (
                      <tr key={p.id} className="border-b border-[rgb(var(--adm-fg)/var(--adm-a04))] hover:bg-[rgb(var(--adm-fg)/var(--adm-a015))] transition-colors group">
                        <td className="px-4 py-3 w-14">
                          <div className="w-10 h-10 bg-[rgb(var(--adm-fg)/var(--adm-a05))] border border-[rgb(var(--adm-fg)/var(--adm-a10))] overflow-hidden flex-shrink-0">
                            {p.images[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[rgb(var(--adm-fg))]">{p.name}</p>
                          <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a25))] mt-0.5 font-mono">{p.id}</p>
                          {(p.colors?.length ?? 0) > 0 && (
                            <div className="flex gap-1 mt-1">
                              {p.colors!.map((c) => (
                                <div key={c.name} title={c.name} className="w-3 h-3 rounded-full border border-[rgb(var(--adm-fg)/var(--adm-a20))]" style={{ backgroundColor: c.hex }} />
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))]">{p.category}</td>
                        <td className="px-4 py-3 text-xs tabular-nums">
                          {p.salePrice != null ? (
                            <>
                              <span className="text-[rgb(var(--adm-red)/var(--adm-a80))]">{p.salePrice.toLocaleString("en-TZ")}</span>
                              <span className="text-[rgb(var(--adm-fg)/var(--adm-a25))] line-through ml-2">{p.price.toLocaleString("en-TZ")}</span>
                            </>
                          ) : (
                            <span className="text-[rgb(var(--adm-fg)/var(--adm-a50))]">{p.price.toLocaleString("en-TZ")}</span>
                          )}
                          {p.costPrice != null ? (
                            (() => {
                              const margin = effectivePrice(p) - p.costPrice!;
                              return (
                                <p className={`text-[9px] mt-0.5 ${margin < 0 ? "text-[rgb(var(--adm-red)/var(--adm-a80))]" : "text-[rgb(var(--adm-fg)/var(--adm-a25))]"}`}>
                                  cost {p.costPrice!.toLocaleString("en-TZ")} · {margin < 0 ? "loss" : "margin"}{" "}
                                  {Math.abs(margin).toLocaleString("en-TZ")}
                                </p>
                              );
                            })()
                          ) : (
                            <p className="text-[9px] text-[rgb(var(--adm-amber)/var(--adm-a50))] mt-0.5">no buying price</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(p.stock ?? 0) === 0 ? (
                            <span className="text-[9px] tracking-wider uppercase text-[rgb(var(--adm-red)/var(--adm-a70))]">Out</span>
                          ) : (
                            <span className={`text-xs tabular-nums ${(p.stock ?? 0) <= 5 ? "text-[rgb(var(--adm-amber)/var(--adm-a80))]" : "text-[rgb(var(--adm-fg)/var(--adm-a50))]"}`}>
                              {p.stock}
                            </span>
                          )}
                          {(() => {
                            const waiting = restockRequests.filter((r) => r.product_id === p.id).length;
                            return waiting > 0 ? (
                              <p className="text-[9px] text-[rgb(var(--adm-amber)/var(--adm-a50))] mt-0.5">{waiting} waiting</p>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {p.badge ? (
                            <span className="text-[9px] tracking-wider uppercase border border-[rgb(var(--adm-fg)/var(--adm-a20))] px-2 py-0.5 text-[rgb(var(--adm-fg)/var(--adm-a50))]">{p.badge}</span>
                          ) : (
                            <span className="text-[rgb(var(--adm-fg)/var(--adm-a15))]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.isComingSoon && p.preorder ? (
                            <span className="text-[9px] tracking-wider uppercase text-[rgb(var(--adm-sky)/var(--adm-a70))]">Pre-Order</span>
                          ) : p.isComingSoon ? (
                            <span className="text-[9px] tracking-wider uppercase text-[rgb(var(--adm-amber)/var(--adm-a60))]">Coming Soon</span>
                          ) : (
                            <span className="text-[9px] tracking-wider uppercase text-[rgb(var(--adm-emerald)/var(--adm-a60))]">Live</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canReorder && (
                              <span className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMove(rowIdx, -1)}
                                  disabled={rowIdx === 0}
                                  aria-label={`Move ${p.name} up`}
                                  className="text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg))] transition-colors disabled:opacity-20 disabled:hover:text-[rgb(var(--adm-fg)/var(--adm-a30))] px-1"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => handleMove(rowIdx, 1)}
                                  disabled={rowIdx === visibleProducts.length - 1}
                                  aria-label={`Move ${p.name} down`}
                                  className="text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg))] transition-colors disabled:opacity-20 disabled:hover:text-[rgb(var(--adm-fg)/var(--adm-a30))] px-1"
                                >
                                  ↓
                                </button>
                              </span>
                            )}
                            <button onClick={() => openEdit(p)} className="text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a40))] hover:text-[rgb(var(--adm-fg))] transition-colors">EDIT</button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              disabled={deletingId === p.id}
                              className="text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--adm-red)/var(--adm-a50))] hover:text-[rgb(var(--adm-red))] transition-colors disabled:opacity-30"
                            >
                              {deletingId === p.id ? "..." : "DELETE"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a15))]">
                          {products.length === 0 ? "No products yet" : "No products match the current filters"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">
              Customer Reviews
              {pendingReviews > 0 && <span className="text-[rgb(var(--adm-amber)/var(--adm-a60))] ml-2 normal-case tracking-normal">· {pendingReviews} awaiting approval</span>}
            </p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-8">Reviews only appear on the product page after you approve them.</p>

            {reviewsError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mb-4">{reviewsError}</p>}

            {reviewsLoading ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Loading...</div>
            ) : reviews.length === 0 ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a15))]">No reviews yet</div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const product = products.find((p) => p.id === r.product_id);
                  return (
                    <div key={r.id} className={`border p-5 ${r.approved ? "border-[rgb(var(--adm-fg)/var(--adm-a08))]" : "border-[rgb(var(--adm-amber)/var(--adm-a25))]"}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a80))]">
                            {r.author}
                            <span className="text-[rgb(var(--adm-fg)/var(--adm-a25))] ml-2">on {product?.name ?? r.product_id}</span>
                          </p>
                          <p className="text-[rgb(var(--adm-amber)/var(--adm-a80))] text-xs tracking-[0.2em] mt-1" aria-label={`${r.rating} out of 5 stars`}>
                            {"★".repeat(r.rating)}<span className="text-[rgb(var(--adm-fg)/var(--adm-a15))]">{"★".repeat(5 - r.rating)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[9px] tracking-wider uppercase ${r.approved ? "text-[rgb(var(--adm-emerald)/var(--adm-a60))]" : "text-[rgb(var(--adm-amber)/var(--adm-a70))]"}`}>
                            {r.approved ? "Live" : "Pending"}
                          </span>
                          <span className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] hidden sm:inline">{formatOrderDate(r.created_at)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] leading-relaxed mb-3">{r.body}</p>

                      {r.photo_url && (
                        <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.photo_url} alt="Review photo" className="w-16 h-16 object-cover border border-[rgb(var(--adm-fg)/var(--adm-a15))]" />
                        </a>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => handleReviewApprove(r.id, !r.approved)}
                          disabled={reviewActing === r.id}
                          className={`text-[9px] tracking-[0.2em] uppercase transition-colors disabled:opacity-30 ${
                            r.approved ? "text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a60))]" : "text-[rgb(var(--adm-emerald)/var(--adm-a70))] hover:text-[rgb(var(--adm-emerald))]"
                          }`}
                        >
                          {reviewActing === r.id ? "..." : r.approved ? "Unpublish" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReviewDelete(r.id)}
                          disabled={reviewActing === r.id}
                          className="text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--adm-red)/var(--adm-a50))] hover:text-[rgb(var(--adm-red))] transition-colors disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Promo Codes ───────────────────────────────────────────────────── */}
        {activeTab === "promos" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Create Promo Code</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Customers enter the code at checkout. Percent codes take a share of the subtotal; fixed codes take a flat TZS amount.</p>
            <form onSubmit={handleCreatePromo} className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Code</label>
                  <input
                    type="text"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="KARIBU10"
                    required
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))] uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Type</label>
                  <select
                    value={promoForm.type}
                    onChange={(e) => setPromoForm((f) => ({ ...f, type: e.target.value as PromoCode["discount_type"] }))}
                    className="w-full bg-[var(--adm-bg2)] border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors cursor-pointer"
                  >
                    <option value="percent">% off</option>
                    <option value="fixed">TZS off</option>
                    <option value="free_delivery">Free delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">
                    {promoForm.type === "percent" ? "Percent" : promoForm.type === "fixed" ? "Amount (TZS)" : "Amount"}
                  </label>
                  <input
                    type="number"
                    value={promoForm.type === "free_delivery" ? "" : promoForm.value}
                    onChange={(e) => setPromoForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={promoForm.type === "percent" ? "10" : promoForm.type === "fixed" ? "5000" : "—"}
                    min={1}
                    max={promoForm.type === "percent" ? 100 : undefined}
                    required={promoForm.type !== "free_delivery"}
                    disabled={promoForm.type === "free_delivery"}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))] disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Min Order (TZS)</label>
                  <input
                    type="number"
                    value={promoForm.minSubtotal}
                    onChange={(e) => setPromoForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))]"
                  />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    value={promoForm.maxUses}
                    onChange={(e) => setPromoForm((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    min={1}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))]"
                  />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Expires</label>
                  <input
                    type="date"
                    value={promoForm.expiresAt}
                    onChange={(e) => setPromoForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button
                  type="submit"
                  disabled={promoSaving}
                  className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40"
                >
                  {promoSaving ? "Creating..." : "Create Code"}
                </button>
                {promosError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider">{promosError}</p>}
              </div>
            </form>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Welcome Offer</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Shown to customers right after they join the email list — pick a code to turn the sign-up form into a first-order offer.</p>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={welcomePromo}
                  onChange={(e) => setWelcomePromo(e.target.value)}
                  className="flex-1 bg-[var(--adm-bg2)] border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors cursor-pointer"
                >
                  <option value="">No welcome offer</option>
                  {promos.filter((p) => p.active).map((p) => (
                    <option key={p.code} value={p.code}>{p.code} — {promoLabel(p)}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveWelcome}
                  disabled={welcomeSaving}
                  className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40 shrink-0"
                >
                  {welcomeSaving ? "Saving..." : welcomeSaved ? "Saved ✓" : "Save"}
                </button>
              </div>
              {welcomeError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mt-2">{welcomeError}</p>}
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-6">
              {promos.length} {promos.length === 1 ? "Code" : "Codes"}
            </p>
            {promosLoading ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Loading...</div>
            ) : (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[rgb(var(--adm-fg)/var(--adm-a08))]">
                      {["Code", "Discount", "Min Order", "Uses", "Expires", "Status", ""].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => {
                      const expired = p.expires_at != null && new Date(p.expires_at).getTime() < Date.now();
                      const usedUp = p.max_uses != null && p.use_count >= p.max_uses;
                      return (
                        <tr key={p.code} className="border-b border-[rgb(var(--adm-fg)/var(--adm-a04))] hover:bg-[rgb(var(--adm-fg)/var(--adm-a015))] transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-[rgb(var(--adm-fg))]">{p.code}</td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a80))]">{promoLabel(p)}</td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] tabular-nums">
                            {p.min_subtotal > 0 ? p.min_subtotal.toLocaleString("en-TZ") : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] tabular-nums">
                            {p.use_count}{p.max_uses != null ? ` / ${p.max_uses}` : ""}
                            {usedUp && <span className="text-[rgb(var(--adm-amber)/var(--adm-a70))] ml-1.5">full</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))] whitespace-nowrap">
                            {p.expires_at ? formatOrderDate(p.expires_at) : "—"}
                            {expired && <span className="text-[rgb(var(--adm-red)/var(--adm-a60))] ml-1.5">expired</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTogglePromo(p)}
                              disabled={promoActing === p.code}
                              className={`text-[9px] tracking-[0.15em] uppercase border px-2.5 py-1.5 transition-colors disabled:opacity-40 ${
                                p.active
                                  ? "text-[rgb(var(--adm-emerald)/var(--adm-a80))] border-[rgb(var(--adm-emerald)/var(--adm-a30))] hover:border-[rgb(var(--adm-emerald)/var(--adm-a60))]"
                                  : "text-[rgb(var(--adm-fg)/var(--adm-a30))] border-[rgb(var(--adm-fg)/var(--adm-a15))] hover:border-[rgb(var(--adm-fg)/var(--adm-a35))]"
                              }`}
                            >
                              {p.active ? "Active" : "Off"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeletePromo(p.code)}
                              disabled={promoActing === p.code}
                              className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] hover:text-[rgb(var(--adm-red)/var(--adm-a70))] transition-colors disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {promos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a15))]">
                          No promo codes yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Site & Banners ────────────────────────────────────────────────── */}
        {activeTab === "hero" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Order Alerts</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Get a notification on this device the moment a new order comes in — even with the dashboard closed.</p>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10 flex flex-wrap items-center gap-4">
              {pushState === "enabled" ? (
                <p className="text-xs text-[rgb(var(--adm-emerald)/var(--adm-a70))]">✓ Alerts are on for this device</p>
              ) : pushState === "unsupported" ? (
                <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a40))]">This browser doesn&apos;t support push notifications.</p>
              ) : pushState === "denied" ? (
                <p className="text-xs text-[rgb(var(--adm-amber)/var(--adm-a70))]">Notifications are blocked — allow them for this site in your browser settings, then try again.</p>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={pushState === "enabling"}
                  className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40"
                >
                  {pushState === "enabling" ? "Enabling..." : "Enable Alerts on This Device"}
                </button>
              )}
              {pushDevices !== null && (
                <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a25))]">
                  {pushDevices} {pushDevices === 1 ? "device" : "devices"} subscribed
                </p>
              )}
              {pushState === "error" && pushError && (
                <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider w-full">{pushError}</p>
              )}
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Delivery Pricing</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Live on the cart and checkout within a few minutes of saving — no redeploy. The free-delivery progress bar uses the threshold.</p>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Delivery Fee (TZS)</label>
                  <input
                    type="number"
                    min={0}
                    value={deliveryFeeInput}
                    onChange={(e) => setDeliveryFeeInput(e.target.value)}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[8px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] mb-1.5">Free Delivery Above (TZS)</label>
                  <input
                    type="number"
                    min={0}
                    value={deliveryThresholdInput}
                    onChange={(e) => setDeliveryThresholdInput(e.target.value)}
                    className="w-full bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveDelivery}
                  disabled={deliverySaving}
                  className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40 shrink-0"
                >
                  {deliverySaving ? "Saving..." : deliverySaved ? "Saved ✓" : "Save"}
                </button>
              </div>
              {deliveryError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mt-2">{deliveryError}</p>}
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Announcement Bar</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Shown at the very top of every page. Leave empty to hide the bar.</p>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Free delivery on orders above TZS 150,000"
                  className="flex-1 bg-transparent border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg))] px-3 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--adm-fg)/var(--adm-a60))] transition-colors placeholder:text-[rgb(var(--adm-fg)/var(--adm-a20))]"
                />
                <button
                  onClick={handleSaveAnnouncement}
                  disabled={announcementSaving}
                  className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40 shrink-0"
                >
                  {announcementSaving ? "Saving..." : announcementSaved ? "Saved ✓" : "Save"}
                </button>
              </div>
              {announcementError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mt-2">{announcementError}</p>}
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Email Subscribers</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-4">Sign-ups from the footer form and checkout opt-in. Copy the list into your email tool&apos;s BCC field to send a campaign.</p>
            <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 mb-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a50))]">
                  {subscribers.length} {subscribers.length === 1 ? "subscriber" : "subscribers"}
                </p>
                {subscribers.length > 0 && (
                  <button
                    onClick={handleCopyEmails}
                    className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg)/var(--adm-a70))] transition-colors border border-[rgb(var(--adm-fg)/var(--adm-a15))] hover:border-[rgb(var(--adm-fg)/var(--adm-a35))] px-4 py-1.5"
                  >
                    {copiedEmails ? "Copied ✓" : "Copy All Emails"}
                  </button>
                )}
              </div>
              {subscribers.length === 0 ? (
                <p className="text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a20))]">No sign-ups yet — the footer form on every page feeds this list.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {subscribers.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 text-xs">
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a70))] flex-1 min-w-0 truncate">{s.email}</span>
                      <span className="text-[9px] tracking-wider uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] hidden sm:inline">{s.source}</span>
                      <span className="text-[rgb(var(--adm-fg)/var(--adm-a25))] whitespace-nowrap hidden md:inline">{formatOrderDate(s.created_at)}</span>
                      <button
                        onClick={() => handleRemoveSubscriber(s.id)}
                        disabled={subscriberClearing === s.id}
                        title="Remove from list"
                        className="text-[rgb(var(--adm-fg)/var(--adm-a20))] hover:text-[rgb(var(--adm-red)/var(--adm-a70))] transition-colors disabled:opacity-30 leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a25))] mb-2">Hero Banners</p>
            <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-8">Upload new images to replace the hero banner on each page. Changes go live immediately.</p>

            {heroError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider mb-5">{heroError}</p>}

            {heroLoading ? (
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a08))] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a20))]">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(["home", "women", "men", "accessories"] as const).map((page) => {
                  const imgs = heroImages[page] ?? { desktop_src: "", mobile_src: "" };
                  const labels: Record<string, string> = { home: "Home", women: "Women", men: "Men", accessories: "Accessories" };
                  return (
                    <div key={page} className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] tracking-[0.35em] uppercase font-bold">{labels[page]}</p>
                        <button
                          onClick={() => handleSaveHero(page)}
                          disabled={heroSaving === page}
                          className="bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[8px] tracking-[0.3em] uppercase px-4 py-1.5 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40"
                        >
                          {heroSaving === page ? "Saving..." : "Save"}
                        </button>
                      </div>

                      <HeroSlot
                        adminKey={adminKey!}
                        value={imgs.desktop_src}
                        label="Desktop"
                        onChange={(url) => setHeroImages((prev) => ({ ...prev, [page]: { ...prev[page], desktop_src: url } }))}
                      />
                      <HeroSlot
                        adminKey={adminKey!}
                        value={imgs.mobile_src}
                        label="Mobile"
                        onChange={(url) => setHeroImages((prev) => ({ ...prev, [page]: { ...prev[page], mobile_src: url } }))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[var(--adm-bg2)] border border-[rgb(var(--adm-fg)/var(--adm-a10))] w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgb(var(--adm-fg)/var(--adm-a08))]">
              <p className="text-[9px] tracking-[0.35em] uppercase font-bold">{editId ? "Edit Product" : "New Product"}</p>
              <button onClick={closeModal} className="text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-fg))] transition-colors text-2xl leading-none -mr-1">×</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">

              {/* Name */}
              <Field label="Name" required>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. High-Waist Legging" required className={inputCls} />
              </Field>

              {/* Category + Price + Sale Price */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Category" required>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={selectCls}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Price (TZS)" required>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="85000" required className={inputCls} />
                </Field>
                <Field label="Sale Price">
                  <input type="number" min={0} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="Optional" className={inputCls} />
                </Field>
              </div>

              {/* Buying Price + Stock + Badge */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Buying Price (TZS)">
                  <input type="number" min={0} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="Cost per unit" className={inputCls} />
                </Field>
                <Field label="Units in Stock" required>
                  <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" required className={inputCls} />
                </Field>
                <Field label="Badge">
                  <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={selectCls}>
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Best Seller">Best Seller</option>
                  </select>
                </Field>
              </div>

              {/* Live margin readout — flags selling at a loss before saving */}
              {(() => {
                const cost = form.costPrice.trim() === "" ? null : Number(form.costPrice);
                const sell = form.salePrice.trim() !== "" ? Number(form.salePrice) : Number(form.price);
                if (cost == null || !Number.isFinite(cost) || !Number.isFinite(sell) || sell <= 0) return null;
                const margin = sell - cost;
                const pct = Math.round((margin / sell) * 100);
                return margin < 0 ? (
                  <p className="text-[10px] tracking-wider text-[rgb(var(--adm-red)/var(--adm-a90))] -mt-2">
                    ⚠ Selling below cost: you lose TZS {Math.abs(margin).toLocaleString("en-TZ")} per unit at the current {form.salePrice.trim() !== "" ? "sale" : ""} price.
                  </p>
                ) : (
                  <p className="text-[10px] tracking-wider text-[rgb(var(--adm-fg)/var(--adm-a30))] -mt-2">
                    Margin: TZS {margin.toLocaleString("en-TZ")} per unit ({pct}%)
                    {form.salePrice.trim() !== "" ? " at the sale price" : ""}
                  </p>
                );
              })()}

              {/* Sizes */}
              <Field label="Sizes" required>
                <input
                  type="text"
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  placeholder="Comma-separated, e.g. XS, S, M, L, XL"
                  required
                  className={inputCls}
                />
                <div className="flex gap-1.5 mt-1.5">
                  {SIZE_PRESETS.map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm({ ...form, sizes: value })}
                      className="text-[8px] tracking-[0.2em] uppercase border border-[rgb(var(--adm-fg)/var(--adm-a15))] text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:border-[rgb(var(--adm-fg)/var(--adm-a35))] hover:text-[rgb(var(--adm-fg)/var(--adm-a60))] px-2 py-1 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Status */}
              <Field label="Status">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.isComingSoon} onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })} className="w-3.5 h-3.5 accent-[rgb(var(--adm-fg))]" />
                  <span className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a60))]">Coming Soon</span>
                </label>
              </Field>

              {/* Pre-orders — only meaningful for Coming Soon products */}
              {form.isComingSoon && (
                <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-4 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.preorder}
                      onChange={(e) => setForm({ ...form, preorder: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[rgb(var(--adm-fg))]"
                    />
                    <span>
                      <span className="text-xs text-[rgb(var(--adm-fg)/var(--adm-a60))] block">Accept Pre-Orders</span>
                      <span className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a25))] block mt-0.5">Customers can buy now and receive it at release — stock limits don&apos;t apply</span>
                    </span>
                  </label>
                  {form.preorder && (
                    <Field label="Expected Release">
                      <input
                        type="text"
                        value={form.releaseNote}
                        onChange={(e) => setForm({ ...form, releaseNote: e.target.value })}
                        placeholder="e.g. Expected late July"
                        maxLength={80}
                        className={inputCls}
                      />
                    </Field>
                  )}
                </div>
              )}

              {/* Multi-image gallery */}
              <ImageGalleryEditor
                adminKey={adminKey}
                images={form.images}
                onChange={(imgs) => setForm({ ...form, images: imgs })}
              />

              {/* Color variations */}
              <ColorVariationsEditor
                adminKey={adminKey}
                enabled={form.hasColors}
                colors={form.colors}
                onToggle={(on) => setForm({ ...form, hasColors: on, colors: on && form.colors.length === 0 ? [{ name: "", hex: "#000000", image: "", images: [] }] : form.colors })}
                onChange={(colors) => setForm({ ...form, colors })}
              />

              {/* Description */}
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description..." rows={3} className={textareaCls} />
              </Field>

              {/* Materials */}
              <Field label="Materials">
                <textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="e.g. 94% Polyamide, 6% Elastane..." rows={2} className={textareaCls} />
              </Field>

              {/* Care */}
              <Field label="Care">
                <textarea value={form.care} onChange={(e) => setForm({ ...form, care: e.target.value })} placeholder="e.g. Machine wash cold..." rows={2} className={textareaCls} />
              </Field>

              {/* Fit */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fit">
                  <select value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className={selectCls}>
                    <option value="">Not specified</option>
                    <option value="runs-small">Runs Small</option>
                    <option value="true-to-size">True to Size</option>
                    <option value="runs-large">Runs Large</option>
                  </select>
                </Field>
                <Field label="Fit Notes">
                  <input
                    type="text"
                    value={form.fitNotes}
                    onChange={(e) => setForm({ ...form, fitNotes: e.target.value })}
                    placeholder="e.g. Model is 175cm, wears M"
                    maxLength={120}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Style It With */}
              <div className="border border-[rgb(var(--adm-fg)/var(--adm-a10))] p-4">
                <p className="text-[9px] tracking-[0.25em] uppercase text-[rgb(var(--adm-fg)/var(--adm-a40))] font-bold mb-1">Style It With</p>
                <p className="text-[9px] text-[rgb(var(--adm-fg)/var(--adm-a20))] mb-3">Curated pairings shown on the product page — outfits sell together.</p>

                {form.styledWith.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.styledWith.map((sid) => {
                      const sp = products.find((p) => p.id === sid);
                      return (
                        <span key={sid} className="inline-flex items-center gap-1.5 border border-[rgb(var(--adm-fg)/var(--adm-a20))] px-2 py-1 text-[10px] text-[rgb(var(--adm-fg)/var(--adm-a60))]">
                          {sp?.name ?? sid}
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, styledWith: form.styledWith.filter((x) => x !== sid) })}
                            aria-label={`Remove ${sp?.name ?? sid}`}
                            className="text-[rgb(var(--adm-fg)/var(--adm-a30))] hover:text-[rgb(var(--adm-red)/var(--adm-a70))] transition-colors leading-none"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v && !form.styledWith.includes(v)) setForm({ ...form, styledWith: [...form.styledWith, v] });
                  }}
                  className={selectCls}
                >
                  <option value="">+ Add a product...</option>
                  {products
                    .filter((p) => p.id !== editId && !form.styledWith.includes(p.id) && (!p.isComingSoon || p.preorder))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                </select>
              </div>

              {actionError && <p className="text-[rgb(var(--adm-red)/var(--adm-a80))] text-[10px] tracking-wider">{actionError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-[rgb(var(--adm-fg)/var(--adm-a20))] text-[rgb(var(--adm-fg)/var(--adm-a50))] text-[9px] tracking-[0.25em] uppercase py-3 hover:border-[rgb(var(--adm-fg)/var(--adm-a40))] hover:text-[rgb(var(--adm-fg)/var(--adm-a70))] transition-colors">
                  CANCEL
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[rgb(var(--adm-fg))] text-[var(--adm-bg)] text-[9px] tracking-[0.25em] uppercase py-3 font-bold hover:bg-[rgb(var(--adm-fg)/var(--adm-a90))] transition-colors disabled:opacity-40">
                  {saving ? "SAVING..." : editId ? "SAVE CHANGES" : "ADD PRODUCT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
