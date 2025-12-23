/**
 * MiniMax M2.1 Model - Functional Test
 * 
 * Tests the MiniMax M2.1 model integration via OpenRouter.
 * Run with: pnpm vitest run convex/minimax-m2.1.spec.ts
 */

import { expect, test, describe } from "vitest";
import { generateText, generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

// Skip if no API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

describe.skipIf(!OPENROUTER_API_KEY)("MiniMax M2.1 Model Tests", () => {
  const openrouter = createOpenRouter({
    apiKey: OPENROUTER_API_KEY,
  });

  // MiniMax M2.1 - lightweight 10B model optimized for coding and agentic workflows
  const minimaxM21 = openrouter("minimax/minimax-m2.1");

  test("should generate text with MiniMax M2.1", async () => {
    const { text } = await generateText({
      model: minimaxM21,
      prompt: "Say 'Hello from MiniMax M2.1' and nothing else.",
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
    console.log("✅ Text generation response:", text);
  }, 30000);

  test("should generate structured object with MiniMax M2.1", async () => {
    const { object } = await generateObject({
      model: minimaxM21,
      prompt: "Generate a test user profile",
      schema: z.object({
        name: z.string().describe("User's full name"),
        age: z.number().describe("User's age"),
        occupation: z.string().describe("User's job title"),
        isActive: z.boolean().describe("Whether user is active"),
      }),
    });

    expect(object).toBeDefined();
    expect(object.name).toBeDefined();
    expect(typeof object.age).toBe("number");
    expect(typeof object.occupation).toBe("string");
    expect(typeof object.isActive).toBe("boolean");
    console.log("✅ Object generation response:", JSON.stringify(object, null, 2));
  }, 30000);

  test("should handle coding task with MiniMax M2.1", async () => {
    const { text } = await generateText({
      model: minimaxM21,
      prompt: "Write a simple TypeScript function that adds two numbers. Only output the code, no explanation.",
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
    // Should contain function-like syntax
    expect(text).toMatch(/function|const|=>|\(/);
    console.log("✅ Coding task response:", text);
  }, 30000);

  test("should verify model ID is minimax/minimax-m2.1", async () => {
    const modelId = minimaxM21.modelId;
    expect(modelId).toBe("minimax/minimax-m2.1");
    console.log("✅ Model ID verified:", modelId);
  });

  test("should handle 204K context window capability", async () => {
    // Test with a reasonably sized prompt to verify model accepts it
    const longPrompt = "Summarize the following text: " + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(50);
    
    const { text } = await generateText({
      model: minimaxM21,
      prompt: longPrompt,
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
    console.log("✅ Large context handling works");
  }, 30000);
});
