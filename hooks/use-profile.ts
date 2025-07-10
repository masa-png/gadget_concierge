"use client";

import useSWR from "swr";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";
import type {
  ProfileSelectData,
  ProfileResponse,
} from "@/lib/validations/profile";

const fetcher = async (url: string): Promise<ProfileResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "プロフィールの取得に失敗しました");
  }
  return response.json();
};

/**
 * プロフィールデータフェッチ用のカスタムフック
 * 型安全なプロフィールデータの取得に特化
 */
export function useProfile(fallbackData?: ProfileSelectData) {
  const { isAuthenticated } = useAuth();

  const {
    data,
    error,
    isLoading,
    mutate: mutateProfile,
  } = useSWR<ProfileResponse>(
    isAuthenticated ? "/api/profile" : null,
    fetcher,
    {
      fallbackData: fallbackData
        ? {
            success: true,
            data: { profile: fallbackData },
            message: "プロフィールを取得しました",
          }
        : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    profile: data?.data?.profile,
    isLoading,
    error,
    mutateProfile,
  };
}

/**
 * プロフィールの統計情報のみを取得するフック
 */
export function useProfileStats(fallbackData?: {
  questionCount: number;
  recommendationCount: number;
}) {
  const { isAuthenticated } = useAuth();

  const { data, error, isLoading } = useSWR<ProfileResponse>(
    isAuthenticated ? "/api/profile" : null,
    fetcher,
    {
      fallbackData: fallbackData
        ? {
            success: true,
            data: { profile: fallbackData as any },
            message: "統計情報を取得しました",
          }
        : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 統計情報は1分間キャッシュ
    }
  );

  return {
    stats: data?.data?.profile
      ? {
          questionCount: data.data.profile.questionCount,
          recommendationCount: data.data.profile.recommendationCount,
        }
      : undefined,
    isLoading,
    error,
  };
}
