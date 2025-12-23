/**
 * MiniMax M2.1 Model - Quick Test Script
 * Run with: npx tsx convex/test-minimax-m2.1.ts
 */

import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY environment variable is required");
  process.exit(1);
}

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

const minimaxM21 = openrouter("minimax/minimax-m2.1");

async function runTests() {
  console.log("🧪 Testing MiniMax M2.1 model via OpenRouter...\n");

  try {
    // Test 1: Basic text generation
    console.log("Test 1: Basic text generation");
    const { text: text1 } = await generateText({
      model: minimaxM21,
      prompt: "Say 'Hello from MiniMax M2.1' and nothing else.",
    });
    console.log("✅ Response:", text1);
    console.log("");

    // Test 2: Coding task
    console.log("Test 2: Coding task");
    const { text: text2 } = await generateText({
      model: minimaxM21,
      prompt: "Write a TypeScript function that adds two numbers. Only output the code.",
    });
    console.log("✅ Response:", text2);
    console.log("");

    // Test 3: Verify model ID
    console.log("Test 3: Model ID verification");
    console.log("✅ Model ID:", minimaxM21.modelId);
    console.log("");

    console.log("🎉 All tests passed! MiniMax M2.1 is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
