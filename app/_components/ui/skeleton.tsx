"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton className="h-8 w-1/4 mb-6" />
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-4 w-18 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
          
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}