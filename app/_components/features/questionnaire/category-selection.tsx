"use client";

import React, { useState, useEffect } from "react";
import CategoryList from "./category-list";
import QuestionProgress from "./question-progress";
import QuestionNavigation from "./question-navigation";
import { Button } from "@/app/_components/ui/button";
import { categoryApi, ApiError, isAuthError } from "@/lib/api-client";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategorySelectionProps {
  onCategorySelect: (categoryId: string) => void;
  onNext: () => void;
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
  const [error, setError] = useState<string | null>(null);

  // カテゴリデータを取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await categoryApi.list();
        console.log("取得したカテゴリ:", response.categories);

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
    console.log("選択されたカテゴリID:", categoryId);
    setSelectedCategory(categoryId);
    onCategorySelect(categoryId);
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext();
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
    <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mt-8">
        <QuestionProgress
          current={currentStep}
          total={totalSteps}
          percentage={(currentStep / totalSteps) * 100}
        />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10 mt-6 mb-8">
        {/* Question Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            どのようなガジェットをお探しですか？
          </h1>
          <p className="text-base md:text-lg text-gray-500">
            カテゴリを選択してください
          </p>
        </div>

        {/* Category Options */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      </div>

      {/* Navigation Bar */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow flex items-center px-6 py-4 mb-8">
        <QuestionNavigation
          canGoPrevious={true}
          canGoNext={!!selectedCategory}
          isLastQuestion={false}
          onPrevious={onPrevious}
          onNext={handleNext}
        />
      </div>
    </div>
  );
};

export default CategorySelection;
