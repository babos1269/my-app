import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const CATEGORIES = [
  "Alimentation",
  "Restaurant/Café",
  "Transport",
  "Santé",
  "Vêtements",
  "Électronique",
  "Divertissement",
  "Maison",
  "Autre",
];

const VALID_VAT_RATES = [20, 10, 5.5, 2.1, 21, 12, 6, 0];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Parse robuste : accepte number, string "20", "20%", "20,0"
function toNum(val: unknown): number | undefined {
  if (typeof val === "number" && isFinite(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/[%\s]/g, "").replace(",", "."));
    return isFinite(n) ? n : undefined;
  }
  return undefined;
}

// Taux TVA par défaut selon la catégorie (France / Belgique)
function defaultVatRate(category?: string): number {
  switch (category) {
    case "Alimentation": return 5.5;
    case "Santé":        return 5.5;
    case "Restaurant/Café": return 10;
    case "Transport":    return 10;
    default:             return 20;
  }
}

function computeMissingTax(e: {
  total?: number;
  totalHT?: number;
  vatRate?: number;
  vatAmount?: number;
  category?: string;
}): {
  total?: number;
  totalHT?: number;
  vatRate?: number;
  vatAmount?: number;
  vatInferred: boolean;
} {
  const { total, totalHT, vatRate, vatAmount, category } = e;

  // Cas 1 : TTC + taux connus → calcule HT et TVA
  if (total !== undefined && vatRate !== undefined && totalHT === undefined) {
    const ht = round2(total / (1 + vatRate / 100));
    return { total, totalHT: ht, vatRate, vatAmount: round2(total - ht), vatInferred: false };
  }

  // Cas 2 : HT + taux connus → calcule TTC et TVA
  if (totalHT !== undefined && vatRate !== undefined && total === undefined) {
    const ttc = round2(totalHT * (1 + vatRate / 100));
    return { total: ttc, totalHT, vatRate, vatAmount: round2(ttc - totalHT), vatInferred: false };
  }

  // Cas 3 : HT + TTC connus → calcule le taux
  if (totalHT !== undefined && total !== undefined) {
    const tva = round2(total - totalHT);
    const rate = totalHT > 0 ? round2((tva / totalHT) * 100) : 0;
    const knownRate = VALID_VAT_RATES.find((r) => Math.abs(r - rate) < 0.8) ?? vatRate;
    return { total, totalHT, vatRate: knownRate ?? rate, vatAmount: tva, vatInferred: false };
  }

  // Cas 4 : tout disponible
  if (total !== undefined && totalHT !== undefined && vatRate !== undefined) {
    return { total, totalHT, vatRate, vatAmount: vatAmount ?? round2(total - totalHT), vatInferred: false };
  }

  // Cas 5 (fallback) : seulement TTC → inférer le taux selon la catégorie
  if (total !== undefined) {
    const rate = vatRate ?? defaultVatRate(category);
    const ht = round2(total / (1 + rate / 100));
    return { total, totalHT: ht, vatRate: rate, vatAmount: round2(total - ht), vatInferred: vatRate === undefined };
  }

  return { total, totalHT, vatRate, vatAmount, vatInferred: false };
}

export const extractReceiptData = action({
  args: {
    receiptId: v.id("receipts"),
    storageId: v.id("_storage"),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(api.receipts.update, {
        id: args.receiptId,
        status: "error",
        errorMessage: "OPENAI_API_KEY non configurée dans Convex",
      });
      return;
    }

    try {
      const url = await ctx.storage.getUrl(args.storageId);
      if (!url) throw new Error("Fichier introuvable dans le storage");

      const isImage = args.fileType.startsWith("image/");
      const isPDF = args.fileType === "application/pdf";
      if (!isImage && !isPDF) throw new Error(`Type non supporté: ${args.fileType}`);

      const prompt = `Tu es un expert comptable français. Analyse ce document (reçu, facture ou ticket de caisse) et extrait toutes les informations fiscales.

Pays possibles: France ou Belgique.
Taux TVA France: 20% (standard), 10% (restauration, travaux), 5.5% (alimentaire, livres), 2.1% (médicaments remboursables).
Taux TVA Belgique: 21% (standard), 12% (restauration), 6% (alimentaire, médicaments).

Catégories disponibles: ${CATEGORIES.join(", ")}.

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide. Tous les montants sont des nombres décimaux (pas des strings).

{
  "storeName": "nom du commerce",
  "date": "YYYY-MM-DD",
  "totalHT": 41.67,
  "vatRate": 20,
  "vatAmount": 8.33,
  "total": 50.00,
  "currency": "EUR",
  "category": "catégorie",
  "items": [{"name": "article", "priceHT": 4.17, "price": 5.00, "vatRate": 20, "quantity": 1}]
}

Règles:
- "total" = montant TTC final payé par le client
- "totalHT" = total hors TVA
- "vatRate" = taux TVA principal en nombre (ex: 20, pas "20%")
- Si le document n'affiche que le TTC, indique quand même le taux TVA probable selon le type de commerce
- Si plusieurs taux TVA, utilise le taux qui représente le plus grand montant
- Omets uniquement les champs vraiment impossibles à déduire`;

      let imageContent: object;
      if (isImage) {
        imageContent = { type: "image_url", image_url: { url, detail: "high" } };
      } else {
        const fileResponse = await fetch(url);
        if (!fileResponse.ok) throw new Error("Impossible de récupérer le PDF");
        const arrayBuffer = await fileResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.byteLength; i++) binary += String.fromCharCode(uint8Array[i]);
        imageContent = {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${btoa(binary)}`, detail: "high" },
        };
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 1500,
          messages: [{ role: "user", content: [imageContent, { type: "text", text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur OpenAI (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content ?? "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Réponse invalide: ${text.slice(0, 200)}`);

      const e = JSON.parse(jsonMatch[0]);

      const category = CATEGORIES.includes(e.category) ? e.category : "Autre";

      const tax = computeMissingTax({
        total:     toNum(e.total),
        totalHT:   toNum(e.totalHT),
        vatRate:   toNum(e.vatRate),
        vatAmount: toNum(e.vatAmount),
        category,
      });

      const items = Array.isArray(e.items)
        ? e.items.map((item: Record<string, unknown>) => ({
            name:     String(item.name ?? ""),
            price:    toNum(item.price) ?? 0,
            priceHT:  toNum(item.priceHT),
            vatRate:  toNum(item.vatRate) ?? tax.vatRate,
            quantity: toNum(item.quantity),
          }))
        : undefined;

      await ctx.runMutation(api.receipts.update, {
        id: args.receiptId,
        storeName:   typeof e.storeName === "string" ? e.storeName : undefined,
        date:        typeof e.date === "string" ? e.date : undefined,
        total:       tax.total,
        totalHT:     tax.totalHT,
        vatRate:     tax.vatRate,
        vatAmount:   tax.vatAmount,
        vatInferred: tax.vatInferred,
        currency:    typeof e.currency === "string" ? e.currency : "EUR",
        category,
        items,
        status: "completed",
      });
    } catch (error) {
      await ctx.runMutation(api.receipts.update, {
        id: args.receiptId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Extraction échouée",
      });
    }
  },
});
