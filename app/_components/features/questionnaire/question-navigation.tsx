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
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isLastQuestion,
  onPrevious,
  onNext,
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
        前の質問
      </Button>

      <Button
        onClick={onNext}
        disabled={!canGoNext}
        variant="default"
        className="flex items-center px-8 py-3"
      >
        {isLastQuestion ? "診断完了" : "次の質問"}
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};

export default QuestionNavigation;
