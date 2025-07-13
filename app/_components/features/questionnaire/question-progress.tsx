"use client";

import React from "react";

interface QuestionProgressProps {
  current: number;
  total: number;
  percentage: number;
}

const QuestionProgress: React.FC<QuestionProgressProps> = ({
  current,
  total,
  percentage,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          質問 {current} / {total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 relative">
        <div
          className="absolute top-0 left-0 h-2 rounded-full bg-black transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuestionProgress;
