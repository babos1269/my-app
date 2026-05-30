"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

type Receipt = {
  _id: Id<"receipts">;
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
  fileType: string;
  status: "processing" | "completed" | "error";
  errorMessage?: string;
  createdAt: number;
};

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const [showItems, setShowItems] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const removeReceipt = useMutation(api.receipts.remove);

  const cur = receipt.currency ?? "€";
  const displayName = receipt.storeName ?? receipt.fileName;
  const formattedDate = receipt.date
    ? new Date(receipt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : new Date(receipt.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const catDot  = CATEGORY_COLOR[receipt.category ?? ""] ?? CATEGORY_COLOR["Autre"];
  const catBadge = CATEGORY_BG[receipt.category ?? ""]  ?? CATEGORY_BG["Autre"];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Barre de statut */}
      {receipt.status === "processing" && <div className="h-0.5 bg-emerald-500 animate-pulse" />}
      {receipt.status === "error"      && <div className="h-0.5 bg-rose-500" />}

      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* Miniature */}
          <button
            className="no-active w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "var(--border)" }}
            onClick={() => receipt.imageUrl && setShowImage(true)}
          >
            {receipt.imageUrl && receipt.fileType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receipt.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6" style={{ color: "var(--text-sub)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>

          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{displayName}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{formattedDate}</p>
              </div>

              {/* Total TTC */}
              <div className="text-right shrink-0">
                {receipt.total !== undefined ? (
                  <>
                    <p className="text-lg font-bold leading-tight" style={{ color: "var(--text)" }}>
                      {receipt.total.toFixed(2)} <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>{cur}</span>
                    </p>
                    <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "var(--text-sub)" }}>TTC</p>
                  </>
                ) : receipt.status === "completed" ? (
                  <p className="text-sm italic" style={{ color: "var(--text-sub)" }}>—</p>
                ) : null}
              </div>
            </div>

            {/* Statut processing / erreur */}
            {receipt.status === "processing" && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Analyse en cours…</span>
              </div>
            )}
            {receipt.status === "error" && (
              <p className="text-xs text-rose-500 mt-1 truncate" title={receipt.errorMessage}>
                Erreur : {receipt.errorMessage}
              </p>
            )}

            {/* Catégorie + actions */}
            {receipt.status === "completed" && (
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {receipt.category && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${catBadge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${catDot}`} />
                      {receipt.category}
                    </span>
                  )}
                  {receipt.vatRate !== undefined && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--border)", color: "var(--text-sub)" }}
                      title={receipt.vatInferred ? "Taux estimé" : "Taux lu sur le document"}
                    >
                      TVA {receipt.vatRate}%{receipt.vatInferred ? " *" : ""}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeReceipt({ id: receipt._id })}
                  className="p-1.5 rounded-lg shrink-0"
                  style={{ color: "var(--text-sub)" }}
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Détail HT / TVA */}
        {receipt.status === "completed" && (receipt.totalHT !== undefined || receipt.vatAmount !== undefined) && (
          <div className="mt-3 pt-3 flex gap-5" style={{ borderTop: "1px solid var(--border)" }}>
            {receipt.totalHT !== undefined && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>HT</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>{receipt.totalHT.toFixed(2)} {cur}</p>
              </div>
            )}
            {receipt.vatAmount !== undefined && receipt.vatRate !== undefined && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>
                  TVA {receipt.vatRate}%{receipt.vatInferred ? " *" : ""}
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>{receipt.vatAmount.toFixed(2)} {cur}</p>
              </div>
            )}
            {receipt.total !== undefined && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>TTC</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>{receipt.total.toFixed(2)} {cur}</p>
              </div>
            )}
          </div>
        )}
        {receipt.vatInferred && receipt.status === "completed" && (
          <p className="text-[10px] mt-1" style={{ color: "var(--text-sub)" }}>* Taux estimé — non visible sur le document</p>
        )}

        {/* Articles */}
        {receipt.items && receipt.items.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--text-sub)" }}
              onClick={() => setShowItems(!showItems)}
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showItems ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {receipt.items.length} article{receipt.items.length > 1 ? "s" : ""}
            </button>
            {showItems && (
              <div className="mt-2 space-y-1">
                {receipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs" style={{ color: "var(--text-sub)" }}>
                    <span className="truncate mr-2">{item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>
                    <span className="shrink-0 font-medium">{item.price.toFixed(2)} {cur}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal image */}
      {showImage && receipt.imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImage(false)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receipt.imageUrl} alt={displayName} className="rounded-2xl w-full max-h-[80vh] object-contain" />
            <button onClick={() => setShowImage(false)} className="no-active absolute top-3 right-3 bg-black/60 text-white rounded-full p-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
