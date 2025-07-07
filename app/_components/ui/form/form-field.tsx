"use client";

import React from "react";
import { Input } from "@/app/_components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  register?: any;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  required,
  disabled,
  className,
  register,
  value,
  onChange,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        )}
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={cn(
            Icon && "pl-10",
            error && "border-red-500",
            "transition-colors focus:border-blue-500"
          )}
          {...(register && register(name))}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}