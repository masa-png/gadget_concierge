"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getProfileImageUrl } from "@/lib/utils/storage";
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
  handleSave: (updatedProfile: ProfileSelectData) => Promise<void>;
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
  const [optimisticProfile, setOptimisticProfile] = useState(initialProfile);

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

  // 現在のプロフィールデータ（楽観的更新を優先）
  const currentProfile =
    optimisticProfile || data?.data?.profile || initialProfile;

  const handleSave = useCallback(
    async (updatedProfile: ProfileSelectData) => {
      try {
        // 1. 楽観的更新
        setOptimisticProfile(updatedProfile);

        // 2. SWRキャッシュを即座に更新
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

        // 3. 編集モードを終了
        setIsEditing(false);

        // 4. Supabaseのユーザーメタデータも更新
        const supabase = createClient();
        try {
          const avatarUrl = updatedProfile.avatar_image_key
            ? getProfileImageUrl(updatedProfile.avatar_image_key)
            : updatedProfile.avatar_url;

          await supabase.auth.updateUser({
            data: {
              full_name: updatedProfile.full_name,
              avatar_url: avatarUrl,
            },
          });
        } catch (metadataError) {
          console.warn("ユーザーメタデータの更新に失敗:", metadataError);
        }
      } catch (error) {
        console.error("プロフィール更新エラー:", error);
        // エラー時は楽観的更新をロールバック
        setOptimisticProfile(data?.data?.profile || initialProfile);
        toast.error("プロフィールの更新に失敗しました");
        // 最新データで再検証
        await mutateProfile();
      }
    },
    [mutateProfile, data?.data?.profile, initialProfile]
  );

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
