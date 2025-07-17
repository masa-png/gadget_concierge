"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface ValidationErrorProps {
  message: string;
}

const ValidationError: React.FC<ValidationErrorProps> = ({ message }) => {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700">{message}</span>
      </div>
    </div>
  );
};

export default ValidationError;
