/**
 * Mastra AI Client Configuration
 *
 * This file provides the basic client setup for Mastra AI integration.
 * It handles client initialization and basic configuration.
 */

import { Mastra } from "@mastra/core";
import { validateAIConfig } from "../config/ai-recommendations";

/**
 * Singleton Mastra client instance
 */
let mastraClient: Mastra | null = null;

/**
 * Initialize and return the Mastra AI client
 * @returns Configured Mastra client instance
 * @throws Error if configuration is invalid
 */
export function getMastraClient(): Mastra {
  if (!mastraClient) {
    // Validate configuration before creating client
    validateAIConfig();

    // Initialize Mastra client with basic configuration
    // The actual configuration will be extended when implementing the AI service
    mastraClient = new Mastra({
      // Basic Mastra configuration - specific AI provider setup will be done in the AI service
    });
  }

  return mastraClient;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetMastraClient(): void {
  mastraClient = null;
}

/**
 * Check if Mastra client is properly configured
 * @returns true if client can be initialized, false otherwise
 */
export function isMastraConfigured(): boolean {
  try {
    validateAIConfig();
    return true;
  } catch {
    return false;
  }
}
