"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full font-medium transition-all duration-200";

  const variantClasses = {
    default: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
    secondary:
      "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200",
    destructive:
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm",
    outline: "border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
