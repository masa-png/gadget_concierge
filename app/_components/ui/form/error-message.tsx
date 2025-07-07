"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorMessage({
  message,
  className,
  variant = "destructive",
}: ErrorMessageProps) {
  const variantStyles = {
    default: "bg-gray-50 border-gray-200 text-gray-700",
    destructive: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 border px-4 py-3 rounded-lg text-sm",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}