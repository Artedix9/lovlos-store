"use client";

import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import type { PDPProduct } from "@/lib/products";
import type { SavedOrder } from "@/lib/orders";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorEntry {
  name: string;
  hex: string;
  image: string;
}

interface RestockRequest {
  id: string;
  product_id: string;
  phone: string;
  created_at: string;
}

interface FormState {
  name: string;
  category: string;
  price: string;
  stock: string;
  badge: string;
  images: string[];
  hasColors: boolean;
  colors: ColorEntry[];
  description: string;
  materials: string;
  care: string;
  isComingSoon: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  category: "Women",
  price: "",
  stock: "",
  badge: "",
  images: [],
  hasColors: false,
  colors: [],
  description: "",
  materials: "",
  care: "",
  isComingSoon: false,
};

const CATEGORIES = ["Men", "Women", "Accessories"] as const;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

const ORDER_STATUSES = ["pending", "confirmed", "dispatched", "delivered", "cancelled"] as const;

/** Confirmed = payment screenshot received, so these count as paid revenue. */
const PAID_STATUSES: ReadonlySet<SavedOrder["status"]> = new Set(["confirmed", "dispatched", "delivered"]);

const STATUS_CLS: Record<SavedOrder["status"], string> = {
  pending: "text-amber-400/80 border-amber-400/30",
  confirmed: "text-sky-400/80 border-sky-400/30",
  dispatched: "text-violet-400/80 border-violet-400/30",
  delivered: "text-emerald-400/80 border-emerald-400/30",
  cancelled: "text-red-400/60 border-red-400/25",
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Normalise stored digits to international format for wa.me links. */
function waPhone(digits: string): string {
  if (digits.startsWith("0")) return "255" + digits.slice(1);
  if (digits.length === 9) return "255" + digits;
  return digits;
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
    <div className="border border-white/10 p-6">
      <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">{label}</p>
      <p className="text-4xl font-light text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1.5 font-bold">
        {label}{required && <span className="text-white/30 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-transparent border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/20";
const textareaCls = "w-full bg-transparent border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/20 resize-none";
const selectCls = "w-full bg-[#111] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/60 transition-colors";

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
      <label className="block text-[9px] tracking-[0.25em] uppercase text-white/40 mb-2 font-bold">
        Product Images
        <span className="text-white/20 ml-1 normal-case tracking-normal font-normal"> — first image is the hero</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative group w-20 h-20 flex-shrink-0 border border-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] tracking-wider uppercase bg-white/80 text-black py-0.5">
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
            dragOver ? "border-white/50 bg-white/5" : "border-white/15 hover:border-white/35"
          } ${uploading ? "opacity-50 cursor-default" : ""}`}
        >
          {uploading ? (
            <div className="w-4 h-4 border border-white/30 border-t-white/70 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[8px] tracking-wide uppercase text-white/25">Add</span>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-400/80 text-[10px] tracking-wider mt-1.5">{error}</p>}

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
        <div className="w-10 h-10 border border-white/20 overflow-hidden group cursor-pointer" onClick={() => inputRef.current?.click()}>
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
          className="w-10 h-10 border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center transition-colors"
          title="Add color image (optional)"
        >
          {uploading ? (
            <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const addColor = () => onChange([...colors, { name: "", hex: "#000000", image: "" }]);
  const removeColor = (i: number) => onChange(colors.filter((_, idx) => idx !== i));
  const updateColor = (i: number, patch: Partial<ColorEntry>) =>
    onChange(colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="border border-white/10 p-4 space-y-3">
      {/* Toggle header */}
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase text-white/40 font-bold">Color Variations</p>
          <p className="text-[9px] text-white/20 mt-0.5">Optional — enables per-color swatches and images on the product page</p>
        </div>
        <div
          onClick={() => onToggle(!enabled)}
          className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-white" : "bg-white/15"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${enabled ? "left-[18px]" : "left-0.5"}`} />
        </div>
      </label>

      {enabled && (
        <div className="space-y-2 pt-1">
          {/* Column headers */}
          {colors.length > 0 && (
            <div className="grid grid-cols-[40px_1fr_minmax(0,_120px)_40px_24px] gap-2 items-center">
              <span className="text-[8px] uppercase tracking-wider text-white/20">Swatch</span>
              <span className="text-[8px] uppercase tracking-wider text-white/20">Color Name</span>
              <span className="text-[8px] uppercase tracking-wider text-white/20">Hex</span>
              <span className="text-[8px] uppercase tracking-wider text-white/20">Image</span>
              <span />
            </div>
          )}

          {colors.map((c, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_minmax(0,_120px)_40px_24px] gap-2 items-center">
              {/* Live swatch preview */}
              <div className="w-8 h-8 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />

              {/* Name */}
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
                placeholder="e.g. Ivory"
                className="bg-transparent border border-white/20 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/15"
              />

              {/* Hex */}
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={c.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  maxLength={7}
                  className="bg-transparent border border-white/20 text-white px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-white/50 transition-colors w-full"
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
                className="text-white/20 hover:text-red-400/70 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addColor}
            className="text-[9px] tracking-[0.25em] uppercase text-white/30 hover:text-white/60 transition-colors border border-dashed border-white/15 hover:border-white/30 w-full py-2 mt-1"
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
      <p className="text-[8px] tracking-[0.25em] uppercase text-white/30 mb-1.5">{label}</p>
      <div
        className="relative h-24 w-full border border-dashed border-white/15 overflow-hidden cursor-pointer hover:border-white/35 transition-colors group"
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
              <div className="w-4 h-4 border border-white/30 border-t-white/70 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[8px] tracking-wide uppercase text-white/20">Upload</span>
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
  // Auth
  const [inputKey, setInputKey] = useState("");
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [products, setProducts] = useState<PDPProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "inventory" | "hero">("overview");
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

  // Restock waitlist
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [restockClearing, setRestockClearing] = useState<string | null>(null);

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
  }, [adminKey, fetchProducts, fetchHeroImages, fetchOrders, fetchRestock]);

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
      stock: String(p.stock ?? 0),
      badge: p.badge ?? "",
      images: p.images ?? [],
      hasColors: (p.colors?.length ?? 0) > 0,
      colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex, image: c.image ?? "" })),
      description: p.description ?? "",
      materials: p.materials ?? "",
      care: p.care ?? "",
      isComingSoon: p.isComingSoon ?? false,
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
      stock: Number(form.stock) || 0,
      badge: form.badge || undefined,
      images: form.images,
      colors: form.hasColors
        ? form.colors.map((c) => ({ name: c.name, hex: c.hex, ...(c.image ? { image: c.image } : {}) }))
        : [],
      description: form.description,
      materials: form.materials,
      care: form.care,
      isComingSoon: form.isComingSoon,
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
  const stockValue = products.reduce((sum, p) => sum + (p.stock ?? 0) * p.price, 0);
  const outOfStock = products.filter((p) => !p.isComingSoon && (p.stock ?? 0) === 0).length;
  const lowStock = products.filter((p) => !p.isComingSoon && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;

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

  // ── Login screen ───────────────────────────────────────────────────────────

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[340px]">
          <p className="text-[9px] tracking-[0.5em] uppercase text-white/25 text-center mb-1">LOVLOS</p>
          <h1 className="text-xl font-light text-white text-center tracking-[0.35em] uppercase mb-10">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="ACCESS KEY"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              autoFocus
              required
              className="w-full bg-transparent border border-white/20 text-white placeholder:text-white/20 px-4 py-3 text-xs tracking-widest uppercase focus:outline-none focus:border-white/50 transition-colors"
            />
            {loginError && <p className="text-red-400/80 text-[10px] tracking-widest text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-white text-black text-[10px] tracking-[0.3em] uppercase py-3 font-bold hover:bg-white/90 transition-colors disabled:opacity-40"
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/[0.08] px-6 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="text-[10px] tracking-[0.45em] uppercase font-bold">LOVLOS</span>
          <span className="text-white/15 text-lg leading-none">|</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">ADMIN</span>
        </div>
        <button onClick={handleSignOut} className="text-[9px] tracking-[0.25em] uppercase text-white/25 hover:text-white/50 transition-colors">
          SIGN OUT
        </button>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <nav className="flex gap-8 border-b border-white/[0.08] mb-10">
          {(["overview", "orders", "inventory", "hero"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] tracking-[0.3em] uppercase transition-colors ${
                activeTab === tab ? "text-white border-b border-white -mb-px" : "text-white/25 hover:text-white/50"
              }`}
            >
              {tab === "hero" ? "Hero Images" : tab}
              {tab === "orders" && pendingOrders > 0 && (
                <span className="ml-1.5 text-[8px] text-amber-400/80 tabular-nums">{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-6">Orders &amp; Revenue</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatCard label="Total Orders" value={orders.length} />
              <StatCard label="Pending" value={pendingOrders} sub="Awaiting payment confirmation" />
              <StatCard label="Delivered" value={deliveredOrders} />
            </div>
            <div className="border border-white/10 p-6 mb-10">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">Revenue</p>
              <p className="text-4xl font-light">TZS {revenue.toLocaleString("en-TZ")}</p>
              <p className="text-[10px] text-white/25 mt-1.5">
                Confirmed, dispatched &amp; delivered orders · TZS {monthRevenue.toLocaleString("en-TZ")} this month
              </p>
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-6">Inventory Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Products" value={products.length} />
              <StatCard label="Men's Items" value={men} />
              <StatCard label="Women's Items" value={women} />
              <StatCard label="Accessories" value={accessories} />
            </div>

            <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-6 mt-10">Stock &amp; Value</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatCard label="Units in Stock" value={unitsInStock.toLocaleString("en-TZ")} sub="Total units across all products" />
              <StatCard label="Low Stock" value={lowStock} sub="Live products with 5 or fewer units" />
              <StatCard label="Out of Stock" value={outOfStock} sub="Live products with zero units" />
            </div>
            <div className="border border-white/10 p-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">Stock Value</p>
              <p className="text-4xl font-light">TZS {stockValue.toLocaleString("en-TZ")}</p>
              <p className="text-[10px] text-white/25 mt-1.5">Units in stock × price — revenue if everything on hand sells</p>
            </div>
          </section>
        )}

        {/* ── Orders ────────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                {pendingOrders > 0 && <span className="text-amber-400/60 ml-2">· {pendingOrders} pending</span>}
              </p>
              <button
                onClick={() => adminKey && fetchOrders(adminKey)}
                disabled={ordersLoading}
                className="text-[9px] tracking-[0.25em] uppercase text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
              >
                Refresh
              </button>
            </div>

            {ordersError && <p className="text-red-400/80 text-[10px] tracking-wider mb-4">{ordersError}</p>}

            {ordersLoading ? (
              <div className="border border-white/[0.08] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-white/20">Loading...</div>
            ) : (
              <div className="border border-white/[0.08] overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      {["Order", "Date", "Customer", "City", "Payment", "Total (TZS)", "Status"].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-white/25 px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <Fragment key={o.id}>
                        <tr
                          onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                          className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-white">{o.id}</span>
                            <span className={`ml-2 inline-block text-white/25 text-[9px] transition-transform ${expandedOrder === o.id ? "rotate-90" : ""}`}>▸</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">{formatOrderDate(o.created_at)}</td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-white/80">{o.customer_name}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{o.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/50">{o.city}</td>
                          <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                            {o.payment_method === "mobile-money" ? "Mobile Money" : "Cash on Delivery"}
                          </td>
                          <td className="px-4 py-3 text-xs text-white/80 tabular-nums">{o.total.toLocaleString("en-TZ")}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={o.status}
                              disabled={statusSaving === o.id}
                              onChange={(e) => handleStatusChange(o.id, e.target.value as SavedOrder["status"])}
                              className={`bg-[#111] border text-[9px] tracking-[0.15em] uppercase px-2 py-1.5 focus:outline-none transition-colors disabled:opacity-40 cursor-pointer ${STATUS_CLS[o.status]}`}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s} className="text-white bg-[#111]">{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {expandedOrder === o.id && (
                          <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
                                {/* Items */}
                                <div>
                                  <p className="text-[8px] tracking-[0.25em] uppercase text-white/25 mb-2">Items</p>
                                  <div className="space-y-1.5">
                                    {o.items.map((item, i) => (
                                      <div key={i} className="flex items-baseline justify-between gap-4 text-xs">
                                        <span className="text-white/70">
                                          {item.name}
                                          <span className="text-white/30 ml-2">
                                            {[item.color, item.size].filter(Boolean).join(" · ")} × {item.quantity}
                                          </span>
                                        </span>
                                        <span className="text-white/50 tabular-nums whitespace-nowrap">
                                          {(item.price * item.quantity).toLocaleString("en-TZ")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="border-t border-white/[0.06] mt-3 pt-2 space-y-1 text-[11px]">
                                    <div className="flex justify-between text-white/40">
                                      <span>Subtotal</span><span className="tabular-nums">{o.subtotal.toLocaleString("en-TZ")}</span>
                                    </div>
                                    <div className="flex justify-between text-white/40">
                                      <span>Delivery</span><span className="tabular-nums">{o.delivery_fee.toLocaleString("en-TZ")}</span>
                                    </div>
                                    <div className="flex justify-between text-white/80">
                                      <span>Total</span><span className="tabular-nums">{o.total.toLocaleString("en-TZ")}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Contact / delivery */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[8px] tracking-[0.25em] uppercase text-white/25 mb-1">Contact</p>
                                    <p className="text-xs text-white/60">{o.email || "—"}</p>
                                    <a
                                      href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "255")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
                                    >
                                      WhatsApp {o.phone}
                                    </a>
                                  </div>
                                  <div>
                                    <p className="text-[8px] tracking-[0.25em] uppercase text-white/25 mb-1">Delivery Note</p>
                                    <p className="text-xs text-white/60">{o.delivery_note || "—"}</p>
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
                        <td colSpan={7} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-white/15">
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

        {/* ── Inventory ─────────────────────────────────────────────────────── */}
        {activeTab === "inventory" && (
          <section>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25">
                {visibleProducts.length === products.length
                  ? `${products.length} ${products.length === 1 ? "Product" : "Products"}`
                  : `${visibleProducts.length} of ${products.length}`}
              </p>
              <button
                onClick={openAdd}
                className="bg-white text-black text-[9px] tracking-[0.3em] uppercase px-5 py-2 font-bold hover:bg-white/90 transition-colors"
              >
                + ADD PRODUCT
              </button>
            </div>

            {/* Restock waitlist — customers waiting on sold-out products */}
            {restockRequests.length > 0 && (
              <div className="border border-amber-400/20 p-4 mb-6">
                <p className="text-[9px] tracking-[0.3em] uppercase text-amber-400/70 mb-3">
                  Restock Waitlist · {restockRequests.length} {restockRequests.length === 1 ? "customer" : "customers"} waiting
                </p>
                <div className="space-y-2">
                  {restockRequests.map((r) => {
                    const product = products.find((p) => p.id === r.product_id);
                    const name = product?.name ?? r.product_id;
                    const waText = encodeURIComponent(
                      `Hello! Great news — the ${name} you asked about is back in stock at LOVLOS. Order it here: https://lovlos.vercel.app/product/${r.product_id}`
                    );
                    return (
                      <div key={r.id} className="flex items-center gap-4 text-xs">
                        <span className="text-white/70 flex-1 min-w-0 truncate">{name}</span>
                        <a
                          href={`https://wa.me/${waPhone(r.phone)}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400/70 hover:text-emerald-400 transition-colors whitespace-nowrap"
                        >
                          WhatsApp {r.phone}
                        </a>
                        <span className="text-white/25 whitespace-nowrap hidden sm:inline">{formatOrderDate(r.created_at)}</span>
                        <button
                          onClick={() => handleClearRequest(r.id)}
                          disabled={restockClearing === r.id}
                          title="Notified — remove from waitlist"
                          className="text-[9px] tracking-[0.2em] uppercase text-white/30 hover:text-white/70 transition-colors disabled:opacity-30"
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
            <div className="border border-white/[0.08] p-4 mb-6 space-y-3">
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent border border-white/15 text-white text-xs px-3 py-2 focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
              />

              {/* Pills row */}
              <div className="flex flex-wrap gap-4">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-white/20 shrink-0">Category</span>
                  <div className="flex gap-1">
                    {(["all", "Men", "Women", "Accessories"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setFilterCategory(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterCategory === v
                            ? "border-white/60 text-white bg-white/10"
                            : "border-white/15 text-white/30 hover:border-white/30 hover:text-white/50"
                        }`}
                      >
                        {v === "all" ? "All" : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-white/20 shrink-0">Status</span>
                  <div className="flex gap-1">
                    {([["all", "All"], ["live", "Live"], ["coming-soon", "Coming Soon"], ["out-of-stock", "Out of Stock"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setFilterStatus(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterStatus === v
                            ? "border-white/60 text-white bg-white/10"
                            : "border-white/15 text-white/30 hover:border-white/30 hover:text-white/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.25em] uppercase text-white/20 shrink-0">Badge</span>
                  <div className="flex gap-1">
                    {([["all", "All"], ["New", "New"], ["Best Seller", "Best Seller"], ["none", "None"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setFilterBadge(v)}
                        className={`text-[8px] tracking-[0.2em] uppercase px-2.5 py-1 transition-colors border ${
                          filterBadge === v
                            ? "border-white/60 text-white bg-white/10"
                            : "border-white/15 text-white/30 hover:border-white/30 hover:text-white/50"
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
                    className="text-[8px] tracking-[0.2em] uppercase text-white/25 hover:text-white/50 transition-colors ml-auto"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {actionError && <p className="text-red-400/80 text-[10px] tracking-wider mb-4">{actionError}</p>}

            {loading ? (
              <div className="border border-white/[0.08] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-white/20">Loading...</div>
            ) : (
              <div className="border border-white/[0.08] overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      {["", "Name", "Category", "Price (TZS)", "Stock", "Badge", "Status", ""].map((h, i) => (
                        <th key={i} className="text-left text-[9px] tracking-[0.25em] uppercase text-white/25 px-4 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                      <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors group">
                        <td className="px-4 py-3 w-14">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                            {p.images[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-[9px] text-white/25 mt-0.5 font-mono">{p.id}</p>
                          {(p.colors?.length ?? 0) > 0 && (
                            <div className="flex gap-1 mt-1">
                              {p.colors!.map((c) => (
                                <div key={c.name} title={c.name} className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50">{p.category}</td>
                        <td className="px-4 py-3 text-xs text-white/50 tabular-nums">{p.price.toLocaleString("en-TZ")}</td>
                        <td className="px-4 py-3">
                          {(p.stock ?? 0) === 0 ? (
                            <span className="text-[9px] tracking-wider uppercase text-red-400/70">Out</span>
                          ) : (
                            <span className={`text-xs tabular-nums ${(p.stock ?? 0) <= 5 ? "text-amber-400/80" : "text-white/50"}`}>
                              {p.stock}
                            </span>
                          )}
                          {(() => {
                            const waiting = restockRequests.filter((r) => r.product_id === p.id).length;
                            return waiting > 0 ? (
                              <p className="text-[9px] text-amber-400/50 mt-0.5">{waiting} waiting</p>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {p.badge ? (
                            <span className="text-[9px] tracking-wider uppercase border border-white/20 px-2 py-0.5 text-white/50">{p.badge}</span>
                          ) : (
                            <span className="text-white/15">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.isComingSoon ? (
                            <span className="text-[9px] tracking-wider uppercase text-amber-400/60">Coming Soon</span>
                          ) : (
                            <span className="text-[9px] tracking-wider uppercase text-emerald-400/60">Live</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(p)} className="text-[9px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">EDIT</button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              disabled={deletingId === p.id}
                              className="text-[9px] tracking-[0.2em] uppercase text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-30"
                            >
                              {deletingId === p.id ? "..." : "DELETE"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-white/15">
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
        {/* ── Hero Images ───────────────────────────────────────────────────── */}
        {activeTab === "hero" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Hero Banners</p>
            <p className="text-[9px] text-white/20 mb-8">Upload new images to replace the hero banner on each page. Changes go live immediately.</p>

            {heroError && <p className="text-red-400/80 text-[10px] tracking-wider mb-5">{heroError}</p>}

            {heroLoading ? (
              <div className="border border-white/[0.08] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-white/20">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(["home", "women", "men", "accessories"] as const).map((page) => {
                  const imgs = heroImages[page] ?? { desktop_src: "", mobile_src: "" };
                  const labels: Record<string, string> = { home: "Home", women: "Women", men: "Men", accessories: "Accessories" };
                  return (
                    <div key={page} className="border border-white/10 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] tracking-[0.35em] uppercase font-bold">{labels[page]}</p>
                        <button
                          onClick={() => handleSaveHero(page)}
                          disabled={heroSaving === page}
                          className="bg-white text-black text-[8px] tracking-[0.3em] uppercase px-4 py-1.5 font-bold hover:bg-white/90 transition-colors disabled:opacity-40"
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
          <div className="bg-[#111] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <p className="text-[9px] tracking-[0.35em] uppercase font-bold">{editId ? "Edit Product" : "New Product"}</p>
              <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors text-2xl leading-none -mr-1">×</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">

              {/* Name */}
              <Field label="Name" required>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. High-Waist Legging" required className={inputCls} />
              </Field>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category" required>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={selectCls}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Price (TZS)" required>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="85000" required className={inputCls} />
                </Field>
              </div>

              {/* Stock + Badge */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Status */}
              <Field label="Status">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.isComingSoon} onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })} className="w-3.5 h-3.5 accent-white" />
                  <span className="text-xs text-white/60">Coming Soon</span>
                </label>
              </Field>

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
                onToggle={(on) => setForm({ ...form, hasColors: on, colors: on && form.colors.length === 0 ? [{ name: "", hex: "#000000", image: "" }] : form.colors })}
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

              {actionError && <p className="text-red-400/80 text-[10px] tracking-wider">{actionError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-white/20 text-white/50 text-[9px] tracking-[0.25em] uppercase py-3 hover:border-white/40 hover:text-white/70 transition-colors">
                  CANCEL
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-white text-black text-[9px] tracking-[0.25em] uppercase py-3 font-bold hover:bg-white/90 transition-colors disabled:opacity-40">
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
