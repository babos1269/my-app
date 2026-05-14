"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UploadZone } from "./components/UploadZone";
import { ReceiptCard } from "./components/ReceiptCard";
import { Stats } from "./components/Stats";
import { ExportModal } from "./components/ExportModal";
import { ThemeToggle } from "./components/ThemeToggle";

type Receipt = NonNullable<ReturnType<typeof useQuery<typeof api.receipts.list>>>[number];

function groupByMonth(receipts: Receipt[]) {
  const groups: Record<string, { label: string; receipts: Receipt[] }> = {};
  for (const r of receipts) {
    const d = new Date(r.date ? r.date + "T00:00:00" : r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = { label: label.charAt(0).toUpperCase() + label.slice(1), receipts: [] };
    groups[key].receipts.push(r);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function MonthGroup({ label, receipts }: { label: string; receipts: Receipt[] }) {
  const [open, setOpen] = useState(true);
  const total = receipts
    .filter((r) => r.status === "completed" && r.total !== undefined)
    .reduce((s, r) => s + (r.total ?? 0), 0);
  const completedCount = receipts.filter((r) => r.status === "completed").length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-3.5 h-3.5 transition-transform shrink-0 ${open ? "rotate-90" : ""}`}
            style={{ color: "var(--text-sub)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold capitalize" style={{ color: "var(--text)" }}>{label}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--border)", color: "var(--text-sub)" }}
          >
            {receipts.length} reçu{receipts.length !== 1 ? "s" : ""}
          </span>
        </div>
        {completedCount > 0 && (
          <span className="text-sm font-bold shrink-0" style={{ color: "var(--text)" }}>
            {total.toFixed(2)} <span className="font-normal text-xs" style={{ color: "var(--text-sub)" }}>€</span>
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-2 space-y-2">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt._id} receipt={receipt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClearAllModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onCancel}>
      <div
        className="rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 bg-rose-100 dark:bg-rose-900/30">
          <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-center mb-1" style={{ color: "var(--text)" }}>Tout supprimer ?</h3>
        <p className="text-sm text-center mb-6" style={{ color: "var(--text-sub)" }}>
          Cette action supprime définitivement tous les reçus, photos et l&apos;historique complet. Irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text-sub)" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            Tout effacer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const receiptsData = useQuery(api.receipts.list);
  const receipts = useMemo(() => receiptsData ?? [], [receiptsData]);
  const clearAll = useMutation(api.receipts.clearAll);

  const [showExport, setShowExport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const grouped = useMemo(() => groupByMonth(receipts), [receipts]);
  const completedCount = receipts.filter((r) => r.status === "completed").length;

  async function handleClearAll() {
    await clearAll();
    setShowClearConfirm(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 header-with-notch"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-base font-bold truncate" style={{ color: "var(--text)" }}>Gestion des reçus</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {receipts.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-rose-500"
                title="Tout effacer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {completedCount > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 dark:bg-emerald-500 text-white transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Rapport
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 safe-bottom">
        {/* Upload */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-sub)" }}>Nouveau reçu</p>
          <UploadZone />
        </section>

        {/* Stats */}
        {receipts.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-sub)" }}>Statistiques</p>
            <Stats receipts={receipts} />
          </section>
        )}

        {/* Receipts grouped by month */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Historique</p>
            {receipts.length > 0 && (
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{receipts.length} reçu{receipts.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--border)" }}>
                <svg className="w-8 h-8" style={{ color: "var(--text-sub)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium" style={{ color: "var(--text-sub)" }}>Aucun reçu pour l&apos;instant</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-sub)", opacity: 0.6 }}>Uploadez votre premier reçu ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grouped.map(([key, { label, receipts: monthReceipts }]) => (
                <MonthGroup key={key} label={label} receipts={monthReceipts} />
              ))}
            </div>
          )}
        </section>
      </main>

      {showExport && <ExportModal receipts={receipts} onClose={() => setShowExport(false)} />}
      {showClearConfirm && <ClearAllModal onConfirm={handleClearAll} onCancel={() => setShowClearConfirm(false)} />}
    </div>
  );
}
