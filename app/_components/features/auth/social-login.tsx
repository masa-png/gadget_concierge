"use client";

import React from "react";
import { LoadingButton } from "@/app/_components/ui/form";

interface SocialLoginProps {
  isLoading?: boolean;
  onGoogleLogin?: () => void;
}

export function SocialLogin({ isLoading, onGoogleLogin }: SocialLoginProps) {
  const handleGoogleLogin = () => {
    onGoogleLogin?.();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="w-full h-px bg-gray-200" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          または
        </span>
      </div>

      <LoadingButton
        type="button"
        variant="outline"
        size="lg"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full"
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        Googleでログイン
      </LoadingButton>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          fill="#4285F4"
          d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.13 2.13 30.45 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.21C12.36 13.13 17.74 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.36 46.1 24.55z"
        />
        <path
          fill="#FBBC05"
          d="M10.67 28.65A14.5 14.5 0 019.5 24c0-1.62.28-3.19.77-4.65l-7.98-6.21A23.97 23.97 0 000 24c0 3.97.96 7.73 2.69 11.01l7.98-6.21z"
        />
        <path
          fill="#EA4335"
          d="M24 48c6.45 0 12.13-2.13 16.69-5.84l-7.19-5.6c-2.01 1.35-4.57 2.14-7.5 2.14-6.26 0-11.64-3.63-14.33-8.94l-7.98 6.21C6.73 42.52 14.82 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </g>
    </svg>
  );
}