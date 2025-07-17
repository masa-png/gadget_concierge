"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

// 型定義のインポート
import { Question, Answer } from "@/lib/types/questionnaire";

interface MultipleChoiceQuestionProps {
  question: Question;
  answer: Answer | null;
  onAnswerChange: (answer: Answer) => void;
  isRequired: boolean;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  isRequired,
}) => {
  const selectedIds = answer?.questionOptionIds || [];

  const handleOptionToggle = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId];

    onAnswerChange({
      questionId: question.id,
      questionOptionIds: newSelectedIds,
    });
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.id}
          onClick={() => handleOptionToggle(option.id)}
          className={`
            w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md
            ${
              selectedIds.includes(option.id)
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div
                className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                ${
                  selectedIds.includes(option.id)
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }
              `}
              >
                {selectedIds.includes(option.id) && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {option.label}
              </h4>
              {option.description && (
                <p className="text-sm text-gray-600">{option.description}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MultipleChoiceQuestion;
