"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

// 型定義のインポート
import { QuestionType, Answer } from "@/lib/types/questionnaire";

// カスタムフックのインポート
import useQuestionFlow from "@/hooks/use-question-flow";

// コンポーネントのインポート
import SingleChoiceQuestion from "./single-choice-question";
import MultipleChoiceQuestion from "./multiple-choice-question";
import RangeQuestion from "./range-question";
import TextQuestion from "./text-question";
import QuestionProgress from "./question-progress";
import QuestionNavigation from "./question-navigation";
import ValidationError from "./validation-error";
import { Button } from "@/app/_components/ui/button";

// メインコンポーネント
interface QuestionDisplayProps {
  categoryId: string;
  sessionId?: string;
  onComplete: (sessionId: string) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  categoryId,
  sessionId,
  onComplete,
}) => {
  const questionFlow = useQuestionFlow();
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 初回のみ初期化
  useEffect(() => {
    if (!initialized) {
      questionFlow.initializeFlow(categoryId, sessionId);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, sessionId, initialized]);

  // 現在の質問が変わったときに回答を更新
  useEffect(() => {
    const question = questionFlow.getCurrentQuestion();
    if (question) {
      // 安全なアクセスのため、answersが存在することを確認
      const existingAnswer =
        questionFlow.answers && questionFlow.answers.get
          ? questionFlow.answers.get(question.id)
          : null;
      setCurrentAnswer(existingAnswer || null);
      setShowValidationError(false);
    }
  }, [
    questionFlow.currentQuestionIndex,
    questionFlow.questions,
    questionFlow.answers,
  ]);

  const progress = questionFlow.getProgress();
  const currentQuestion = questionFlow.getCurrentQuestion();

  // 回答変更ハンドラ
  const handleAnswerChange = (answer: Answer) => {
    setCurrentAnswer(answer);
    questionFlow.saveAnswer(answer);
    setShowValidationError(false);
  };

  // 次へボタンのハンドラ
  const handleNext = () => {
    if (!questionFlow.validateCurrentQuestion()) {
      setShowValidationError(true);
      return;
    }

    // 安全なアクセスのため、questionsが存在し、lengthプロパティがあることを確認
    const questionsLength =
      questionFlow.questions && Array.isArray(questionFlow.questions)
        ? questionFlow.questions.length
        : 0;

    if (questionFlow.currentQuestionIndex >= questionsLength - 1) {
      // 最後の質問の場合、完了処理
      questionFlow.completeFlow().then(() => {
        if (questionFlow.sessionId) {
          onComplete(questionFlow.sessionId);
        }
      });
    } else {
      questionFlow.goToNext();
    }
  };

  // 質問タイプに応じたコンポーネントをレンダリング
  const renderQuestionComponent = () => {
    if (!currentQuestion) return null;

    const props = {
      question: currentQuestion,
      answer: currentAnswer,
      onAnswerChange: handleAnswerChange,
      isRequired: currentQuestion.is_required,
    };

    switch (currentQuestion.type) {
      case QuestionType.SINGLE_CHOICE:
        return <SingleChoiceQuestion {...props} />;
      case QuestionType.MULTIPLE_CHOICE:
        return <MultipleChoiceQuestion {...props} />;
      case QuestionType.RANGE:
        return <RangeQuestion {...props} />;
      case QuestionType.TEXT:
        return <TextQuestion {...props} />;
      default:
        return <div>サポートされていない質問タイプです</div>;
    }
  };

  if (questionFlow.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">質問を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (questionFlow.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{questionFlow.error}</p>
          <Button
            onClick={() => {
              questionFlow.initializeFlow(categoryId, sessionId);
              setInitialized(true);
            }}
            variant="default"
          >
            再試行
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">質問が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <QuestionProgress
        current={progress.current}
        total={progress.total}
        percentage={progress.percentage}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-4xl w-full">
          {/* Question Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {currentQuestion.text}
              {currentQuestion.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h1>
            {currentQuestion.description && (
              <p className="text-lg text-gray-600">
                {currentQuestion.description}
              </p>
            )}
          </div>

          {/* Question Component */}
          <div className="mb-8">{renderQuestionComponent()}</div>

          {/* Validation Error */}
          {showValidationError && (
            <ValidationError message="この質問への回答は必須です。選択してから次に進んでください。" />
          )}

          {/* Navigation */}
          <QuestionNavigation
            canGoPrevious={questionFlow.canGoPrevious}
            canGoNext={questionFlow.canGoNext}
            isLastQuestion={progress.current >= progress.total}
            onPrevious={questionFlow.goToPrevious}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
