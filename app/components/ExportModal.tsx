"use client";

import { useState } from "react";

type Receipt = {
  storeName?: string;
  date?: string;
  total?: number;
  totalHT?: number;
  vatRate?: number;
  vatAmount?: number;
  vatInferred?: boolean;
  currency?: string;
  category?: string;
  items?: { name: string; price: number; priceHT?: number; vatRate?: number; quantity?: number }[];
  imageUrl?: string | null;
  fileName: string;
  status: "processing" | "completed" | "error";
  createdAt: number;
};

const CATEGORY_COLOR: Record<string, string> = {
  "Alimentation":    "bg-emerald-500",
  "Restaurant/Café": "bg-orange-500",
  "Transport":       "bg-blue-500",
  "Santé":           "bg-rose-500",
  "Vêtements":       "bg-purple-500",
  "Électronique":    "bg-cyan-500",
  "Divertissement":  "bg-yellow-500",
  "Maison":          "bg-amber-500",
  "Autre":           "bg-gray-400",
};

const CATEGORY_BG: Record<string, string> = {
  "Alimentation":    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Restaurant/Café": "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Transport":       "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Santé":           "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "Vêtements":       "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Électronique":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Divertissement":  "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Maison":          "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Autre":           "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function formatDate(dateStr?: string, fallback?: number) {
  if (dateStr) return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (fallback) return new Date(fallback).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return "—";
}

function downloadCSV(receipts: Receipt[]) {
  const header = ["Photo", "Date", "Magasin", "Catégorie", "HT (€)", "TVA %", "TVA (€)", "TTC (€)", "Devise", "Articles"];
  const rows = receipts
    .filter((r) => r.status === "completed")
    .map((r) => [
      r.imageUrl ?? "",
      formatDate(r.date, r.createdAt),
      r.storeName ?? r.fileName,
      r.category ?? "—",
      r.totalHT !== undefined ? r.totalHT.toFixed(2) : "—",
      r.vatRate !== undefined ? `${r.vatRate}%` : "—",
      r.vatAmount !== undefined ? r.vatAmount.toFixed(2) : "—",
      r.total !== undefined ? r.total.toFixed(2) : "—",
      r.currency ?? "EUR",
      r.items ? r.items.map((i) => `${i.quantity ? i.quantity + "x " : ""}${i.name} (${i.price.toFixed(2)}€)`).join(" | ") : "—",
    ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reçus_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMailto(receipts: Receipt[], accountantEmail: string) {
  const completed = receipts.filter((r) => r.status === "completed");
  const total = completed.reduce((s, r) => s + (r.total ?? 0), 0);
  const byCategory = completed.reduce<Record<string, number>>((acc, r) => {
    const cat = r.category ?? "Autre";
    acc[cat] = (acc[cat] ?? 0) + (r.total ?? 0);
    return acc;
  }, {});

  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const lines = [
    `Rapport de dépenses — ${dateStr}`,
    "=".repeat(52),
    "",
    "DÉTAIL DES REÇUS",
    "-".repeat(52),
    ...completed.map((r, i) =>
      `${String(i + 1).padStart(2, "0")}. ${formatDate(r.date, r.createdAt)}  ${(r.storeName ?? r.fileName).slice(0, 20).padEnd(20)}  ${(r.category ?? "—").slice(0, 16).padEnd(16)}  ${r.total !== undefined ? r.total.toFixed(2) + " " + (r.currency ?? "EUR") : "—"}`
    ),
    "",
    "TOTAL PAR CATÉGORIE",
    "-".repeat(52),
    ...Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) =>
      `  ${cat.slice(0, 20).padEnd(20)}  ${amt.toFixed(2)} EUR`
    ),
    "",
    "=".repeat(52),
    `TOTAL GÉNÉRAL : ${total.toFixed(2)} EUR`,
    "=".repeat(52),
    "",
    "(Le fichier CSV détaillé avec les liens photos est joint à ce message)",
  ];

  const subject = encodeURIComponent(`Rapport de dépenses — ${dateStr}`);
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${accountantEmail}?subject=${subject}&body=${body}`;
}

export function ExportModal({ receipts, onClose }: { receipts: Receipt[]; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"table" | "summary">("table");
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const completed = receipts.filter((r) => r.status === "completed");
  const total = completed.reduce((s, r) => s + (r.total ?? 0), 0);
  const byCategory = completed.reduce<Record<string, { count: number; total: number }>>((acc, r) => {
    const cat = r.category ?? "Autre";
    if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
    acc[cat].count++;
    acc[cat].total += r.total ?? 0;
    return acc;
  }, {});

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Rapport comptable</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                {completed.length} reçu{completed.length !== 1 ? "s" : ""} · Total {total.toFixed(2)} €
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-sub)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3">
            {(["table", "summary"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={
                  activeTab === tab
                    ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }
                    : { color: "var(--text-sub)" }
                }
              >
                {tab === "table" ? "Tableau" : "Résumé"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-5 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
            {activeTab === "table" ? (
              <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)", WebkitOverflowScrolling: "touch" }}>
                <table className="text-sm border-collapse" style={{ minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                      {["Photo", "Date", "Magasin", "Catégorie", "HT", "TVA", "TTC", "Articles"].map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                          style={{ color: "var(--text-sub)", borderRight: "1px solid var(--border)" }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {completed.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: "var(--text-sub)" }}>
                          Aucun reçu analysé
                        </td>
                      </tr>
                    ) : (
                      completed.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="px-2 py-2" style={{ borderRight: "1px solid var(--border)" }}>
                            {r.imageUrl && r.fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                              <button onClick={() => setPreviewImg(r.imageUrl!)} className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" style={{ border: "1px solid var(--border)" }} />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--border)" }}>
                                <svg className="w-5 h-5" style={{ color: "var(--text-sub)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--text-sub)", borderRight: "1px solid var(--border)" }}>
                            {formatDate(r.date, r.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 font-medium max-w-[120px]" style={{ color: "var(--text)", borderRight: "1px solid var(--border)" }}>
                            <span className="truncate block">{r.storeName ?? r.fileName}</span>
                          </td>
                          <td className="px-3 py-2.5" style={{ borderRight: "1px solid var(--border)" }}>
                            {r.category ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BG[r.category] ?? CATEGORY_BG["Autre"]}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLOR[r.category] ?? CATEGORY_COLOR["Autre"]}`} />
                                {r.category}
                              </span>
                            ) : <span style={{ color: "var(--text-sub)" }}>—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: "1px solid var(--border)" }}>
                            {r.totalHT !== undefined ? (
                              <span className="text-sm" style={{ color: "var(--text-sub)" }}>{r.totalHT.toFixed(2)} <span className="text-xs">{r.currency ?? "€"}</span></span>
                            ) : <span style={{ color: "var(--text-sub)", opacity: 0.4 }}>—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: "1px solid var(--border)" }}>
                            {r.vatRate !== undefined ? (
                              <div>
                                <span className="text-xs font-semibold" style={{ color: "var(--text-sub)" }}>{r.vatRate}%{r.vatInferred ? " *" : ""}</span>
                                {r.vatAmount !== undefined && (
                                  <p className="text-xs" style={{ color: "var(--text-sub)", opacity: 0.7 }}>{r.vatAmount.toFixed(2)} {r.currency ?? "€"}</p>
                                )}
                              </div>
                            ) : <span style={{ color: "var(--text-sub)", opacity: 0.4 }}>—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: "1px solid var(--border)" }}>
                            {r.total !== undefined ? (
                              <span className="font-bold" style={{ color: "var(--text)" }}>
                                {r.total.toFixed(2)} <span className="font-normal text-xs" style={{ color: "var(--text-sub)" }}>{r.currency ?? "€"}</span>
                              </span>
                            ) : <span style={{ color: "var(--text-sub)", opacity: 0.4 }}>—</span>}
                          </td>
                          <td className="px-3 py-2.5 max-w-[140px]">
                            {r.items && r.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {r.items.slice(0, 3).map((item, j) => (
                                  <div key={j} className="flex justify-between gap-2 text-xs" style={{ color: "var(--text-sub)" }}>
                                    <span className="truncate">{item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>
                                    <span className="shrink-0">{item.price.toFixed(2)}€</span>
                                  </div>
                                ))}
                                {r.items.length > 3 && <p className="text-xs" style={{ color: "var(--text-sub)", opacity: 0.5 }}>+{r.items.length - 3} autres</p>}
                              </div>
                            ) : <span className="text-xs" style={{ color: "var(--text-sub)", opacity: 0.4 }}>—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {completed.length > 0 && (
                    <tfoot>
                      <tr style={{ background: "var(--bg)", borderTop: "2px solid var(--border)" }}>
                        <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Total général</td>
                        <td className="px-3 py-2.5 text-right text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-sub)" }}>
                          {completed.reduce((s, r) => s + (r.totalHT ?? 0), 0).toFixed(2)} <span className="text-xs font-normal">€</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-sub)" }}>
                          {completed.reduce((s, r) => s + (r.vatAmount ?? 0), 0).toFixed(2)} <span className="text-xs font-normal">€</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-base whitespace-nowrap" style={{ color: "var(--text)" }}>
                          {total.toFixed(2)} <span className="font-normal text-xs" style={{ color: "var(--text-sub)" }}>EUR</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, data]) => {
                  const pct = total > 0 ? (data.total / total) * 100 : 0;
                  const dot = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR["Autre"];
                  return (
                    <div key={cat} className="rounded-xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BG[cat] ?? CATEGORY_BG["Autre"]}`}>{cat}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: "var(--text)" }}>{data.total.toFixed(2)} €</span>
                          <span className="text-xs ml-1.5" style={{ color: "var(--text-sub)" }}>({pct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className={`h-full w-full rounded-full transition-transform duration-500 origin-left ${dot}`}
                          style={{ transform: `scaleX(${pct / 100})` }}
                        />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: "var(--text-sub)" }}>{data.count} reçu{data.count !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pt-4 pb-4 space-y-2.5 safe-bottom" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@comptable.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  // @ts-expect-error vendor prefix
                  "--tw-ring-color": "var(--accent)",
                }}
              />
              <button
                onClick={() => { if (email) window.location.href = buildMailto(receipts, email); }}
                disabled={!email || completed.length === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Envoyer
              </button>
            </div>
            <button
              onClick={() => downloadCSV(receipts)}
              disabled={completed.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text-sub)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger CSV (Excel)
            </button>
          </div>
        </div>
      </div>

      {/* Full image preview */}
      {previewImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImg(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImg} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </>
  );
}
