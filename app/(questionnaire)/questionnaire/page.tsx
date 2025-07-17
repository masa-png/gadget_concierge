"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CategorySelection from "@/app/_components/features/questionnaire/category-selection";

const QuestionnairePage: React.FC = () => {
  const router = useRouter();

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/questionnaire/${categoryId}`);
  };

  const handleNext = () => {
    // カテゴリ選択後の処理は handleCategorySelect で行われるため、
    // ここでは何もしない
  };

  const handlePrevious = () => {
    router.push("/");
  };

  return (
    <CategorySelection
      onCategorySelect={handleCategorySelect}
      onNext={handleNext}
      onPrevious={handlePrevious}
      currentStep={1}
      totalSteps={1}
    />
  );
};

export default QuestionnairePage;
