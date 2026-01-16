import { action } from "./_generated/server";
import { v } from "convex/values";
import { createFireworks } from "@ai-sdk/fireworks";
import { generateText } from "ai";
import { z } from "zod";

/**
 * Test action to verify GLM-4.7 model works via Fireworks
 * Run via Convex CLI: npx convex run testGLM47:testGLM47Model
 */
export const testGLM47Model = action({
  args: {
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, { prompt = "Say 'Hello from GLM-4.7!' and explain in one sentence what makes you special." }) => {
    console.log("[TEST GLM-4.7] Starting test...");
    console.log("[TEST GLM-4.7] Fireworks API key present:", !!process.env.FIREWORKS_API_KEY);
    
    try {
      const fireworks = createFireworks({
        apiKey: process.env.FIREWORKS_API_KEY,
      });
      
      const model = fireworks("accounts/fireworks/models/glm-4p7");
      
      console.log("[TEST GLM-4.7] Generating text with prompt:", prompt);
      
      const result = await generateText({
        model,
        prompt,
      });
      
      console.log("[TEST GLM-4.7] ✅ Success! Response:", result.text);
      console.log("[TEST GLM-4.7] Token usage:", result.usage);
      
      return {
        success: true,
        modelId: "accounts/fireworks/models/glm-4p7",
        response: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
      };
    } catch (error) {
      console.error("[TEST GLM-4.7] ❌ Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  },
});

/**
 * Test GLM-4.7 with function calling
 * Run via Convex CLI: npx convex run testGLM47:testGLM47FunctionCalling
 */
export const testGLM47FunctionCalling = action({
  args: {},
  handler: async () => {
    console.log("[TEST GLM-4.7 Function Calling] Starting test...");
    
    try {
      const fireworks = createFireworks({
        apiKey: process.env.FIREWORKS_API_KEY,
      });
      
      const model = fireworks("accounts/fireworks/models/glm-4p7");
      
      const result = await generateText({
        model,
        prompt: "What's the weather like in San Francisco? Use the getWeather tool.",
        tools: {
          getWeather: {
            description: "Get the weather for a location",
            inputSchema: z.object({
              location: z.string().describe("The city name"),
            }),
            execute: async ({ location }) => {
              return { location, temperature: 72, condition: "sunny" };
            },
          },
        },
      });
      
      console.log("[TEST GLM-4.7 Function Calling] ✅ Success!");
      console.log("[TEST GLM-4.7 Function Calling] Response:", result.text);
      console.log("[TEST GLM-4.7 Function Calling] Tool calls:", result.toolCalls?.length || 0);
      
      return {
        success: true,
        response: result.text,
        toolCallsCount: result.toolCalls?.length || 0,
        usage: result.usage,
      };
    } catch (error) {
      console.error("[TEST GLM-4.7 Function Calling] ❌ Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
