import React, { useState } from "react";
import { Zap, Battery, Headphones, Cable } from "lucide-react";
import CategoryList from "./category-list";
import QuestionProgress from "./question-progress";
import QuestionNavigation from "./question-navigation";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface CategorySelectionProps {
  onCategorySelect: (categoryId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

const categories: Category[] = [
  {
    id: "chargers",
    name: "充電器",
    description: "スマホ・PC用の充電器",
    icon: <Zap className="w-6 h-6 text-gray-600" />,
  },
  {
    id: "mobile_battery",
    name: "モバイルバッテリー",
    description: "外出先での充電用",
    icon: <Battery className="w-6 h-6 text-green-600" />,
  },
  {
    id: "headphones",
    name: "ヘッドホン・イヤホン",
    description: "音楽・通話用オーディオ機器",
    icon: <Headphones className="w-6 h-6 text-gray-600" />,
  },
  {
    id: "cables",
    name: "ケーブル・アクセサリー",
    description: "接続用ケーブル類",
    icon: <Cable className="w-6 h-6 text-gray-600" />,
  },
];

const CategorySelection: React.FC<CategorySelectionProps> = ({
  onCategorySelect,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect(categoryId);
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext();
    }
  };

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
