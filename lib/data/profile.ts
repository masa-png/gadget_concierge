import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ProfileSelectSchema,
  type ProfileSelectData,
} from "@/lib/validations/profile";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION } from "@/lib/constants";

/**
 * プロフィール取得（React cache付き）
 * 同一リクエスト内での重複呼び出しを防ぐ
 */
export const getProfile = cache(
  async (userId?: string): Promise<ProfileSelectData | null> => {
    if (!userId) {
      return null;
    }

    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          username: true,
          full_name: true,
          avatar_url: true,
          questionCount: true,
          recommendationCount: true,
          created_at: true,
          updated_at: true,
        },
      });

      return profile ? ProfileSelectSchema.parse(profile) : null;
    } catch (error) {
      console.error("プロフィール取得エラー:", error);
      return null;
    }
  }
);

/**
 * キャッシュされたプロフィール取得
 * Next.js unstable_cache()を使用してより長期間のキャッシュを実現
 */
export const getCachedProfile = unstable_cache(
  async (userId: string): Promise<ProfileSelectData | null> => {
    return getProfile(userId);
  },
  [CACHE_KEYS.PROFILE],
  {
    tags: [CACHE_KEYS.PROFILE],
  }
);

/**
 * 現在認証されているユーザーのプロフィール取得
 */
export async function getCurrentUserProfile(): Promise<ProfileSelectData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return getCachedProfile(user.id);
}

/**
 * プロフィールの存在確認
 */
export const checkProfileExists = cache(
  async (userId: string): Promise<boolean> => {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      return !!profile;
    } catch (error) {
      console.error("プロフィール存在確認エラー:", error);
      return false;
    }
  }
);

/**
 * ユーザー名の重複確認
 */
export const checkUsernameExists = cache(
  async (username: string, excludeUserId?: string): Promise<boolean> => {
    try {
      const whereClause: any = { username };

      if (excludeUserId) {
        whereClause.NOT = { userId: excludeUserId };
      }

      const profile = await prisma.userProfile.findFirst({
        where: whereClause,
        select: { id: true },
      });

      return !!profile;
    } catch (error) {
      console.error("ユーザー名重複確認エラー:", error);
      return false;
    }
  }
);

/**
 * プロフィール統計情報の取得
 */
export const getProfileStats = cache(
  async (
    userId: string
  ): Promise<{
    questionCount: number;
    recommendationCount: number;
  } | null> => {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          questionCount: true,
          recommendationCount: true,
        },
      });

      return profile || null;
    } catch (error) {
      console.error("プロフィール統計取得エラー:", error);
      return null;
    }
  }
);

/**
 * プロフィール検索（管理者用）
 */
export async function searchProfiles(
  query: string,
  limit: number = 10
): Promise<ProfileSelectData[]> {
  try {
    const profiles = await prisma.userProfile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { full_name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        userId: true,
        username: true,
        full_name: true,
        avatar_url: true,
        questionCount: true,
        recommendationCount: true,
        created_at: true,
        updated_at: true,
      },
      take: limit,
      orderBy: {
        created_at: "desc",
      },
    });

    return profiles.map((profile) => ProfileSelectSchema.parse(profile));
  } catch (error) {
    console.error("プロフィール検索エラー:", error);
    return [];
  }
}
