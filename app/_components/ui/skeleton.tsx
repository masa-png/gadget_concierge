"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200",
        className
      )}
      {...props}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      {/* ヘッダースケルトン */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-48 mx-auto" />
      </div>

      {/* 統計カードスケルトン */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
              <div className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* プロフィール情報スケルトン */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg bg-white/20" />
              <Skeleton className="h-6 w-32 bg-white/20" />
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <div className="relative">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0 mb-2" />
                <Skeleton className="h-6 w-32 mx-auto md:mx-0 mb-4" />
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
