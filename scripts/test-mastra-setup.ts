/**
 * Test script to verify Mastra client setup
 */

import {
  getMastraClient,
  isMastraConfigured,
} from "../lib/services/mastra-client";

console.log("🔧 Testing Mastra AI Client Setup...\n");

try {
  console.log("🔍 Checking if Mastra is configured...");
  const isConfigured = isMastraConfigured();
  console.log(
    `Configuration status: ${isConfigured ? "✅ Valid" : "❌ Invalid"}`
  );

  if (isConfigured) {
    console.log("\n🚀 Initializing Mastra client...");
    const client = getMastraClient();
    console.log("✅ Mastra client initialized successfully!");
    console.log(`Client type: ${typeof client}`);
  }
} catch (error: any) {
  console.error("❌ Mastra setup failed:");
  console.error(`   ${error.message}`);
  process.exit(1);
}

console.log("\n🎉 Mastra AI integration is ready!");
