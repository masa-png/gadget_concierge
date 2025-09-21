/**
 * Type definitions for AI Recommendation System
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the AI recommendation generation system.
 */

import { QuestionType } from "@prisma/client";

/**
 * Processed answer data structure for AI input
 */
export interface ProcessedAnswer {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  answer: {
    optionLabel?: string;
    optionValue?: string;
    rangeValue?: number;
    textValue?: string;
  };
}

/**
 * Structured data format for AI processing
 */
export interface AIInputData {
  categoryId: string;
  categoryName: string;
  userProfile: {
    age?: number;
    gender?: string;
    preferences?: Record<string, any>;
  };
  answers: ProcessedAnswer[];
}

/**
 * Prompt template structure for different categories
 */
export interface PromptTemplate {
  categoryId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat: string;
}

/**
 * AI recommendation request structure
 */
export interface AIRecommendationRequest {
  prompt: string;
  maxRecommendations: number;
  temperature?: number;
}

/**
 * Individual AI recommendation response item
 */
export interface AIRecommendationItem {
  productName: string;
  reason: string;
  score: number;
  features: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

/**
 * Complete AI recommendation response
 */
export interface AIRecommendationResponse {
  recommendations: AIRecommendationItem[];
}

/**
 * Product matching result
 */
export interface ProductMatch {
  productId: string;
  confidence: number;
  matchReasons: string[];
}

/**
 * Recommendation data for database storage
 */
export interface RecommendationData {
  sessionId: string;
  productId: string;
  rank: number;
  score: number;
  reason: string;
}

/**
 * Error log structure for AI recommendation system
 */
export interface ErrorLog {
  timestamp: Date;
  sessionId: string;
  userId: string;
  errorType: "VALIDATION" | "AI_SERVICE" | "DATABASE" | "MAPPING";
  errorCode: string;
  message: string;
  stackTrace?: string;
  context: Record<string, any>;
}

/**
 * Service interface definitions
 */

export interface AnswerProcessorService {
  processSessionAnswers(sessionId: string): Promise<ProcessedAnswer[]>;
  structureForAI(answers: ProcessedAnswer[]): Promise<AIInputData>;
}

export interface PromptGeneratorService {
  generatePrompt(
    categoryId: string,
    userProfile: any,
    answers: ProcessedAnswer[]
  ): Promise<string>;
  getCategoryTemplate(categoryId: string): Promise<PromptTemplate>;
}

export interface MastraAIService {
  generateRecommendations(
    request: AIRecommendationRequest
  ): Promise<AIRecommendationResponse>;
  validateResponse(response: any): boolean;
}

export interface ProductMapperService {
  mapAIRecommendationToProduct(
    aiRecommendation: AIRecommendationItem,
    categoryId: string
  ): Promise<ProductMatch | null>;
  findSimilarProducts(
    name: string,
    features: string[],
    categoryId: string,
    priceRange?: { min: number; max: number }
  ): Promise<ProductMatch[]>;
}

export interface RecommendationSaverService {
  saveRecommendations(recommendations: RecommendationData[]): Promise<void>;
  checkExistingRecommendations(sessionId: string): Promise<boolean>;
}
