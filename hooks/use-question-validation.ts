"use client";

import { useCallback } from "react";
import type { Question, Answer } from "@/lib/types/questionnaire";

interface UseQuestionValidationReturn {
  validateAnswer: (question: Question, answer: Answer | null) => boolean;
  getValidationError: (
    question: Question,
    answer: Answer | null
  ) => string | null;
  validateAllAnswers: (
    questions: Question[],
    answers: Map<string, Answer>
  ) => boolean;
}

export function useQuestionValidation(): UseQuestionValidationReturn {
  const validateAnswer = useCallback(
    (question: Question, answer: Answer | null): boolean => {
      // 必須質問の場合は回答が必要
      if (question.is_required && !answer) {
        return false;
      }

      // 回答がない場合（かつ必須でない場合）は有効
      if (!answer) {
        return true;
      }

      // 質問タイプに応じたバリデーション
      switch (question.type) {
        case "SINGLE_CHOICE":
          return !!answer.questionOptionId;

        case "MULTIPLE_CHOICE":
          return !!(
            answer.questionOptionIds && answer.questionOptionIds.length > 0
          );

        case "RANGE":
          return (
            answer.range_value !== undefined && answer.range_value !== null
          );

        case "TEXT":
          return !!(answer.text_value && answer.text_value.trim().length > 0);

        default:
          return false;
      }
    },
    []
  );

  const getValidationError = useCallback(
    (question: Question, answer: Answer | null): string | null => {
      if (question.is_required && !answer) {
        return "この質問への回答は必須です";
      }

      if (!answer) {
        return null;
      }

      switch (question.type) {
        case "SINGLE_CHOICE":
          if (!answer.questionOptionId) {
            return "選択肢を1つ選んでください";
          }
          break;

        case "MULTIPLE_CHOICE":
          if (
            !answer.questionOptionIds ||
            answer.questionOptionIds.length === 0
          ) {
            return "少なくとも1つの選択肢を選んでください";
          }
          break;

        case "RANGE":
          if (answer.range_value === undefined || answer.range_value === null) {
            return "範囲を選択してください";
          }
          break;

        case "TEXT":
          if (!answer.text_value || answer.text_value.trim().length === 0) {
            return "テキストを入力してください";
          }
          break;

        default:
          return "無効な質問タイプです";
      }

      return null;
    },
    []
  );

  const validateAllAnswers = useCallback(
    (questions: Question[], answers: Map<string, Answer>): boolean => {
      return questions.every((question) => {
        const answer = answers.get(question.id) || null;
        return validateAnswer(question, answer);
      });
    },
    [validateAnswer]
  );

  return {
    validateAnswer,
    getValidationError,
    validateAllAnswers,
  };
}
