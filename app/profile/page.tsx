"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  id: string;
  userId: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // プロフィールがなければ作成
  const createProfileIfNeeded = async () => {
    try {
      // プロフィールが存在しない場合は作成
      const postResponse = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user?.user_metadata?.name || user?.email || "ユーザー名",
          full_name: user?.user_metadata?.name || user?.email || "フルネーム",
        }),
      });

      if (postResponse.ok) {
        const postData = await postResponse.json();
        setProfile(postData.profile);
        console.log("プロフィール作成成功", postData);
      } else {
        const errorData = await postResponse.json();
        setError(`プロフィール作成エラー: ${errorData.error}`);
      }
    } catch (error) {
      console.error("プロフィール作成エラー:", error);
      setError("プロフィールの取得・作成中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        const supabase = createClient();

        // 現在のユーザーを取得 (auth.users)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("認証されていません");
          setLoading(false);
          return;
        }

        setUser(user);

        // プロフィールを取得・作成
        await createProfileIfNeeded();
      } catch (error) {
        console.error("ユーザー確認エラー:", error);
        setError("ユーザー情報の取得中にエラーが発生しました");
        setLoading(false);
      }
    };

    checkUserAndProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">エラー</p>
            <p>{error}</p>
          </div>
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
