"use client";

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { MessageSquare, Sparkles, User } from "lucide-react";
import type { ProfileSelectData } from "@/lib/validations/profile";

interface ProfileInfoProps {
  profile: ProfileSelectData;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const getUserInitial = (name: string | null) => {
    return (name || "U").charAt(0).toUpperCase();
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <User className="h-6 w-6" />
          </div>
          プロフィール情報
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {/* アバターと基本情報 */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold">
                {getUserInitial(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.full_name || "名前未設定"}
            </h2>
            <p className="text-lg text-gray-600 mb-4">@{profile.username || "ユーザー名未設定"}</p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Badge
                variant="default"
                className="flex items-center gap-2 px-4 py-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-semibold">{profile.questionCount}</span>
                <span>質問</span>
              </Badge>
              <Badge
                variant="success"
                className="flex items-center gap-2 px-4 py-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">
                  {profile.recommendationCount}
                </span>
                <span>推奨</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">質問統計</h3>
            </div>
            <p className="text-3xl font-bold text-blue-700 mb-1">
              {profile.questionCount}
            </p>
            <p className="text-blue-600 text-sm">これまでにした質問の総数</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900">
                推奨統計
              </h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 mb-1">
              {profile.recommendationCount}
            </p>
            <p className="text-purple-600 text-sm">受け取った推奨の総数</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
