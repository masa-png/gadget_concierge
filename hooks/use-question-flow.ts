"use client";

import { useState, useEffect, useCallback } from "react";

// 型定義のインポート
import {
  QuestionType,
  Question,
  Answer,
  QuestionFlowState,
} from "@/lib/types/questionnaire";

// APIクライアントのインポート
import {
  sessionApi,
  questionApi,
  answerApi,
  ApiError,
  isAuthError,
} from "@/lib/api-client";

// 認証フックのインポート
import { useAuth } from "@/app/_components/shared/providers/auth-provider";

// 質問フロー管理フック
const useQuestionFlow = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<QuestionFlowState>({
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
  });

  // 現在の質問を取得
  const getCurrentQuestion = useCallback((): Question | null => {
    if (
      !state.questions ||
      !Array.isArray(state.questions) ||
      state.questions.length === 0 ||
      state.currentQuestionIndex >= state.questions.length
    ) {
      return null;
    }
    return state.questions[state.currentQuestionIndex];
  }, [state.questions, state.currentQuestionIndex]);

  // 現在の質問の回答を取得
  const getCurrentAnswer = useCallback((): Answer | null => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;

    // 安全なアクセスのため、answersが存在することを確認
    if (!state.answers || typeof state.answers.get !== "function") {
      return null;
    }

    return state.answers.get(currentQuestion.id) || null;
  }, [getCurrentQuestion, state.answers]);

  // 現在の質問のバリデーション
  const validateCurrentQuestion = useCallback((): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    const currentAnswer = getCurrentAnswer();

    // 必須質問の場合は回答が必要
    if (currentQuestion.is_required && !currentAnswer) {
      return false;
    }

    // 質問タイプに応じたバリデーション
    switch (currentQuestion.type) {
      case "SINGLE_CHOICE":
        return !!currentAnswer?.questionOptionId;
      case "MULTIPLE_CHOICE":
        return !!(
          currentAnswer?.questionOptionIds &&
          currentAnswer.questionOptionIds.length > 0
        );
      case "RANGE":
        return currentAnswer?.range_value !== undefined;
      case "TEXT":
        return !!(
          currentAnswer?.text_value &&
          currentAnswer.text_value.trim().length > 0
        );
      default:
        return false;
    }
  }, [getCurrentQuestion, getCurrentAnswer]);

  // 進捗情報を取得
  const getProgress = useCallback(() => {
    const current = state.currentQuestionIndex + 1;
    const total =
      state.questions && Array.isArray(state.questions)
        ? state.questions.length
        : 0;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  }, [state.currentQuestionIndex, state.questions]);

  // ナビゲーション状態を更新
  const updateNavigationState = useCallback(() => {
    const questionsLength =
      state.questions && Array.isArray(state.questions)
        ? state.questions.length
        : 0;

    const canGoNext =
      validateCurrentQuestion() ||
      state.currentQuestionIndex < questionsLength - 1;
    const canGoPrevious = state.currentQuestionIndex > 0;
    const isCompleted =
      state.currentQuestionIndex >= questionsLength && questionsLength > 0;

    setState((prev) => ({
      ...prev,
      canGoNext,
      canGoPrevious,
      isCompleted,
    }));
  }, [state.currentQuestionIndex, state.questions, validateCurrentQuestion]);

  // フローを初期化
  const initializeFlow = useCallback(
    async (categoryId: string, sessionId?: string) => {
      // 認証状態を確認
      if (authLoading) {
        setState((prev) => ({
          ...prev,
          error: "認証状態を確認中です...",
        }));
        return;
      }

      if (!isAuthenticated) {
        setState((prev) => ({
          ...prev,
          error: "ログインが必要です",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let actualSessionId = sessionId;

        // セッションIDがない場合は新規作成
        if (!actualSessionId) {
          const sessionResponse = await sessionApi.create(categoryId);
          actualSessionId = sessionResponse.data.session.id;
        }

        console.log("セッションID:", actualSessionId);

        // 質問データを取得
        const questionsResponse = await questionApi.getByCategory(categoryId);

        console.log("取得した質問データ:", questionsResponse);

        // APIレスポンスの安全性を確認
        if (
          !questionsResponse?.data ||
          !Array.isArray(questionsResponse.data.questions)
        ) {
          throw new Error("質問データの取得に失敗しました");
        }

        // APIレスポンスをQuestion型に変換
        const questions: Question[] = questionsResponse.data.questions.map(
          (q) => ({
            id: q.id,
            text: q.text,
            description: q.description,
            type: q.type as QuestionType,
            is_required: q.is_required,
            options: Array.isArray(q.options)
              ? q.options.map((opt) => ({
                  id: opt.id,
                  label: opt.label,
                  description: opt.description,
                  value: opt.value,
                }))
              : [],
          })
        );

        setState((prev) => ({
          ...prev,
          sessionId: actualSessionId,
          categoryId,
          questions,
          currentQuestionIndex: 0,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error("質問フロー初期化エラー:", error);

        if (isAuthError(error)) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "ログインが必要です。ページを再読み込みしてください。",
          }));
        } else if (error instanceof ApiError && error.status === 429) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "リクエストが多すぎます。しばらく待ってから再度お試しください。",
          }));
        } else if (error instanceof TypeError) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "サーバーに接続できません。ネットワークやサーバー状態を確認してください。",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              error instanceof ApiError
                ? error.message
                : "予期しないエラーが発生しました",
          }));
        }
      }
    },
    [isAuthenticated, authLoading]
  );

  // 回答を保存
  const saveAnswer = useCallback(
    async (answer: Answer) => {
      if (!state.sessionId) {
        console.error("セッションIDが設定されていません");
        return;
      }

      try {
        // APIに回答を保存
        await answerApi.save(state.sessionId, {
          questionId: answer.questionId,
          questionOptionId: answer.questionOptionId,
          questionOptionIds: answer.questionOptionIds,
          range_value: answer.range_value,
          text_value: answer.text_value,
        });

        // ローカル状態を更新
        setState((prev) => ({
          ...prev,
          answers: new Map(prev.answers.set(answer.questionId, answer)),
        }));
      } catch (error) {
        console.error("回答保存エラー:", error);
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error("回答の保存に失敗しました");
      }
    },
    [state.sessionId]
  );

  // 次の質問へ
  const goToNext = useCallback(() => {
    const questionsLength =
      state.questions && Array.isArray(state.questions)
        ? state.questions.length
        : 0;
    if (state.currentQuestionIndex < questionsLength - 1) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  }, [state.currentQuestionIndex, state.questions]);

  // 前の質問へ
  const goToPrevious = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  }, [state.currentQuestionIndex]);

  // フローを完了
  const completeFlow = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      // APIでセッション完了処理
      const response = await sessionApi.complete(state.sessionId);

      setState((prev) => ({
        ...prev,
        isCompleted: true,
      }));

      return response;
    } catch (error) {
      console.error("セッション完了エラー:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("セッションの完了に失敗しました");
    }
  }, [state.sessionId]);

  // ナビゲーション状態の更新（回答やインデックス変更時）
  useEffect(() => {
    updateNavigationState();
  }, [updateNavigationState]);

  return {
    ...state,
    initializeFlow,
    goToNext,
    goToPrevious,
    saveAnswer,
    completeFlow,
    validateCurrentQuestion,
    getCurrentQuestion,
    getProgress,
  };
};

export default useQuestionFlow;
