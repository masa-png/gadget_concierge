"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import {
  UpdateProfileSchema,
  type UpdateProfileData,
  type ProfileSelectData,
} from "@/lib/validations/profile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ImageUpload } from "@/app/_components/ui/image-upload";
import { uploadProfileImage, deleteProfileImage } from "@/lib/utils/storage";
import { Save, X, Edit3 } from "lucide-react";

interface ProfileEditFormProps {
  profile: ProfileSelectData;
  onSave: (updatedProfile: ProfileSelectData) => void;
  onCancel: () => void;
}

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      username: profile.username || "",
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
      avatar_image_key: profile.avatar_image_key || "",
    },
  });

  const handleSubmit = (data: UpdateProfileData) => {
    startTransition(async () => {
      setIsUploading(true);

      try {
        const updatedData = { ...data };

        // 画像がアップロードされている場合の処理
        if (selectedFile) {
          const uploadResult = await uploadProfileImage(selectedFile);
          if (uploadResult.error) {
            toast.error(uploadResult.error);
            setIsUploading(false);
            return;
          }

          // 古い画像を削除
          if (profile.avatar_image_key) {
            await deleteProfileImage(profile.avatar_image_key);
          }

          updatedData.avatar_image_key = uploadResult.key;
        }

        // 1. 楽観的UI更新 - 即座に親コンポーネントに通知
        const optimisticProfile = { ...profile, ...updatedData };
        onSave(optimisticProfile);

        // 2. FormDataを作成
        const formData = new FormData();
        Object.entries(updatedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, String(value));
          }
        });

        // 3. Server Action実行
        const result = await updateProfile({ success: false }, formData);

        if (result.success && result.data) {
          // 4. 成功時: 最新データで更新
          onSave(result.data);
          toast.success("プロフィールが更新されました");
          setSelectedFile(null);
        } else {
          // 5. 失敗時: 元のデータに戻す
          onSave(profile);
          toast.error(result.error || "更新に失敗しました");

          // フィールドエラーを設定
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
              form.setError(field as keyof UpdateProfileData, {
                message: errors[0],
              });
            });
          }
        }
      } catch (error) {
        // 6. エラー時: ロールバック
        onSave(profile);
        toast.error("更新に失敗しました");
        console.error("Profile update error:", error);
      } finally {
        setIsUploading(false);
      }
    });
  };

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    form.setValue("avatar_image_key", "");
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <Edit3 className="h-6 w-6" />
          </div>
          プロフィール編集
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-6">
            {/* プロフィール画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                プロフィール画像
              </label>
              <ImageUpload
                currentImageKey={profile.avatar_image_key}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                isUploading={isUploading}
              />
            </div>
            {/* ユーザー名フィールド */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ユーザー名
              </label>
              <input
                {...form.register("username")}
                id="username"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="ユーザー名を入力"
                disabled={isPending}
              />
              {form.formState.errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* フルネームフィールド */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                フルネーム
              </label>
              <input
                {...form.register("full_name")}
                id="full_name"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="フルネームを入力"
                disabled={isPending}
              />
              {form.formState.errors.full_name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isPending || isUploading}
              variant="default"
              className="flex-1"
            >
              {isPending || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {isUploading ? "アップロード中..." : "保存中..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存する
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isPending || isUploading}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
