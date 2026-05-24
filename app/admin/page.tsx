"use client";

import { useState, useEffect, useCallback } from "react";
import type { PDPProduct } from "@/lib/products";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  category: string;
  price: string;
  badge: string;
  imageUrl: string;
  description: string;
  materials: string;
  care: string;
  isComingSoon: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  category: "Women",
  price: "",
  badge: "",
  imageUrl: "",
  description: "",
  materials: "",
  care: "",
  isComingSoon: false,
};

const CATEGORIES = ["Men", "Women", "Accessories"] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-white/10 p-6">
      <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">{label}</p>
      <p className="text-4xl font-light text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-1.5">{sub}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1.5 font-bold">
        {label}
        {required && <span className="text-white/30 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-transparent border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/20";
const textareaCls =
  "w-full bg-transparent border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/20 resize-none";
const selectCls =
  "w-full bg-[#111] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/60 transition-colors";

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

  // UI tabs
  const [activeTab, setActiveTab] = useState<"overview" | "inventory">("overview");

  // Modal (shared add / edit)
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null = add mode
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // ── Session restore ────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = sessionStorage.getItem("lvl-admin-key");
    if (stored) setAdminKey(stored);
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
  }, [adminKey, fetchProducts]);

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
      badge: p.badge ?? "",
      imageUrl: p.images[0] ?? "",
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
      badge: form.badge || undefined,
      images: form.imageUrl ? [form.imageUrl] : [],
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
      if (!res.ok) throw new Error("Save failed");
      const saved: PDPProduct = await res.json();
      if (editId) {
        setProducts((prev) => prev.map((p) => (p.id === editId ? saved : p)));
      } else {
        setProducts((prev) => [...prev, saved]);
      }
      closeModal();
    } catch {
      setActionError("Failed to save. Try again.");
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
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setActionError("Delete failed. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const men = products.filter((p) => p.category === "Men").length;
  const women = products.filter((p) => p.category === "Women").length;
  const accessories = products.filter((p) => p.category === "Accessories").length;
  const catalogueValue = products.reduce((sum, p) => sum + p.price, 0);

  // ── Login screen ───────────────────────────────────────────────────────────

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[340px]">
          <p className="text-[9px] tracking-[0.5em] uppercase text-white/25 text-center mb-1">LOVLOS</p>
          <h1 className="text-xl font-light text-white text-center tracking-[0.35em] uppercase mb-10">
            Admin Access
          </h1>
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
            {loginError && (
              <p className="text-red-400/80 text-[10px] tracking-widest text-center">{loginError}</p>
            )}
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
        <button
          onClick={handleSignOut}
          className="text-[9px] tracking-[0.25em] uppercase text-white/25 hover:text-white/50 transition-colors"
        >
          SIGN OUT
        </button>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <nav className="flex gap-8 border-b border-white/[0.08] mb-10">
          {(["overview", "inventory"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] tracking-[0.3em] uppercase transition-colors ${
                activeTab === tab
                  ? "text-white border-b border-white -mb-px"
                  : "text-white/25 hover:text-white/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <section>
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-6">Inventory Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Products" value={products.length} />
              <StatCard label="Men's Items" value={men} />
              <StatCard label="Women's Items" value={women} />
              <StatCard label="Accessories" value={accessories} />
            </div>
            <div className="border border-white/10 p-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">Catalogue Value</p>
              <p className="text-4xl font-light">TZS {catalogueValue.toLocaleString("en-TZ")}</p>
              <p className="text-[10px] text-white/25 mt-1.5">Sum of all listed prices</p>
            </div>
          </section>
        )}

        {/* ── Inventory ─────────────────────────────────────────────────────── */}
        {activeTab === "inventory" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25">
                {products.length} {products.length === 1 ? "Product" : "Products"}
              </p>
              <button
                onClick={openAdd}
                className="bg-white text-black text-[9px] tracking-[0.3em] uppercase px-5 py-2 font-bold hover:bg-white/90 transition-colors"
              >
                + ADD PRODUCT
              </button>
            </div>

            {actionError && (
              <p className="text-red-400/80 text-[10px] tracking-wider mb-4">{actionError}</p>
            )}

            {loading ? (
              <div className="border border-white/[0.08] py-24 text-center text-[9px] tracking-[0.3em] uppercase text-white/20">
                Loading...
              </div>
            ) : (
              <div className="border border-white/[0.08] overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      {["", "Name", "Category", "Price (TZS)", "Badge", "Status", ""].map((h, i) => (
                        <th
                          key={i}
                          className="text-left text-[9px] tracking-[0.25em] uppercase text-white/25 px-4 py-3 font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors group"
                      >
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
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50">{p.category}</td>
                        <td className="px-4 py-3 text-xs text-white/50 tabular-nums">
                          {p.price.toLocaleString("en-TZ")}
                        </td>
                        <td className="px-4 py-3">
                          {p.badge ? (
                            <span className="text-[9px] tracking-wider uppercase border border-white/20 px-2 py-0.5 text-white/50">
                              {p.badge}
                            </span>
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
                            <button
                              onClick={() => openEdit(p)}
                              className="text-[9px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
                            >
                              EDIT
                            </button>
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
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-[9px] tracking-[0.3em] uppercase text-white/15">
                          No products yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
              <p className="text-[9px] tracking-[0.35em] uppercase font-bold">
                {editId ? "Edit Product" : "New Product"}
              </p>
              <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors text-2xl leading-none -mr-1">
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-6 space-y-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. High-Waist Legging"
                  required
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={selectCls}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Price (TZS)" required>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="85000"
                    required
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Badge">
                  <select
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className={selectCls}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Best Seller">Best Seller</option>
                  </select>
                </Field>
                <Field label="Status">
                  <label className="flex items-center gap-2.5 h-[42px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isComingSoon}
                      onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })}
                      className="w-3.5 h-3.5 accent-white"
                    />
                    <span className="text-xs text-white/60">Coming Soon</span>
                  </label>
                </Field>
              </div>

              <Field label="Image URL (first image)">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/product.png or https://..."
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                  className={textareaCls}
                />
              </Field>

              <Field label="Materials">
                <textarea
                  value={form.materials}
                  onChange={(e) => setForm({ ...form, materials: e.target.value })}
                  placeholder="e.g. 94% Polyamide, 6% Elastane..."
                  rows={2}
                  className={textareaCls}
                />
              </Field>

              <Field label="Care">
                <textarea
                  value={form.care}
                  onChange={(e) => setForm({ ...form, care: e.target.value })}
                  placeholder="e.g. Machine wash cold..."
                  rows={2}
                  className={textareaCls}
                />
              </Field>

              {actionError && (
                <p className="text-red-400/80 text-[10px] tracking-wider">{actionError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-white/20 text-white/50 text-[9px] tracking-[0.25em] uppercase py-3 hover:border-white/40 hover:text-white/70 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-white text-black text-[9px] tracking-[0.25em] uppercase py-3 font-bold hover:bg-white/90 transition-colors disabled:opacity-40"
                >
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
