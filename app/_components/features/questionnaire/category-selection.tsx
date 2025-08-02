"use client";

import React, { useState, useEffect } from "react";
import CategoryList from "./category-list";
import QuestionProgress from "./question-progress";
import QuestionNavigation from "./question-navigation";
import { Button } from "@/app/_components/ui/button";
import {
  categoryApi,
  sessionApi,
  ApiError,
  isAuthError,
} from "@/lib/api-client";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategorySelectionProps {
  onCategorySelect: (categoryId: string) => void;
  onNext: (sessionId: string) => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  onCategorySelect,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // カテゴリデータを取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await categoryApi.list();

        const categoriesData: Category[] = response.categories.map(
          (category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
          })
        );

        setCategories(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);

        // 認証エラーの場合は特別な処理
        if (isAuthError(error)) {
          setError("ログインが必要です。ページを再読み込みしてください。");
        } else {
          setError(
            error instanceof ApiError
              ? error.message
              : "カテゴリの取得に失敗しました"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 認証状態を確認してからカテゴリを取得
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, authLoading]);

  const handleCategorySelect = (categoryId: string) => {
    // console.log("選択されたカテゴリID:", categoryId);
    setSelectedCategory(categoryId);
    onCategorySelect(categoryId);
  };

  const handleNext = async () => {
    if (!selectedCategory) return;

    try {
      setIsCreatingSession(true);
      setError(null);

      // console.log("セッションを作成中...", selectedCategory);
      const response = await sessionApi.create(selectedCategory);
      const sessionId = response.data.session.id;

      // console.log("セッション作成完了:", sessionId);
      onNext(sessionId);
    } catch (error) {
      console.error("セッション作成エラー:", error);

      if (isAuthError(error)) {
        setError("ログインが必要です。ページを再読み込みしてください。");
      } else {
        setError(
          error instanceof ApiError
            ? error.message
            : "セッションの作成に失敗しました"
        );
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

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

  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              ページを再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              読み込み中...
            </h2>
            <p className="text-gray-500">カテゴリを準備しています</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f8fc] flex justify-center">
      <div className="w-full max-w-2xl px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <QuestionProgress
            current={currentStep}
            total={totalSteps}
            percentage={(currentStep / totalSteps) * 100}
          />
        </div>

        {/* Question Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            どのようなガジェットをお探しですか？
          </h1>
          <p className="text-lg text-gray-600">カテゴリを選択してください</p>
        </div>

        {/* Category Options */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Navigation Bar */}
        <div className="mt-8">
          <QuestionNavigation
            canGoPrevious={true}
            canGoNext={!!selectedCategory && !isCreatingSession}
            isLastQuestion={false}
            onPrevious={onPrevious}
            onNext={handleNext}
            isLoading={isCreatingSession}
            loadingText="質問を準備中..."
          />
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;
