"use client";

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { MessageSquare, Sparkles, Settings, Calendar } from "lucide-react";
import type { ProfileSelectData } from "@/lib/validations/profile";
import { formatToJapanDate } from "@/lib/utils/date";

interface ProfileInfoProps {
  profile: ProfileSelectData;
  onEdit?: () => void;
}

export function ProfileInfo({ profile, onEdit }: ProfileInfoProps) {
  const getUserInitial = (name: string | null) => {
    return (name || "U").charAt(0).toUpperCase();
  };

  const formatDate = (date: Date) => {
    return formatToJapanDate(date) + "から利用開始";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：プロフィール情報 */}
        <div className="lg:col-span-1 text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="h-32 w-32 ring-4 ring-gray-200 shadow-lg">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.full_name || undefined}
              />
              <AvatarFallback className="bg-gray-300 text-gray-700 text-4xl font-bold">
                {getUserInitial(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile.full_name || "ユーザー名未設定"}
          </h1>

          <p className="text-gray-600 mb-4">{`@${profile.username}`}</p>

          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(profile.created_at)}</span>
          </div>

          <Button onClick={onEdit} variant="default">
            <Settings className="h-4 w-4 mr-2" />
            プロフィール編集
          </Button>
        </div>

        {/* 右側：統計情報 */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 mx-auto">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700 mb-1">
                {profile.questionCount}
              </p>
              <p className="text-blue-600 font-medium">診断回数</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl mb-4 mx-auto">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-700 mb-1">
                {profile.recommendationCount}
              </p>
              <p className="text-purple-600 font-medium">推薦製品数</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
