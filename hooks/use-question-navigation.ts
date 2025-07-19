"use client";

import { useCallback } from "react";
import type {
  QuestionFlowState,
  Question,
  Answer,
} from "@/lib/types/questionnaire";

interface UseQuestionNavigationReturn {
  getCurrentQuestion: (state: QuestionFlowState) => Question | null;
  getCurrentAnswer: (state: QuestionFlowState) => Answer | null;
  getProgress: (state: QuestionFlowState) => {
    current: number;
    total: number;
    percentage: number;
  };
  canGoNext: (state: QuestionFlowState) => boolean;
  canGoPrevious: (state: QuestionFlowState) => boolean;
  isCompleted: (state: QuestionFlowState) => boolean;
}

export function useQuestionNavigation(): UseQuestionNavigationReturn {
  const getCurrentQuestion = useCallback(
    (state: QuestionFlowState): Question | null => {
      if (
        !state.questions ||
        !Array.isArray(state.questions) ||
        state.questions.length === 0 ||
        state.currentQuestionIndex >= state.questions.length
      ) {
        return null;
      }
      return state.questions[state.currentQuestionIndex];
    },
    []
  );

  const getCurrentAnswer = useCallback(
    (state: QuestionFlowState): Answer | null => {
      const currentQuestion = getCurrentQuestion(state);
      if (!currentQuestion) return null;

      if (!state.answers || typeof state.answers.get !== "function") {
        return null;
      }

      return state.answers.get(currentQuestion.id) || null;
    },
    [getCurrentQuestion]
  );

  const getProgress = useCallback((state: QuestionFlowState) => {
    const current = state.currentQuestionIndex + 1;
    const total =
      state.questions && Array.isArray(state.questions)
        ? state.questions.length
        : 0;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }, []);

  const canGoNext = useCallback(
    (state: QuestionFlowState): boolean => {
      const currentQuestion = getCurrentQuestion(state);
      if (!currentQuestion) return false;

      const currentAnswer = getCurrentAnswer(state);
      const questionsLength =
        state.questions && Array.isArray(state.questions)
          ? state.questions.length
          : 0;

      // 必須質問の場合は回答が必要
      if (currentQuestion.is_required && !currentAnswer) {
        return false;
      }

      // 質問タイプに応じたバリデーション
      if (currentAnswer) {
        switch (currentQuestion.type) {
          case "SINGLE_CHOICE":
            if (!currentAnswer.questionOptionId) return false;
            break;
          case "MULTIPLE_CHOICE":
            if (
              !currentAnswer.questionOptionIds ||
              currentAnswer.questionOptionIds.length === 0
            )
              return false;
            break;
          case "RANGE":
            if (currentAnswer.range_value === undefined) return false;
            break;
          case "TEXT":
            if (
              !currentAnswer.text_value ||
              currentAnswer.text_value.trim().length === 0
            )
              return false;
            break;
        }
      }

      return state.currentQuestionIndex <= questionsLength - 1;
    },
    [getCurrentQuestion, getCurrentAnswer]
  );

  const canGoPrevious = useCallback((state: QuestionFlowState): boolean => {
    return state.currentQuestionIndex > 0;
  }, []);

  const isCompleted = useCallback((state: QuestionFlowState): boolean => {
    const questionsLength =
      state.questions && Array.isArray(state.questions)
        ? state.questions.length
        : 0;
    return state.currentQuestionIndex >= questionsLength && questionsLength > 0;
  }, []);

  return {
    getCurrentQuestion,
    getCurrentAnswer,
    getProgress,
    canGoNext,
    canGoPrevious,
    isCompleted,
  };
}
