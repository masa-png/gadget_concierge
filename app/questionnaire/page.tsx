"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CategorySelection from "@/app/_components/features/questionnaire/category-selection";
import QuestionDisplay from "@/app/_components/features/questionnaire/question-display";
import QuestionProgress from "@/app/_components/features/questionnaire/question-progress";
import QuestionNavigation from "@/app/_components/features/questionnaire/question-navigation";
import ToastContainer from "@/app/_components/ui/toast-container";
import { Button } from "@/app/_components/ui/button";
import useQuestionFlow from "@/hooks/use-question-flow";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";
import useToast from "@/hooks/use-toast";
import { QuestionType } from "@/lib/types/questionnaire";

// 質問のステップ定義
enum QuestionnaireStep {
  CATEGORY_SELECTION = 0,
  QUESTIONS = 1,
  COMPLETION = 2,
}

const QuestionnairePage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<QuestionnaireStep>(
    QuestionnaireStep.CATEGORY_SELECTION
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const questionFlow = useQuestionFlow();
  const { toasts, showError, showSuccess, removeToast } = useToast();

  // 認証状態の確認
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // 未認証の場合はログインページにリダイレクト
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // 認証中または未認証の場合はローディング表示
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              認証状態を確認中...
            </h2>
            <p className="text-gray-500">しばらくお待ちください</p>
          </div>
        </div>
      </div>
    );
  }

  // カテゴリ選択時の処理
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    try {
      // 質問フローを初期化
      await questionFlow.initializeFlow(categoryId, sessionId || undefined);
      setCurrentStep(QuestionnaireStep.QUESTIONS);
      showSuccess(
        "診断を開始しました",
        "質問に回答してガジェットをお探しください"
      );
    } catch (error) {
      console.error("質問フローの初期化に失敗しました:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました";
      showError("診断の開始に失敗しました", errorMessage);
    }
  };

  // 質問フローでの次へ進む処理
  const handleNextQuestion = async () => {
    if (questionFlow.isCompleted) {
      // 質問完了
      setCurrentStep(QuestionnaireStep.COMPLETION);
      return;
    }

    try {
      await questionFlow.goToNext();
    } catch (error) {
      console.error("次の質問への移動に失敗しました:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました";
      showError("次の質問への移動に失敗しました", errorMessage);
    }
  };

  // 質問フローでの前へ戻る処理
  const handlePreviousQuestion = async () => {
    const questionsLength =
      questionFlow.questions && Array.isArray(questionFlow.questions)
        ? questionFlow.questions.length
        : 0;

    if (questionFlow.currentQuestionIndex === 0) {
      // 最初の質問の場合はカテゴリ選択に戻る
      setCurrentStep(QuestionnaireStep.CATEGORY_SELECTION);
      // resetFlowは存在しないので、新しいフローを開始
      setSelectedCategoryId("");
      setSessionId(null);
      return;
    }

    try {
      await questionFlow.goToPrevious();
    } catch (error) {
      console.error("前の質問への移動に失敗しました:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました";
      showError("前の質問への移動に失敗しました", errorMessage);
    }
  };

  // 質問完了時の処理
  const handleCompletion = async () => {
    try {
      if (sessionId) {
        // セッション完了APIを呼び出し
        await questionFlow.completeFlow();

        // 完了後の処理（例：結果ページへの遷移）
        router.push(`/questionnaire/result?sessionId=${sessionId}`);
      }
    } catch (error) {
      console.error("質問完了処理に失敗しました:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました";
      showError("結果の取得に失敗しました", errorMessage);
    }
  };

  // 質問再開時の処理
  const handleResume = () => {
    setCurrentStep(QuestionnaireStep.QUESTIONS);
  };

  // 新規開始時の処理
  const handleNewStart = () => {
    setCurrentStep(QuestionnaireStep.CATEGORY_SELECTION);
    setSelectedCategoryId("");
    setSessionId(null);
  };

  // ローディング状態の表示
  if (questionFlow.isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              読み込み中...
            </h2>
            <p className="text-gray-500">質問データを準備しています</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (questionFlow.error) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-500 mb-6">{questionFlow.error}</p>
            <Button onClick={handleNewStart} variant="default">
              最初からやり直す
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // カテゴリ選択画面
  if (currentStep === QuestionnaireStep.CATEGORY_SELECTION) {
    return (
      <CategorySelection
        onCategorySelect={handleCategorySelect}
        onNext={() => {}} // カテゴリ選択では使用しない
        onPrevious={() => router.push("/")}
        currentStep={1}
        totalSteps={1}
      />
    );
  }

  // 質問フロー画面
  if (currentStep === QuestionnaireStep.QUESTIONS) {
    const progress =
      questionFlow.questions.length > 0
        ? {
            current: questionFlow.currentQuestionIndex + 1,
            total: questionFlow.questions.length,
            percentage: Math.round(
              ((questionFlow.currentQuestionIndex + 1) /
                questionFlow.questions.length) *
                100
            ),
          }
        : { current: 0, total: 0, percentage: 0 };

    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        {/* Question Display */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10 mt-6 mb-8">
          <QuestionDisplay
            categoryId={selectedCategoryId}
            sessionId={sessionId || undefined}
            onComplete={(sessionId) => {
              setSessionId(sessionId);
              setCurrentStep(QuestionnaireStep.COMPLETION);
            }}
          />
        </div>
      </div>
    );
  }

  // 完了画面
  if (currentStep === QuestionnaireStep.COMPLETION) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              回答完了！
            </h1>
            <p className="text-base md:text-lg text-gray-500 mb-8">
              あなたに最適なガジェットをご提案いたします。
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleCompletion}
                variant="default"
                size="lg"
                className="w-full"
              >
                結果を見る
              </Button>

              <Button
                onClick={handleNewStart}
                variant="outline"
                size="lg"
                className="w-full"
              >
                新しい診断を開始
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default QuestionnairePage;
