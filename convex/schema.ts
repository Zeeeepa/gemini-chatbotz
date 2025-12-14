import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Memory categories for organizing agent knowledge
export const MemoryCategory = v.union(
  v.literal("PREFERENCES"),   // User preferences, settings, communication style
  v.literal("CONTEXT"),       // Background info, projects, goals
  v.literal("PATTERNS"),      // User's common patterns, workflows, habits
  v.literal("HISTORY"),       // Important past interactions, decisions
  v.literal("SKILLS"),        // User's technical skills, expertise areas
  v.literal("ARCHITECTURE"),  // System design, tech stack, patterns
  v.literal("BUGS"),          // Known issues, debugging insights, workarounds
  v.literal("TESTING"),       // Test patterns, frameworks, requirements
  v.literal("CONFIG"),        // Configuration patterns, environment variables
  v.literal("GENERAL")        // Other important context
);

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.optional(v.string()),
    name: v.optional(v.string()),
  }).index("by_email", ["email"]),

  reservations: defineTable({
    createdAt: v.number(),
    details: v.any(),
    hasCompletedPayment: v.boolean(),
    userId: v.string(),
    threadId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),

  userThreads: defineTable({
    threadId: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),

  // Persistent memory system for AI agent personalization
  memories: defineTable({
    content: v.string(),           // The actual memory content
    category: MemoryCategory,      // Category for organization
    userId: v.string(),            // Owner of this memory
    threadId: v.optional(v.string()), // Thread that created this memory (optional)
    importance: v.optional(v.number()), // Priority/importance score (1-10)
    createdAt: v.number(),         // Unix timestamp (ms)
    updatedAt: v.number(),         // Unix timestamp (ms)
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_thread", ["threadId"]),
});
