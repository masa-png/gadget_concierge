"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import type {
  ProfileSelectData,
  ProfileResponse,
} from "@/lib/validations/profile";

interface UseProfileOptions {
  initialProfile: ProfileSelectData;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

interface UseProfileReturn {
  // データ関連
  currentProfile: ProfileSelectData;
  error: Error | undefined;
  isLoading: boolean;

  // 編集モード関連
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;

  // アクション関数
  handleSave: (updatedProfile?: ProfileSelectData) => Promise<void>;
  handleCancel: () => void;
  mutateProfile: () => Promise<ProfileResponse | undefined>;
}

const fetcher = async (url: string): Promise<ProfileResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }
  return response.json();
};

export function useProfile({
  initialProfile,
  revalidateOnFocus = false,
  revalidateOnReconnect = true,
  dedupingInterval = 30000,
  errorRetryCount = 3,
  errorRetryInterval = 5000,
}: UseProfileOptions): UseProfileReturn {
  const [isEditing, setIsEditing] = useState(false);

  // useSWRでfallbackデータを使用
  const {
    data,
    error,
    isLoading,
    mutate: mutateProfile,
  } = useSWR<ProfileResponse>("/api/profile", fetcher, {
    // サーバーサイドで取得したデータをfallbackとして使用
    fallbackData: {
      success: true,
      data: { profile: initialProfile },
      message: "プロフィールを取得しました",
    },
    revalidateOnFocus,
    revalidateOnReconnect,
    dedupingInterval,
    errorRetryCount,
    errorRetryInterval,
  });

  // 現在のプロフィールデータ
  const currentProfile = data?.data?.profile || initialProfile;

  const handleSave = async (updatedProfile?: ProfileSelectData) => {
    try {
      if (updatedProfile) {
        // Supabaseのユーザーメタデータも更新
        const supabase = createClient();
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: updatedProfile.full_name,
              avatar_url: updatedProfile.avatar_url,
            },
          });
        } catch (metadataError) {
          console.warn("ユーザーメタデータの更新に失敗:", metadataError);
        }

        // 最新データでキャッシュを直接更新
        const newCacheData = {
          success: true,
          data: { profile: updatedProfile },
          message: "プロフィールが更新されました",
        };

        mutateProfile(newCacheData, false);
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/profile"),
          newCacheData,
          false
        );
      } else {
        // フォールバック: 通常の再取得
        await mutateProfile();
      }

      setIsEditing(false);
      toast.success("プロフィールが更新されました");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error("プロフィールの更新に失敗しました");
      await mutateProfile();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return {
    currentProfile,
    error,
    isLoading,
    isEditing,
    setIsEditing,
    handleSave,
    handleCancel,
    mutateProfile,
  };
}
