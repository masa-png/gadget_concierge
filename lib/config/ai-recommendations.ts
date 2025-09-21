/**
 * AI Recommendation Configuration
 *
 * This file contains configuration settings for the AI recommendation system,
 * including Mastra AI integration settings, recommendation parameters, and timeouts.
 */

export const AI_RECOMMENDATION_CONFIG = {
  // Maximum number of recommendations to generate per session
  maxRecommendations: parseInt(process.env.MAX_RECOMMENDATIONS || "10"),

  // Confidence threshold for product mapping (0.0 - 1.0)
  mappingThreshold: parseFloat(
    process.env.MAPPING_CONFIDENCE_THRESHOLD || "0.7"
  ),

  // AI temperature setting for response creativity (0.0 - 1.0)
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || "0.3"),

  // Timeout configurations in milliseconds
  timeouts: {
    // Timeout for AI API requests
    aiRequest: parseInt(process.env.MASTRA_TIMEOUT || "30000"),
    // Timeout for database operations
    dbOperation: 10000,
  },

  // Mastra AI service configuration
  mastra: {
    apiKey: process.env.MASTRA_API_KEY,
    apiUrl: process.env.MASTRA_API_URL || "https://api.mastra.ai",
    timeout: parseInt(process.env.MASTRA_TIMEOUT || "30000"),
  },
} as const;

/**
 * Validates that all required configuration values are present
 * @throws Error if required configuration is missing
 */
export function validateAIConfig(): void {
  const requiredEnvVars = ["MASTRA_API_KEY"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for AI recommendations: ${missingVars.join(
        ", "
      )}`
    );
  }

  // Validate numeric ranges
  if (
    AI_RECOMMENDATION_CONFIG.mappingThreshold < 0 ||
    AI_RECOMMENDATION_CONFIG.mappingThreshold > 1
  ) {
    throw new Error("MAPPING_CONFIDENCE_THRESHOLD must be between 0.0 and 1.0");
  }

  if (
    AI_RECOMMENDATION_CONFIG.aiTemperature < 0 ||
    AI_RECOMMENDATION_CONFIG.aiTemperature > 1
  ) {
    throw new Error("AI_TEMPERATURE must be between 0.0 and 1.0");
  }

  if (
    AI_RECOMMENDATION_CONFIG.maxRecommendations < 1 ||
    AI_RECOMMENDATION_CONFIG.maxRecommendations > 50
  ) {
    throw new Error("MAX_RECOMMENDATIONS must be between 1 and 50");
  }
}

/**
 * Type definitions for configuration
 */
export type AIRecommendationConfig = typeof AI_RECOMMENDATION_CONFIG;
