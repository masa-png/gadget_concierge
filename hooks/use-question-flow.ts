"use client";

import { useState, useEffect, useCallback } from "react";

// 型定義のインポート
import {
  QuestionType,
  Question,
  Answer,
  QuestionFlowState,
} from "@/lib/types/questionnaire";

// 質問フロー管理フック
const useQuestionFlow = () => {
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
    return state.answers.get(currentQuestion.id) || null;
  }, [getCurrentQuestion, state.answers]);

  // 現在の質問のバリデーション
  const validateCurrentQuestion = useCallback((): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    if (!currentQuestion.is_required) return true;

    const answer = getCurrentAnswer();
    if (!answer) return false;

    switch (currentQuestion.type) {
      case QuestionType.SINGLE_CHOICE:
        return !!answer.questionOptionId;
      case QuestionType.MULTIPLE_CHOICE:
        return !!(
          answer.questionOptionIds && answer.questionOptionIds.length > 0
        );
      case QuestionType.RANGE:
        return answer.range_value !== undefined && answer.range_value !== null;
      case QuestionType.TEXT:
        return !!(answer.text_value && answer.text_value.trim().length > 0);
      default:
        return false;
    }
  }, [getCurrentQuestion, getCurrentAnswer]);

  // 進捗情報を取得
  const getProgress = useCallback(() => {
    const current = state.currentQuestionIndex + 1;
    const total = state.questions.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  }, [state.currentQuestionIndex, state.questions.length]);

  // ナビゲーション状態を更新
  const updateNavigationState = useCallback(() => {
    const canGoNext =
      validateCurrentQuestion() ||
      state.currentQuestionIndex < state.questions.length - 1;
    const canGoPrevious = state.currentQuestionIndex > 0;
    const isCompleted =
      state.currentQuestionIndex >= state.questions.length &&
      state.questions.length > 0;

    setState((prev) => ({
      ...prev,
      canGoNext,
      canGoPrevious,
      isCompleted,
    }));
  }, [
    state.currentQuestionIndex,
    state.questions.length,
    validateCurrentQuestion,
  ]);

  // フローを初期化
  const initializeFlow = useCallback(
    async (categoryId: string, sessionId?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // モックデータ（実際のAPIエンドポイント実装まで）
        const mockQuestions: Question[] = [
          {
            id: "1",
            text: "主な使用用途は何ですか？",
            description:
              "スマートフォンをどのような場面で使用されることが多いですか？",
            type: QuestionType.SINGLE_CHOICE,
            is_required: true,
            options: [
              {
                id: "1a",
                label: "通話・メール・SNS中心",
                description: "基本的な連絡手段として使用",
                value: "basic_communication",
              },
              {
                id: "1b",
                label: "写真・動画撮影",
                description: "カメラ機能を重視した使用",
                value: "camera_focused",
              },
              {
                id: "1c",
                label: "ゲーム・動画視聴",
                description: "エンターテイメント用途がメイン",
                value: "entertainment",
              },
              {
                id: "1d",
                label: "ビジネス・仕事",
                description: "仕事での利用が中心",
                value: "business",
              },
            ],
          },
          {
            id: "2",
            text: "ご希望の予算はどのくらいですか？",
            description: "スマートフォンの購入予算を教えてください",
            type: QuestionType.SINGLE_CHOICE,
            is_required: true,
            options: [
              {
                id: "2a",
                label: "5万円以下",
                description: "エントリーモデル",
                value: "budget_under_50k",
              },
              {
                id: "2b",
                label: "5-10万円",
                description: "ミドルレンジモデル",
                value: "budget_50k_100k",
              },
              {
                id: "2c",
                label: "10-15万円",
                description: "ハイエンドモデル",
                value: "budget_100k_150k",
              },
              {
                id: "2d",
                label: "15万円以上",
                description: "フラッグシップモデル",
                value: "budget_over_150k",
              },
            ],
          },
          {
            id: "3",
            text: "カメラ性能の重要度は？",
            description:
              "1（重要でない）から10（とても重要）で評価してください",
            type: QuestionType.RANGE,
            is_required: false,
          },
          {
            id: "4",
            text: "重視したい機能は何ですか？",
            description: "最も重要な機能を選んでください（複数選択可）",
            type: QuestionType.MULTIPLE_CHOICE,
            is_required: true,
            options: [
              {
                id: "4a",
                label: "バッテリー持続時間",
                description: "長時間の使用が可能",
                value: "battery_life",
              },
              {
                id: "4b",
                label: "処理速度・性能",
                description: "アプリの動作がスムーズ",
                value: "performance",
              },
              {
                id: "4c",
                label: "ディスプレイ品質",
                description: "画面の美しさ・見やすさ",
                value: "display_quality",
              },
              {
                id: "4d",
                label: "ストレージ容量",
                description: "データをたくさん保存",
                value: "storage_capacity",
              },
            ],
          },
          {
            id: "5",
            text: "その他ご要望がございましたら教えてください",
            description: "自由にご記入ください",
            type: QuestionType.TEXT,
            is_required: false,
          },
        ];

        // セッションIDを生成（実際のAPIではサーバーから取得）
        const actualSessionId = sessionId || `session_${Date.now()}`;

        setState((prev) => ({
          ...prev,
          sessionId: actualSessionId,
          categoryId,
          questions: mockQuestions,
          currentQuestionIndex: 0,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "予期しないエラーが発生しました",
        }));
      }
    },
    []
  );

  // 回答を保存
  const saveAnswer = useCallback(
    async (answer: Answer) => {
      if (!state.sessionId) {
        console.error("セッションIDが設定されていません");
        return;
      }

      try {
        // 実際のAPIではここでサーバーに保存
        console.log("回答保存:", { sessionId: state.sessionId, ...answer });

        // ローカル状態を更新
        setState((prev) => ({
          ...prev,
          answers: new Map(prev.answers.set(answer.questionId, answer)),
        }));
      } catch (error) {
        console.error("回答保存エラー:", error);
      }
    },
    [state.sessionId]
  );

  // 次の質問へ
  const goToNext = useCallback(() => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  }, [state.currentQuestionIndex, state.questions.length]);

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
      // 実際のAPIではサーバーでセッション完了処理
      console.log("セッション完了:", state.sessionId);

      setState((prev) => ({
        ...prev,
        isCompleted: true,
      }));
    } catch (error) {
      console.error("セッション完了エラー:", error);
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
