"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QuestionDisplay from "@/app/_components/features/questionnaire/question-display";

const CategoryQuestionnairePage: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.categoryId as string;
  const sessionId = searchParams.get('sessionId') || undefined;
  const router = useRouter();

  const handleComplete = (sessionId: string) => {
    console.log("診断完了!", sessionId);
    // 結果画面への遷移
    router.push(`/recommendations/result?sessionId=${sessionId}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f8fc] flex justify-center">
      <div className="w-full max-w-2xl px-6 py-8">
        <QuestionDisplay categoryId={categoryId} sessionId={sessionId} onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default CategoryQuestionnairePage;
