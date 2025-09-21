/**
 * Simple validation script to test AI configuration setup
 */

import {
  AI_RECOMMENDATION_CONFIG,
  validateAIConfig,
} from "../lib/config/ai-recommendations";

console.log("🔧 Validating AI Recommendation Configuration...\n");

try {
  console.log("📋 Current Configuration:");
  console.log(
    `  Max Recommendations: ${AI_RECOMMENDATION_CONFIG.maxRecommendations}`
  );
  console.log(
    `  Mapping Threshold: ${AI_RECOMMENDATION_CONFIG.mappingThreshold}`
  );
  console.log(`  AI Temperature: ${AI_RECOMMENDATION_CONFIG.aiTemperature}`);
  console.log(
    `  AI Request Timeout: ${AI_RECOMMENDATION_CONFIG.timeouts.aiRequest}ms`
  );
  console.log(
    `  DB Operation Timeout: ${AI_RECOMMENDATION_CONFIG.timeouts.dbOperation}ms`
  );
  console.log(`  Mastra API URL: ${AI_RECOMMENDATION_CONFIG.mastra.apiUrl}`);
  console.log(
    `  Mastra API Key: ${
      AI_RECOMMENDATION_CONFIG.mastra.apiKey ? "[SET]" : "[NOT SET]"
    }\n`
  );

  console.log("🔍 Running validation...");
  validateAIConfig();
  console.log("✅ Configuration validation passed!");
} catch (error: any) {
  console.error("❌ Configuration validation failed:");
  console.error(`   ${error.message}`);
  process.exit(1);
}

console.log("\n🎉 AI Recommendation system is ready for implementation!");
