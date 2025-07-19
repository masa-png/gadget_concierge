"use client";

import { useCallback } from "react";
import { sessionApi, questionApi, answerApi } from "@/lib/api-client";
import type { Question, Answer } from "@/lib/types/questionnaire";
import {
  convertApiQuestionsToClient,
  convertClientAnswerToApi,
} from "@/lib/types/questionnaire-api";
import {
  handleQuestionnaireError,
} from "@/lib/errors/questionnaire-error";

interface UseQuestionApiReturn {
  createSession: (categoryId: string) => Promise<{ sessionId: string }>;
  getQuestions: (categoryId: string) => Promise<Question[]>;
  saveAnswer: (sessionId: string, answer: Answer) => Promise<void>;
  completeSession: (sessionId: string) => Promise<any>;
  handleApiError: (error: unknown) => string;
}

export function useQuestionApi(): UseQuestionApiReturn {
  const createSession = useCallback(async (categoryId: string) => {
    const response = await sessionApi.create(categoryId);
    return { sessionId: response.data.session.id };
  }, []);

  const getQuestions = useCallback(
    async (categoryId: string): Promise<Question[]> => {
      try {
        const response = await questionApi.getByCategory(categoryId);
        return convertApiQuestionsToClient(response);
      } catch (error) {
        throw handleQuestionnaireError(error);
      }
    },
    []
  );

  const saveAnswer = useCallback(async (sessionId: string, answer: Answer) => {
    try {
      const apiAnswer = convertClientAnswerToApi(answer);
      await answerApi.save(sessionId, apiAnswer);
    } catch (error) {
      throw handleQuestionnaireError(error);
    }
  }, []);

  const completeSession = useCallback(async (sessionId: string) => {
    return await sessionApi.complete(sessionId);
  }, []);

  const handleApiError = useCallback((error: unknown): string => {
    const questionnaireError = handleQuestionnaireError(error);
    return questionnaireError.message;
  }, []);

  return {
    createSession,
    getQuestions,
    saveAnswer,
    completeSession,
    handleApiError,
  };
}
