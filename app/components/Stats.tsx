"use client";

import { useState } from "react";

type Receipt = {
  total?: number;
  totalHT?: number;
  vatAmount?: number;
  vatInferred?: boolean;
  currency?: string;
  category?: string;
  status: "processing" | "completed" | "error";
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

export function Stats({ receipts }: { receipts: Receipt[] }) {
  const [mode, setMode] = useState<"ttc" | "ht">("ttc");

  const completed = receipts.filter((r) => r.status === "completed");
  const withTotal = completed.filter((r) => r.total !== undefined);
  const withHT    = completed.filter((r) => r.totalHT !== undefined);

  const totalTTC = withTotal.reduce((s, r) => s + (r.total ?? 0), 0);
  const totalHT  = withHT.reduce((s, r) => s + (r.totalHT ?? 0), 0);
  const totalVAT = completed.reduce((s, r) => s + (r.vatAmount ?? 0), 0);

  const displayTotal = mode === "ttc" ? totalTTC : totalHT;
  const displayCount = mode === "ttc" ? withTotal.length : withHT.length;

  const byCategory = completed.reduce<Record<string, { count: number; ttc: number; ht: number }>>(
    (acc, r) => {
      const cat = r.category ?? "Autre";
      if (!acc[cat]) acc[cat] = { count: 0, ttc: 0, ht: 0 };
      acc[cat].count++;
      acc[cat].ttc += r.total ?? 0;
      acc[cat].ht  += r.totalHT ?? 0;
      return acc;
    },
    {}
  );

  const sortedCategories = Object.entries(byCategory).sort(
    (a, b) => (mode === "ttc" ? b[1].ttc - a[1].ttc : b[1].ht - a[1].ht)
  );

  return (
    <div className="space-y-3">
      {/* Toggle HT / TTC */}
      <div
        className="flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ background: "var(--border)" }}
      >
        {(["ttc", "ht"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              mode === m
                ? { background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "var(--text-sub)" }
            }
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Reçus scannés */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Reçus scannés</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>{receipts.length}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>{completed.length} analysé{completed.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Total dépensé */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>
            Total dépensé <span style={{ color: "var(--accent)" }}>{mode.toUpperCase()}</span>
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {displayTotal.toFixed(2)} <span className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>€</span>
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
            sur {displayCount} reçu{displayCount !== 1 ? "s" : ""}
            {mode === "ttc" && totalVAT > 0 && (
              <span className="ml-1" style={{ color: "var(--text-sub)", opacity: 0.6 }}>· TVA {totalVAT.toFixed(2)} €</span>
            )}
          </p>
        </div>

        {/* Top catégorie */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Top catégorie</p>
          {sortedCategories.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLOR[sortedCategories[0][0]] ?? CATEGORY_COLOR["Autre"]}`} />
                <p className="text-base font-bold truncate" style={{ color: "var(--text)" }}>{sortedCategories[0][0]}</p>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>
                {(mode === "ttc" ? sortedCategories[0][1].ttc : sortedCategories[0][1].ht).toFixed(2)} € ·{" "}
                {sortedCategories[0][1].count} reçu{sortedCategories[0][1].count !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm italic mt-2" style={{ color: "var(--text-sub)" }}>Aucune donnée</p>
          )}
        </div>

        {/* Répartition par catégorie */}
        {sortedCategories.length > 0 && (
          <div className="sm:col-span-3 rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-sub)" }}>
              Répartition ({mode.toUpperCase()})
            </p>
            <div className="space-y-3">
              {sortedCategories.map(([cat, data]) => {
                const val = mode === "ttc" ? data.ttc : data.ht;
                const pct = displayTotal > 0 ? (val / displayTotal) * 100 : 0;
                const dot = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR["Autre"];
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{cat}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-sub)" }}>{val.toFixed(2)} € ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className={`h-full w-full rounded-full transition-transform duration-500 origin-left ${dot}`}
                        style={{ transform: `scaleX(${pct / 100})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
