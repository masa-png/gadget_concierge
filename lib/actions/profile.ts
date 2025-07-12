"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ProfileFormDataSchema,
  validateCreateProfile,
  validateUpdateProfile,
  type ProfileSelectData,
} from "@/lib/validations/profile";
import { handleServerActionError } from "@/lib/utils/error-handling";
import { checkUsernameExists } from "@/lib/data/profile";
import { CACHE_KEYS } from "@/lib/constants";
import { type ActionResult } from "@/lib/types/api";

/**
 * プロフィール更新のServer Action
 */
export async function updateProfile(
  prevState: ActionResult<ProfileSelectData>,
  formData: FormData
): Promise<ActionResult<ProfileSelectData>> {
  try {
    // 1. 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // 2. FormDataの解析
    const rawData = Object.fromEntries(formData.entries());
    const formDataValidation = ProfileFormDataSchema.safeParse(rawData);

    if (!formDataValidation.success) {
      return {
        success: false,
        error: "フォームデータの形式が正しくありません",
        fieldErrors: formDataValidation.error.flatten().fieldErrors,
      };
    }

    // 3. ビジネスロジック用スキーマでバリデーション
    const profileData = {
      username: formDataValidation.data.username || undefined,
      full_name: formDataValidation.data.full_name || undefined,
      avatar_url: formDataValidation.data.avatar_url || undefined,
    };

    const validation = validateUpdateProfile(profileData);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        fieldErrors: validation.fieldErrors,
      };
    }

    // 4. ユーザー名の重複チェック
    if (validation.data?.username) {
      const usernameExists = await checkUsernameExists(
        validation.data.username,
        user.id
      );

      if (usernameExists) {
        return {
          success: false,
          error: "このユーザー名は既に使用されています",
          fieldErrors: { username: ["このユーザー名は既に使用されています"] },
        };
      }
    }

    // 5. データベース更新
    const profile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        ...validation.data!,
        updated_at: new Date(),
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
    });

    // 6. キャッシュの再検証
    revalidateTag(CACHE_KEYS.PROFILE);
    revalidatePath("/profile");

    return {
      success: true,
      data: profile,
      message: "プロフィールが正常に更新されました",
    };
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    return handleServerActionError(error);
  }
}

/**
 * プロフィール作成のServer Action
 */
export async function createProfile(
  prevState: ActionResult<ProfileSelectData>,
  formData: FormData
): Promise<ActionResult<ProfileSelectData>> {
  try {
    // 1. 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // 2. 既存プロフィールの確認
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      return {
        success: false,
        error: "プロフィールは既に作成されています",
      };
    }

    // 3. FormDataの解析
    const rawData = Object.fromEntries(formData.entries());
    const formDataValidation = ProfileFormDataSchema.safeParse(rawData);

    if (!formDataValidation.success) {
      return {
        success: false,
        error: "フォームデータの形式が正しくありません",
        fieldErrors: formDataValidation.error.flatten().fieldErrors,
      };
    }

    // 4. バリデーション
    const profileData = {
      username:
        formDataValidation.data.username ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        `user_${user.id.slice(0, 8)}`,
      full_name:
        formDataValidation.data.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "名前未設定",
      avatar_url:
        formDataValidation.data.avatar_url || user.user_metadata?.avatar_url,
    };

    const validation = validateCreateProfile(profileData);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        fieldErrors: validation.fieldErrors,
      };
    }

    // 5. ユーザー名の重複チェック
    if (validation.data?.username) {
      const usernameExists = await checkUsernameExists(
        validation.data.username,
        user.id
      );

      if (usernameExists) {
        return {
          success: false,
          error: "このユーザー名は既に使用されています",
          fieldErrors: { username: ["このユーザー名は既に使用されています"] },
        };
      }
    }

    // 6. データベース作成
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        ...validation.data!,
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
    });

    // 7. キャッシュの再検証
    revalidateTag(CACHE_KEYS.PROFILE);
    revalidatePath("/profile");

    return {
      success: true,
      data: profile,
      message: "プロフィールが正常に作成されました",
    };
  } catch (error) {
    console.error("プロフィール作成エラー:", error);
    return handleServerActionError(error);
  }
}

/**
 * 初期プロフィール作成のServer Action（引数なし）
 */
export async function createInitialProfile(): Promise<
  ActionResult<ProfileSelectData>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "認証が必要です",
      };
    }

    // 既存のプロフィールをチェック
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
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

    if (existingProfile) {
      return {
        success: true,
        data: existingProfile,
        message: "プロフィールは既に存在します",
      };
    }

    // 初期プロフィールデータの作成
    const username =
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      `user_${user.id.slice(0, 8)}`;
    const full_name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "名前未設定";

    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        username,
        full_name,
        avatar_url: user.user_metadata?.avatar_url,
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
    });

    revalidateTag(CACHE_KEYS.PROFILE);
    revalidatePath("/profile");

    return {
      success: true,
      data: profile,
      message: "プロフィールが正常に作成されました",
    };
  } catch (error) {
    console.error("初期プロフィール作成エラー:", error);
    return handleServerActionError(error);
  }
}
