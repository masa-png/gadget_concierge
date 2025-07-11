"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ProfileInfo } from "./profile-info";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfileStats } from "./profile-stats";
import { Button } from "@/app/_components/ui/button";
import { Edit, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type {
  ProfileSelectData,
  ProfileResponse,
} from "@/lib/validations/profile";

interface ProfileContentProps {
  initialProfile: ProfileSelectData;
}

const fetcher = async (url: string): Promise<ProfileResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }
  return response.json();
};

export function ProfileContent({ initialProfile }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  // useSWRでfallbackデータを使用
  const {
    data,
    error,
    mutate: mutateProfile,
  } = useSWR<ProfileResponse>("/api/profile", fetcher, {
    // サーバーサイドで取得したデータをfallbackとして使用
    fallbackData: {
      success: true,
      data: { profile: initialProfile },
      message: "プロフィールを取得しました",
    },
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  // 現在のプロフィールデータ
  const currentProfile = data?.data?.profile || initialProfile;

  const handleSave = async () => {
    try {
      // SWRキャッシュを更新
      await mutateProfile();

      // グローバルキャッシュも更新（同じエンドポイントを使用している他のコンポーネント向け）
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/profile"),
        undefined,
        { revalidate: true }
      );

      setIsEditing(false);
      toast.success("プロフィールが更新されました");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error("プロフィールの更新に失敗しました");
      // 失敗時はキャッシュを再取得
      await mutateProfile();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

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
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        </div>

        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Edit className="h-4 w-4 mr-2" />
            プロフィールを編集
          </Button>
        )}
      </div>

      {/* 統計情報 */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            アクティビティ統計
          </h2>
          <p className="text-gray-600">あなたの利用状況を確認できます</p>
        </div>
        <ProfileStats
          stats={{
            questionCount: currentProfile.questionCount,
            recommendationCount: currentProfile.recommendationCount,
          }}
        />
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
          <ProfileInfo profile={currentProfile} />
        )}
      </div>
    </>
  );
}
