"use client";

import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

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
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`
          flex items-center px-6 py-3 rounded-lg font-medium transition-colors
          bg-gray-100
          ${
            canGoPrevious
              ? "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
              : "text-gray-400 cursor-not-allowed"
          }
        `}
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        前の質問
      </button>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`
          flex items-center px-8 py-3 rounded-lg font-medium transition-all duration-200
          shadow-sm
          ${
            canGoNext
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-violet-100 text-violet-400 cursor-not-allowed"
          }
        `}
      >
        {isLastQuestion ? "診断完了" : "次の質問"}
        <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
};

export default QuestionNavigation;
