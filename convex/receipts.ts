import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  handler: async (ctx) => {
    const receipts = await ctx.db.query("receipts").order("desc").collect();
    return await Promise.all(
      receipts.map(async (receipt) => ({
        ...receipt,
        imageUrl: await ctx.storage.getUrl(receipt.imageStorageId),
      }))
    );
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const receiptId = await ctx.db.insert("receipts", {
      imageStorageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      status: "processing",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, api.extract.extractReceiptData, {
      receiptId,
      storageId: args.storageId,
      fileType: args.fileType,
    });

    return receiptId;
  },
});

export const update = mutation({
  args: {
    id: v.id("receipts"),
    storeName: v.optional(v.string()),
    date: v.optional(v.string()),
    total: v.optional(v.number()),
    totalHT: v.optional(v.number()),
    vatRate: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
    vatInferred: v.optional(v.boolean()),
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          name: v.string(),
          price: v.number(),
          priceHT: v.optional(v.number()),
          vatRate: v.optional(v.number()),
          quantity: v.optional(v.number()),
        })
      )
    ),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.id);
    if (receipt) {
      await ctx.storage.delete(receipt.imageStorageId);
      await ctx.db.delete(args.id);
    }
  },
});

export const clearAll = mutation({
  handler: async (ctx) => {
    const receipts = await ctx.db.query("receipts").collect();
    await Promise.all(
      receipts.map(async (receipt) => {
        await ctx.storage.delete(receipt.imageStorageId);
        await ctx.db.delete(receipt._id);
      })
    );
    return receipts.length;
  },
});
