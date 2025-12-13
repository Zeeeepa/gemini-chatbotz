"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const DEEPCRAWL_API_KEY = process.env.DEEPCRAWL_API_KEY;

async function getClient() {
  if (!DEEPCRAWL_API_KEY) {
    return { error: "Deepcrawl API key not configured. Set DEEPCRAWL_API_KEY in environment." };
  }
  try {
    const { DeepcrawlApp } = await import("deepcrawl");
    const client = new DeepcrawlApp({ apiKey: DEEPCRAWL_API_KEY });
    return { client };
  } catch (error) {
    return { error: String(error) };
  }
}

// Helper for REST API calls when SDK methods aren't available
async function fetchDeepcrawlApi(endpoint: string, options?: Record<string, unknown>) {
  const url = new URL(`https://api.deepcrawl.dev${endpoint}`);
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${DEEPCRAWL_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deepcrawl API error: ${response.status} - ${text}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

/**
 * Get Markdown - Turn any URL into clean markdown via the GET /read endpoint.
 * Ideal for quick pulls, cached refreshes, or building prompt-ready snippets.
 */
export const getMarkdown = internalAction({
  args: {
    url: v.string(),
    expirationTtl: v.optional(v.number()),
    cleaningProcessor: v.optional(v.union(v.literal("html-rewriter"), v.literal("cheerio-reader"))),
  },
  handler: async (_ctx, args) => {
    const { client, error } = await getClient();
    if (!client) {
      return { status: "unavailable", reason: error };
    }

    try {
      const options: Record<string, unknown> = {};
      
      if (args.expirationTtl) {
        options.cacheOptions = { expirationTtl: args.expirationTtl };
      }
      if (args.cleaningProcessor) {
        options.cleaningProcessor = args.cleaningProcessor;
      }

      const markdown = await client.getMarkdown(args.url, options);
      
      return {
        status: "success",
        url: args.url,
        markdown: typeof markdown === "string" ? markdown : String(markdown),
      };
    } catch (err) {
      return { status: "error", reason: String(err), url: args.url };
    }
  },
});

/**
 * Read URL - Capture full page context, metadata, and logs via the POST /read endpoint.
 * Returns structured metadata, cleaned/markdown/HTML variants, optional metrics, robots data, and more.
 */
export const readUrl = internalAction({
  args: {
    url: v.string(),
    markdown: v.optional(v.boolean()),
    rawHtml: v.optional(v.boolean()),
    metadata: v.optional(v.boolean()),
    cleanedHtml: v.optional(v.boolean()),
    robots: v.optional(v.boolean()),
    sitemapXML: v.optional(v.boolean()),
    expirationTtl: v.optional(v.number()),
    cleaningProcessor: v.optional(v.union(v.literal("html-rewriter"), v.literal("cheerio-reader"))),
  },
  handler: async (_ctx, args) => {
    const { client, error } = await getClient();
    if (!client) {
      return { status: "unavailable", reason: error };
    }

    try {
      const options: Record<string, unknown> = {
        markdown: args.markdown ?? true,
        metadata: args.metadata ?? true,
        cleanedHtml: args.cleanedHtml,
        rawHtml: args.rawHtml,
        robots: args.robots,
        sitemapXML: args.sitemapXML,
      };

      if (args.expirationTtl) {
        options.cacheOptions = { expirationTtl: args.expirationTtl };
      }
      if (args.cleaningProcessor) {
        options.cleaningProcessor = args.cleaningProcessor;
      }

      const result = await client.readUrl(args.url, options);

      return {
        status: "success",
        requestId: result.requestId,
        targetUrl: result.targetUrl,
        timestamp: result.timestamp,
        cached: result.cached,
        title: result.title,
        description: result.description,
        metadata: result.metadata,
        markdown: result.markdown,
        cleanedHtml: result.cleanedHtml,
        rawHtml: result.rawHtml,
        metrics: result.metrics,
      };
    } catch (err) {
      return { status: "error", reason: String(err), url: args.url };
    }
  },
});

/**
 * Get Links - Fetch extracted links for a page via GET /links.
 * Quick access support directly from your browser URL bar.
 */
export const getLinks = internalAction({
  args: {
    url: v.string(),
    tree: v.optional(v.boolean()),
    metadata: v.optional(v.boolean()),
    cleanedHtml: v.optional(v.boolean()),
    includeExternal: v.optional(v.boolean()),
    includeMedia: v.optional(v.boolean()),
    folderFirst: v.optional(v.boolean()),
    linksOrder: v.optional(v.union(v.literal("alphabetical"), v.literal("page"))),
    expirationTtl: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (!DEEPCRAWL_API_KEY) {
      return { status: "unavailable", reason: "Deepcrawl API key not configured." };
    }

    try {
      // Use REST API directly for getLinks (GET /links endpoint)
      const queryParams: Record<string, unknown> = {
        url: args.url,
        tree: args.tree ?? true,
        metadata: args.metadata,
        cleanedHtml: args.cleanedHtml,
        folderFirst: args.folderFirst,
        linksOrder: args.linksOrder,
        includeExternal: args.includeExternal,
        includeMedia: args.includeMedia,
      };

      const result = await fetchDeepcrawlApi("/links", queryParams);

      return {
        status: "success",
        requestId: result.requestId,
        targetUrl: result.targetUrl,
        timestamp: result.timestamp,
        cached: result.cached,
        tree: result.tree,
        ancestors: result.ancestors,
        title: result.title,
        description: result.description,
        extractedLinks: result.extractedLinks,
        metrics: result.metrics,
      };
    } catch (err) {
      return { status: "error", reason: String(err), url: args.url };
    }
  },
});

/**
 * Extract Links - Crawl a page and return a structured site map with metadata via POST /links.
 * Deep, configurable crawl endpoint that builds a hierarchical links tree site map.
 */
export const extractLinks = internalAction({
  args: {
    url: v.string(),
    tree: v.optional(v.boolean()),
    metadata: v.optional(v.boolean()),
    cleanedHtml: v.optional(v.boolean()),
    robots: v.optional(v.boolean()),
    sitemapXML: v.optional(v.boolean()),
    includeExternal: v.optional(v.boolean()),
    includeMedia: v.optional(v.boolean()),
    stripQueryParams: v.optional(v.boolean()),
    excludePatterns: v.optional(v.array(v.string())),
    folderFirst: v.optional(v.boolean()),
    linksOrder: v.optional(v.union(v.literal("alphabetical"), v.literal("page"))),
    extractedLinks: v.optional(v.boolean()),
    subdomainAsRootUrl: v.optional(v.boolean()),
    expirationTtl: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { client, error } = await getClient();
    if (!client) {
      return { status: "unavailable", reason: error };
    }

    try {
      const options: Record<string, unknown> = {
        tree: args.tree ?? true,
        metadata: args.metadata ?? true,
        cleanedHtml: args.cleanedHtml,
        robots: args.robots,
        sitemapXML: args.sitemapXML,
        folderFirst: args.folderFirst,
        linksOrder: args.linksOrder,
        extractedLinks: args.extractedLinks,
        subdomainAsRootUrl: args.subdomainAsRootUrl,
      };

      const linkExtractionOptions: Record<string, unknown> = {};
      if (args.includeExternal !== undefined) linkExtractionOptions.includeExternal = args.includeExternal;
      if (args.includeMedia !== undefined) linkExtractionOptions.includeMedia = args.includeMedia;
      if (args.stripQueryParams !== undefined) linkExtractionOptions.stripQueryParams = args.stripQueryParams;
      if (args.excludePatterns) linkExtractionOptions.excludePatterns = args.excludePatterns;
      
      if (Object.keys(linkExtractionOptions).length > 0) {
        options.linkExtractionOptions = linkExtractionOptions;
      }

      if (args.expirationTtl) {
        options.cacheOptions = { expirationTtl: args.expirationTtl };
      }

      const result = await client.extractLinks(args.url, options);

      return {
        status: "success",
        requestId: result.requestId,
        targetUrl: result.targetUrl,
        timestamp: result.timestamp,
        cached: result.cached,
        tree: (result as any).tree,
        ancestors: result.ancestors,
        title: (result as any).title,
        description: (result as any).description,
        metadata: (result as any).metadata,
        extractedLinks: (result as any).extractedLinks,
        skippedUrls: (result as any).skippedUrls,
        metrics: result.metrics,
      };
    } catch (err) {
      return { status: "error", reason: String(err), url: args.url };
    }
  },
});
