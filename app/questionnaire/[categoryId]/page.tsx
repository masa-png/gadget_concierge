"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QuestionDisplay from "@/app/_components/features/questionnaire/question-display";

interface CategoryPageProps {
  params: {
    categoryId: string;
  };
}

const CategoryPage: React.FC<CategoryPageProps> = ({ params }) => {
  const router = useRouter();
  const { categoryId } = params;

  const handleComplete = (sessionId: string) => {
    console.log("診断完了!", sessionId);
    // 結果画面への遷移
    router.push(`/questionnaire/result?sessionId=${sessionId}`);
  };

  return (
    <>
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        {/* Question Display */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10 mt-6 mb-8">
          <QuestionDisplay
            categoryId={categoryId}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
