"use client";

import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface QuestionNavigationProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  loadingText?: string;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isLastQuestion,
  onPrevious,
  onNext,
  isLoading = false,
  loadingText = "処理中...",
}) => {
  return (
    <div className="w-full flex justify-between items-center gap-4">
      <Button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        variant={canGoPrevious ? "outline" : "ghost"}
        className="flex items-center px-6 py-3"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        前に戻る
      </Button>

      <Button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        variant="default"
        className="flex items-center px-8 py-3"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {loadingText}
          </>
        ) : (
          <>
            {isLastQuestion ? "診断完了" : "次の質問"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default QuestionNavigation;
