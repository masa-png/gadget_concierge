import { Suspense } from "react";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { ProfileContent } from "@/app/_components/features/profile/profile-content";
import { ProfileSkeleton } from "@/app/_components/ui/skeleton";
import { createInitialProfile } from "@/lib/actions/profile";
import { Button } from "@/app/_components/ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

async function handleCreateProfile() {
  "use server";
  const result = await createInitialProfile();
  if (result.success) {
    redirect("/profile");
  }
}

export default async function ProfilePage() {
  // サーバーサイドでプロフィールを取得
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              プロフィールを作成しましょう
            </h2>
            <p className="text-gray-600 mb-6">
              サービスを利用するためにプロフィールを作成してください
            </p>
            <form action={handleCreateProfile}>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                プロフィールを作成
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent initialProfile={profile} />
        </Suspense>
      </div>
    </div>
  );
}

// ページのメタデータ
export const metadata = {
  title: "プロフィール | Gadget Concierge",
  description: "あなたのプロフィール情報を管理",
};