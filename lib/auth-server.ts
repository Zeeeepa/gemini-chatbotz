import { createAuth } from "@/convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";

// Helper to fetch an auth token for server actions or API routes
export const getToken = () => {
  return getTokenNextjs(createAuth);
};

