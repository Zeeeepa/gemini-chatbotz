import { query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { listUIMessages } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";

/**
 * Debug query to check if messages are being saved to the agent component
 */
export const checkThreadMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    try {
      // Use listUIMessages from @convex-dev/agent to get messages
      const result = await listUIMessages(ctx, components.agent, {
        threadId,
        paginationOpts: { numItems: 50, cursor: null },
      });
      
      return {
        success: true,
        threadId,
        messageCount: result.page.length,
        messages: result.page.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          partsCount: msg.parts?.length || 0,
          createdAt: msg.createdAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        threadId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Debug query to get thread info
 */
export const getThreadInfo = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    try {
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId,
      });
      
      return {
        success: true,
        thread: thread ? {
          id: thread._id,
          userId: thread.userId,
          status: thread.status,
          createdAt: thread._creationTime,
        } : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
