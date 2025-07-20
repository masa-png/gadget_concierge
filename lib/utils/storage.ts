import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = "avatar-image";

export async function uploadProfileImage(
  file: File
): Promise<{ key: string; error?: string }> {
  try {
    const supabase = createClient();

    // ファイル拡張子を取得
    const fileExtension = file.name.split(".").pop() || "jpg";

    // ユニークなファイル名を生成（private/プレフィックス付き）
    const uniqueId = uuidv4();
    const fileName = `private/${uniqueId}.${fileExtension}`;

    // ファイルをアップロード
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { key: "", error: "アップロードに失敗しました" };
    }

    return { key: data.path };
  } catch (error) {
    console.error("Storage error:", error);
    return { key: "", error: "ストレージエラーが発生しました" };
  }
}

export function getProfileImageUrl(imageKey: string | null): string | null {
  if (!imageKey) return null;

  try {
    const supabase = createClient();
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imageKey);

    return data.publicUrl;
  } catch (error) {
    console.error("Error getting public URL:", error);
    return null;
  }
}

export async function deleteProfileImage(
  imageKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imageKey]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: "削除に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Storage delete error:", error);
    return { success: false, error: "ストレージエラーが発生しました" };
  }
}
