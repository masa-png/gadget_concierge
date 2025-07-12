"use client";

import { useProfile } from "@/hooks/use-profile";
import { ProfileInfo } from "./profile-info";
import { ProfileEditForm } from "./profile-edit-form";
import { Button } from "@/app/_components/ui/button";
import { User } from "lucide-react";
import type { ProfileSelectData } from "@/lib/validations/profile";

interface ProfileContentProps {
  initialProfile: ProfileSelectData;
}

export function ProfileContent({ initialProfile }: ProfileContentProps) {
  const {
    currentProfile,
    error,
    isEditing,
    setIsEditing,
    handleSave,
    handleCancel,
    mutateProfile,
  } = useProfile({ initialProfile });

  // console.log("現在のプロフィールデータ:", currentProfile);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || "プロフィールの取得に失敗しました"}
          </p>
          <Button
            onClick={() => mutateProfile()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 戻るボタン */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => window.history.back()}
        >
          ← 戻る
        </Button>
      </div>

      {/* プロフィール情報 */}
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <ProfileEditForm
            profile={currentProfile}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ProfileInfo
            profile={currentProfile}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>

      {/* 最近のアクティビティ */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              最近のアクティビティ
            </h2>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              履歴を全て見る
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">
                  GaN充電器の診断を完了
                </p>
                <p className="text-gray-500 text-sm">2025年5月20日</p>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                診断
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
