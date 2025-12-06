import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";

// SITE_URL must be set in Convex dashboard for Better Auth to work
const siteUrl = process.env.SITE_URL || "http://localhost:3000";

// The component client exposes helper methods for Convex + Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    // Disable noisy logging when only generating options
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Allow requests from these origins (app hosts and Convex site)
    trustedOrigins: [
      "https://chat.opulentia.ai",
      "https://worldeater.im",
      "http://localhost:3000",
      "https://brilliant-ferret-250.convex.site",
    ],
    // Simple email/password auth without email verification for now
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // Convex compatibility plugin
      convex(),
    ],
  });
};

// Convenience query to fetch the current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

