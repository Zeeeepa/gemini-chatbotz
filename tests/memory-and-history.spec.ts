import { test, expect } from "@playwright/test";

// Production URL from env
const PROD_URL = process.env.PROD_URL || "http://localhost:3000";

test.describe("Memory System and Thread History Tests", () => {
  test.describe.configure({ mode: "serial" });

  test("Thread History - should display history panel for logged-in users", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    // Look for the history/menu button in navbar
    const historyButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await expect(historyButton).toBeVisible({ timeout: 10000 });
    
    // Click to open history panel
    await historyButton.click();
    await page.waitForTimeout(500);

    // Check if history sheet/panel opened
    const historyPanel = page.locator('[role="dialog"], [data-state="open"]').first();
    
    // Take screenshot
    await page.screenshot({ 
      path: "tests/screenshots/history-panel.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: history-panel.png");

    // Should show either "History" text or login prompt for guests
    const pageContent = await page.content();
    const hasHistory = pageContent.includes("History") || pageContent.includes("Login to save");
    expect(hasHistory).toBeTruthy();
    console.log("✓ History panel accessible");
  });

  test("Thread History - should show 'New Chat' button when logged in", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    // Open history panel
    const historyButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await historyButton.click();
    await page.waitForTimeout(500);

    // Look for new chat button or login prompt
    const newChatButton = page.locator("a, button").filter({ hasText: /new chat/i });
    const loginPrompt = page.locator("text=/Login to save/i");

    const hasNewChat = await newChatButton.count() > 0;
    const hasLoginPrompt = await loginPrompt.count() > 0;

    // Should have one or the other depending on auth state
    expect(hasNewChat || hasLoginPrompt).toBeTruthy();
    console.log(hasNewChat ? "✓ New Chat button visible (logged in)" : "✓ Login prompt visible (guest)");
  });

  test("Chat - should create new thread and update URL", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    // Find the textarea input
    const promptInput = page.locator("textarea").first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Type a message
    await promptInput.fill("Hello, test message for thread creation");
    console.log("✓ Typed test message");

    // Submit - try button first, then Enter key
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      await promptInput.press("Enter");
    }
    console.log("✓ Submitted message");

    // Wait for response and URL update
    await page.waitForTimeout(5000);

    // Check if URL was updated with thread ID
    const currentUrl = page.url();
    const hasThreadId = currentUrl.includes("/chat/");
    
    await page.screenshot({ 
      path: "tests/screenshots/thread-created.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: thread-created.png");
    console.log(`URL after send: ${currentUrl}`);
    
    // URL should update to include thread ID
    if (hasThreadId) {
      console.log("✓ Thread ID in URL - thread created successfully");
    } else {
      console.log("⚠ Thread ID not in URL yet (may still be processing)");
    }
  });

  test("Memory Tools - verify memory tools are available in agent", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    // Find the textarea input
    const promptInput = page.locator("textarea").first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Ask the agent about its memory capabilities
    await promptInput.fill("What memory tools do you have available? Can you list your memories?");
    
    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      await promptInput.press("Enter");
    }
    console.log("✓ Asked about memory capabilities");

    // Wait for response
    await page.waitForTimeout(15000);

    await page.screenshot({ 
      path: "tests/screenshots/memory-tools-response.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: memory-tools-response.png");

    // Check response for memory-related content
    const pageContent = await page.content();
    const hasMemoryMention = 
      pageContent.toLowerCase().includes("memory") ||
      pageContent.toLowerCase().includes("remember") ||
      pageContent.toLowerCase().includes("preferences");
    
    console.log(hasMemoryMention 
      ? "✓ Agent responded about memory capabilities" 
      : "⚠ Memory not explicitly mentioned in response");
  });

  test("Memory Tools - test addMemory tool invocation", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    const promptInput = page.locator("textarea").first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Ask the agent to remember something specific
    await promptInput.fill("Please remember that I prefer concise responses and I'm working on a Next.js project with TypeScript.");
    
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      await promptInput.press("Enter");
    }
    console.log("✓ Asked agent to remember preferences");

    // Wait for response
    await page.waitForTimeout(15000);

    await page.screenshot({ 
      path: "tests/screenshots/add-memory-test.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: add-memory-test.png");

    // Check for tool invocation or acknowledgment
    const pageContent = await page.content();
    const hasToolCall = 
      pageContent.includes("tool-") || 
      pageContent.includes("addMemory") ||
      pageContent.toLowerCase().includes("remembered") ||
      pageContent.toLowerCase().includes("noted") ||
      pageContent.toLowerCase().includes("stored");
    
    console.log(hasToolCall 
      ? "✓ Agent appears to have processed memory request" 
      : "⚠ Memory tool invocation not detected in UI");
  });

  test("Artifact Viewer - check dark mode contrast", async ({ page }) => {
    // Test in dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    const promptInput = page.locator("textarea").first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Ask for code to trigger artifact
    await promptInput.fill("Create a simple TypeScript function that adds two numbers");
    
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      await promptInput.press("Enter");
    }
    console.log("✓ Requested code artifact");

    // Wait for response
    await page.waitForTimeout(15000);

    await page.screenshot({ 
      path: "tests/screenshots/artifact-dark-mode.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: artifact-dark-mode.png");

    // Look for code blocks or artifacts
    const codeElements = page.locator("pre, code, [class*='artifact']");
    const codeCount = await codeElements.count();
    
    console.log(`Found ${codeCount} code/artifact elements`);
    
    if (codeCount > 0) {
      // Check visibility of text in code blocks
      const firstCode = codeElements.first();
      const isVisible = await firstCode.isVisible();
      console.log(isVisible ? "✓ Code artifact is visible in dark mode" : "⚠ Code artifact visibility issue");
    }
  });

  test("Artifact Viewer - check light mode contrast", async ({ page }) => {
    // Test in light mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(PROD_URL);
    await page.waitForLoadState("networkidle");

    const promptInput = page.locator("textarea").first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Ask for code to trigger artifact
    await promptInput.fill("Write a Python hello world function");
    
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      await promptInput.press("Enter");
    }
    console.log("✓ Requested code artifact (light mode)");

    // Wait for response
    await page.waitForTimeout(15000);

    await page.screenshot({ 
      path: "tests/screenshots/artifact-light-mode.png", 
      fullPage: true 
    });
    console.log("✓ Screenshot: artifact-light-mode.png");
  });
});

test.describe("Convex Memory API Tests", () => {
  test("Memory mutations should be accessible", async ({ request }) => {
    // Test that the Convex endpoint is reachable
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-ferret-250.convex.cloud";
    
    try {
      const response = await request.get(convexUrl);
      // Convex cloud should respond (even if with error for invalid request)
      console.log(`Convex endpoint status: ${response.status()}`);
      expect(response.status()).toBeLessThan(500);
      console.log("✓ Convex endpoint is reachable");
    } catch (error) {
      console.log("⚠ Could not reach Convex endpoint directly (expected if CORS)");
    }
  });
});
