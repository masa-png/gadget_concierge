"use client";

import React, { useState } from "react";

// 型定義のインポート
import { Question, Answer } from "@/lib/types/questionnaire";

interface TextQuestionProps {
  question: Question;
  answer: Answer | null;
  onAnswerChange: (answer: Answer) => void;
  isRequired: boolean;
}

const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
}) => {
  const [value, setValue] = useState(answer?.text_value || "");

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onAnswerChange({
      questionId: question.id,
      text_value: newValue,
    });
  };

  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="こちらにご回答ください..."
        className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:outline-none transition-colors"
        maxLength={500}
      />
      <div className="text-right text-sm text-gray-500">
        {value.length}/500文字
      </div>
    </div>
  );
};

export default TextQuestion;
