"use client";

import { useState, useCallback } from "react";
import type { QuestionFlowState, Answer } from "@/lib/types/questionnaire";

interface UseQuestionFlowStateReturn {
  state: QuestionFlowState;
  updateState: (updates: Partial<QuestionFlowState>) => void;
  resetState: () => void;
  setAnswer: (questionId: string, answer: Answer) => void;
  getAnswer: (questionId: string) => Answer | null;
}

const initialState: QuestionFlowState = {
  sessionId: null,
  categoryId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  isLoading: false,
  error: null,
  canGoNext: false,
  canGoPrevious: false,
  isCompleted: false,
};

export function useQuestionFlowState(): UseQuestionFlowStateReturn {
  const [state, setState] = useState<QuestionFlowState>(initialState);

  const updateState = useCallback((updates: Partial<QuestionFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const setAnswer = useCallback((questionId: string, answer: Answer) => {
    setState(prev => ({
      ...prev,
      answers: new Map(prev.answers.set(questionId, answer)),
    }));
  }, []);

  const getAnswer = useCallback((questionId: string): Answer | null => {
    return state.answers.get(questionId) || null;
  }, [state.answers]);

  return {
    state,
    updateState,
    resetState,
    setAnswer,
    getAnswer,
  };
}