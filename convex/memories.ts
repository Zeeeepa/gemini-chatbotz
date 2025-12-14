import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { MemoryCategory } from "./schema";

// Export internal versions for use by agent tools

// ==================== MUTATIONS ====================

/**
 * Create a new memory
 */
export const create = mutation({
  args: {
    content: v.string(),
    category: MemoryCategory,
    userId: v.string(),
    threadId: v.optional(v.string()),
    importance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const memoryId = await ctx.db.insert("memories", {
      content: args.content,
      category: args.category,
      userId: args.userId,
      threadId: args.threadId,
      importance: args.importance ?? 5,
      createdAt: now,
      updatedAt: now,
    });
    return { memoryId };
  },
});

/**
 * Update an existing memory
 */
export const update = mutation({
  args: {
    memoryId: v.id("memories"),
    content: v.optional(v.string()),
    category: v.optional(MemoryCategory),
    importance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.memoryId);
    if (!existing) {
      throw new Error("Memory not found");
    }
    const patchData: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.content !== undefined) patchData.content = args.content;
    if (args.category !== undefined) patchData.category = args.category;
    if (args.importance !== undefined) patchData.importance = args.importance;
    await ctx.db.patch(args.memoryId, patchData);
    return { success: true };
  },
});

/**
 * Delete a memory permanently
 */
export const remove = mutation({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.memoryId);
    if (!existing) {
      throw new Error("Memory not found");
    }
    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});

// ==================== QUERIES ====================

/**
 * Get a single memory by ID
 */
export const get = query({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.memoryId);
  },
});

/**
 * Get all memories for a user
 * This is the PRIMARY query pattern for the agent
 */
export const byUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get memories for a user filtered by category
 */
export const byUserAndCategory = query({
  args: {
    userId: v.string(),
    category: MemoryCategory,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", args.category)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get memories for a specific thread
 */
export const byThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("memories")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .collect();
  },
});

/**
 * Search memories by content (simple text search)
 */
export const search = query({
  args: {
    userId: v.string(),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    if (!args.searchTerm) {
      return memories;
    }
    const term = args.searchTerm.toLowerCase();
    return memories.filter((m) => m.content.toLowerCase().includes(term));
  },
});
