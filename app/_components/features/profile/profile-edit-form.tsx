"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { type ActionResult } from "@/lib/types/api";
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
import { Save, X, Edit3 } from "lucide-react";

interface ProfileEditFormProps {
  profile: ProfileSelectData;
  onSave: (updatedProfile?: ProfileSelectData) => void;
  onCancel: () => void;
}

const initialState: ActionResult<ProfileSelectData> = {
  success: false,
};

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(updateProfile, initialState);

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      username: profile.username || "",
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
    },
  });

  // Server Actionの結果をReact Hook Formに反映
  React.useEffect(() => {
    if (state.success && state.data) {
      // 成功時は最新データでフォームをリセット
      form.reset({
        username: state.data.username || "",
        full_name: state.data.full_name || "",
        avatar_url: state.data.avatar_url || "",
      });

      // 最新データをコールバックで渡す
      onSave(state.data);
    } else if (!state.success && state.error) {
      toast.error(state.error);

      // フィールドエラーをReact Hook Formに設定
      if (state.fieldErrors) {
        Object.entries(state.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as keyof UpdateProfileData, {
            message: errors[0],
          });
        });
      }
    }
  }, [state, form, onSave]);

  const handleSubmit = (data: UpdateProfileData) => {
    startTransition(() => {
      const formData = new FormData();

      // undefinedやnullの値をフィルタリング
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      formAction(formData);
    });
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
          <div className="space-y-4">
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

            {/* アバターURLフィールド */}
            <div>
              <label
                htmlFor="avatar_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                アバターURL（任意）
              </label>
              <input
                {...form.register("avatar_url")}
                id="avatar_url"
                type="url"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://example.com/avatar.jpg"
                disabled={isPending}
              />
              {form.formState.errors.avatar_url && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.avatar_url.message}
                </p>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  保存中...
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
              disabled={isPending}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
