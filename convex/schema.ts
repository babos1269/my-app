import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  receipts: defineTable({
    storeName: v.optional(v.string()),
    date: v.optional(v.string()),
    total: v.optional(v.number()),       // TTC
    totalHT: v.optional(v.number()),     // Hors taxes
    vatRate: v.optional(v.number()),     // Taux TVA en % (ex: 20, 5.5, 10, 21, 6)
    vatAmount: v.optional(v.number()),   // Montant TVA
    vatInferred: v.optional(v.boolean()), // true si le taux a été estimé (non lu sur le document)
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          name: v.string(),
          price: v.number(),             // Prix TTC
          priceHT: v.optional(v.number()),
          vatRate: v.optional(v.number()),
          quantity: v.optional(v.number()),
        })
      )
    ),
    imageStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
