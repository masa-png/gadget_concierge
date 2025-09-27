"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";
import { useQuestionFlowState } from "./use-question-flow-state";
import { useQuestionApi } from "./use-question-api";
import { useQuestionNavigation } from "./use-question-navigation";
import { useQuestionValidation } from "./use-question-validation";
import type { Answer } from "@/lib/types/questionnaire";
import { convertApiQuestionsToClient } from "@/lib/types/questionnaire-api";
import {
  handleQuestionnaireError,
  createQuestionnaireError,
} from "@/lib/errors/questionnaire-error";

// 質問データのfetcher
const questionsFetcher = async (categoryId: string) => {
  const { questionApi } = await import("@/lib/api-client");
  const response = await questionApi.getByCategory(categoryId);

  return convertApiQuestionsToClient(response);
};

// 質問フロー管理フック
const useQuestionFlow = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state, updateState, resetState, setAnswer } = useQuestionFlowState();
  const { createSession, saveAnswer, completeSession } = useQuestionApi();
  const {
    getCurrentQuestion,
    getCurrentAnswer,
    getProgress,
    canGoNext,
    canGoPrevious,
    isCompleted,
  } = useQuestionNavigation();
  const { validateAnswer, getValidationError } = useQuestionValidation();

  // SWRで質問データを管理
  const {
    data: questions,
    error: questionsError,
    mutate: mutateQuestions,
  } = useSWR(
    state.categoryId ? `questions-${state.categoryId}` : null,
    () => (state.categoryId ? questionsFetcher(state.categoryId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分間キャッシュ
    }
  );

  // 質問データが取得できたら状態を更新
  useEffect(() => {
    if (questions && Array.isArray(questions)) {
      updateState({ questions, isLoading: false });
    } else if (questionsError) {
      const questionnaireError = handleQuestionnaireError(questionsError);
      updateState({
        isLoading: false,
        error: questionnaireError.message,
      });
    }
  }, [questions, questionsError, updateState]);

  // フローを初期化
  const initializeFlow = useCallback(
    async (categoryId: string, sessionId?: string) => {
      // 認証状態を確認
      if (authLoading) {
        const error = createQuestionnaireError.authLoading();
        updateState({ error: error.message });
        return;
      }

      if (!isAuthenticated) {
        const error = createQuestionnaireError.authRequired();
        updateState({ error: error.message });
        return;
      }

      updateState({ isLoading: true, error: null, categoryId });

      try {
        // セッションIDがある場合のみセット（新規作成は次の質問ボタン押下時に行う）
        if (sessionId) {
          updateState({
            sessionId,
            categoryId,
            currentQuestionIndex: 0,
            error: null,
          });
        } else {
          updateState({
            categoryId,
            currentQuestionIndex: 0,
            error: null,
          });
        }

        // SWRで質問データを取得開始
        mutateQuestions();
      } catch (error) {
        const questionnaireError = handleQuestionnaireError(error);
        updateState({ isLoading: false, error: questionnaireError.message });
      }
    },
    [isAuthenticated, authLoading, updateState, mutateQuestions]
  );

  // セッションを作成（必要に応じて）
  const ensureSession = useCallback(async () => {
    // セッションIDが既にある場合はそれを使用
    if (state.sessionId) {
      return state.sessionId;
    }

    // セッションIDがない場合は新規作成
    if (state.categoryId) {
      const { sessionId: newSessionId } = await createSession(state.categoryId);
      updateState({ sessionId: newSessionId });
      return newSessionId;
    }

    return null;
  }, [state.sessionId, state.categoryId, createSession, updateState]);

  // 回答を保存
  const saveAnswerToApi = useCallback(
    async (answer: Answer) => {
      try {
        const sessionId = await ensureSession();
        if (!sessionId) {
          throw createQuestionnaireError.sessionNotFound();
        }

        await saveAnswer(sessionId, answer);
        setAnswer(answer.questionId, answer);
      } catch (error) {
        throw handleQuestionnaireError(error);
      }
    },
    [ensureSession, saveAnswer, setAnswer]
  );

  // 次の質問へ
  const goToNext = useCallback(() => {
    if (canGoNext(state)) {
      updateState({ currentQuestionIndex: state.currentQuestionIndex + 1 });
    }
  }, [state, canGoNext, updateState]);

  // 前の質問へ
  const goToPrevious = useCallback(() => {
    if (canGoPrevious(state)) {
      updateState({ currentQuestionIndex: state.currentQuestionIndex - 1 });
    }
  }, [state, canGoPrevious, updateState]);

  // フローを完了
  const completeFlow = useCallback(async () => {
    try {
      const sessionId = await ensureSession();
      if (!sessionId) {
        throw createQuestionnaireError.sessionNotFound();
      }

      // セッションを完了状態に更新
      const response = await completeSession(sessionId);

      // AIレコメンド生成を開始
      const { recommendationApi } = await import("@/lib/api-client");
      await recommendationApi.generate(sessionId);

      updateState({ isCompleted: true });
      return response;
    } catch (error) {
      throw handleQuestionnaireError(error);
    }
  }, [ensureSession, completeSession, updateState]);

  // 現在の質問のバリデーション
  const validateCurrentQuestion = useCallback(() => {
    const currentQuestion = getCurrentQuestion(state);
    if (!currentQuestion) return false;

    const currentAnswer = getCurrentAnswer(state);
    return validateAnswer(currentQuestion, currentAnswer);
  }, [state, getCurrentQuestion, getCurrentAnswer, validateAnswer]);

  // 現在の質問のバリデーションエラーを取得
  const getCurrentValidationError = useCallback(() => {
    const currentQuestion = getCurrentQuestion(state);
    if (!currentQuestion) return null;

    const currentAnswer = getCurrentAnswer(state);
    return getValidationError(currentQuestion, currentAnswer);
  }, [state, getCurrentQuestion, getCurrentAnswer, getValidationError]);

  // ナビゲーション状態の更新（回答やインデックス変更時）
  useEffect(() => {
    const nextCanGoNext = canGoNext(state);
    const nextCanGoPrevious = canGoPrevious(state);
    const nextIsCompleted = isCompleted(state);

    updateState({
      canGoNext: nextCanGoNext,
      canGoPrevious: nextCanGoPrevious,
      isCompleted: nextIsCompleted,
    });
  }, [
    state.currentQuestionIndex,
    state.answers,
    state.questions,
    canGoNext,
    canGoPrevious,
    isCompleted,
    updateState,
  ]);

  return {
    // 状態
    ...state,

    // ナビゲーション
    getCurrentQuestion: () => getCurrentQuestion(state),
    getCurrentAnswer: () => getCurrentAnswer(state),
    getProgress: () => getProgress(state),

    // バリデーション
    validateCurrentQuestion,
    getCurrentValidationError,

    // アクション
    initializeFlow,
    saveAnswer: saveAnswerToApi,
    setAnswer,
    goToNext,
    goToPrevious,
    completeFlow,
    resetState,

    // SWR関連
    mutateQuestions,
    isQuestionsLoading: !questions && !questionsError && state.categoryId,
  };
};

export default useQuestionFlow;
