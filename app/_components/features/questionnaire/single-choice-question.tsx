"use client";

import React from "react";

// 型定義のインポート
import { Question, Answer } from "@/lib/types/questionnaire";

interface SingleChoiceQuestionProps {
  question: Question;
  answer: Answer | null;
  onAnswerChange: (answer: Answer) => void;
  isRequired: boolean;
}

const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
}) => {
  const handleOptionSelect = (optionId: string) => {
    onAnswerChange({
      questionId: question.id,
      questionOptionId: optionId,
    });
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.id}
          onClick={() => handleOptionSelect(option.id)}
          className={`
            w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md
            ${
              answer?.questionOptionId === option.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div
                className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${
                  answer?.questionOptionId === option.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }
              `}
              >
                {answer?.questionOptionId === option.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
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

export default SingleChoiceQuestion;
