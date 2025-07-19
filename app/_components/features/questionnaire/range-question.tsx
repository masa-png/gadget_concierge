"use client";

import React, { useState, useEffect } from "react";

// 型定義のインポート
import { Question, Answer } from "@/lib/types/questionnaire";

interface RangeQuestionProps {
  question: Question;
  answer: Answer | null;
  onAnswerChange: (answer: Answer) => void;
  isRequired: boolean;
}

const RangeQuestion: React.FC<RangeQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  isRequired,
}) => {
  const [value, setValue] = useState(answer?.range_value || 5);

  // 初期値を設定（コンポーネントマウント時に回答がない場合）
  useEffect(() => {
    if (!answer) {
      onAnswerChange({
        questionId: question.id,
        range_value: 5,
      });
    }
  }, [question.id, answer, onAnswerChange]);

  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    onAnswerChange({
      questionId: question.id,
      range_value: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">{value}</div>
        <div className="text-sm text-gray-600">
          1（重要でない） ～ 10（とても重要）
        </div>
      </div>

      <div className="px-4">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => handleValueChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              ((value - 1) / 9) * 100
            }%, #e5e7eb ${((value - 1) / 9) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
};

export default RangeQuestion;
