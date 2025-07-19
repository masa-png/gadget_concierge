"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CategorySelection from "@/app/_components/features/questionnaire/category-selection";

const QuestionnairePage: React.FC = () => {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleNext = (sessionId: string) => {
    // セッション作成後、質問ページに遷移
    router.push(`/questionnaire/${selectedCategoryId}?sessionId=${sessionId}`);
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
