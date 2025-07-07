"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/_components/providers/auth-provider";
import { ProfileSkeleton } from "@/app/_components/ui/skeleton";
import { ErrorMessage } from "@/app/_components/ui/form";

interface Profile {
  id: string;
  userId: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プロフィールを取得または作成
  const fetchOrCreateProfile = useCallback(async () => {
    try {
      // まずプロフィールを取得
      const getResponse = await fetch("/api/profile");

      if (getResponse.ok) {
        const getData = await getResponse.json();
        if (getData.data?.profile) {
          setProfile(getData.data.profile);
          // console.log("プロフィール取得成功", getData.data.profile);
          return;
        }
      }

      // プロフィールが存在しない場合は作成
      const generateUsername = (
        name: string | undefined,
        email: string | undefined
      ) => {
        const baseName = name || email?.split("@")[0] || "user";
        return baseName.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "user";
      };

      const postResponse = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: generateUsername(user?.user_metadata?.name, user?.email),
          full_name:
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email ||
            "フルネーム",
        }),
      });

      if (postResponse.ok) {
        const postData = await postResponse.json();
        setProfile(postData.data?.profile);
        // console.log("プロフィール作成成功", postData.data?.profile);
      } else {
        const errorData = await postResponse.json();
        setError(`プロフィール作成エラー: ${errorData.error}`);
      }
    } catch (error) {
      // console.error("プロフィール処理エラー:", error);
      setError("プロフィールの取得・作成中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !user) {
        setError("認証されていません");
        setLoading(false);
        return;
      }

      try {
        // プロフィールを取得・作成
        await fetchOrCreateProfile();
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        setError("プロフィール情報の取得中にエラーが発生しました");
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, isAuthenticated, authLoading, fetchOrCreateProfile]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <ErrorMessage message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            プロフィール
          </h1>

          {profile ? (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  ユーザー情報
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      プロフィールID
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{profile.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      ユーザー名
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      フルネーム
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.full_name}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  作成日時
                </h2>
                <p className="text-sm text-gray-900">
                  {new Date(profile.created_at).toLocaleString("ja-JP")}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">プロフィール情報を読み込み中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
