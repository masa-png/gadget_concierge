"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/_components/ui/avatar";
import {
  Menu,
  Sparkles,
  MessageSquare,
  Settings,
  LogOut,
  User,
  BarChart3,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";
import React, { useEffect } from "react";

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/questionnaire", label: "診断開始", icon: MessageSquare },
  { href: "/categories", label: "カテゴリ", icon: BarChart3 },
  { href: "/contact", label: "お問い合わせ", icon: Phone },
];

export const Header = React.memo(function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut, refreshAuth } = useAuth();

  // 認証状態の変更を監視
  useEffect(() => {
    // ページロード時に認証状態を確認
    refreshAuth();
  }, [refreshAuth]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      await refreshAuth(); // 認証状態を更新
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("予期しないエラー:", error);
    }
  };

  // ユーザー情報を取得（表示用）
  const getUserDisplayName = React.useMemo(() => {
    if (!user) return "";
    return (
      user.user_metadata?.full_name || user.email?.split("@")[0] || "ユーザー"
    );
  }, [user]);

  const getUserInitial = React.useMemo(() => {
    return getUserDisplayName.charAt(0).toUpperCase();
  }, [getUserDisplayName]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-center space-x-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ガジェットコンシェルジュ
          </span>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex items-center space-x-12">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive(item.href) ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ユーザーメニュー・ログインボタン */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url || "/placeholder.svg"
                      }
                      alt={getUserDisplayName}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {getUserInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{getUserDisplayName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    ダッシュボード
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  ログイン
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                  新規登録
                </button>
              </Link>
            </div>
          )}

          {/* モバイルメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu className="h-5 w-5 text-gray-600" />
                <span className="sr-only">メニューを開く</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              {/* ナビゲーション */}
              {navigationItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer">
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}

              {/* モバイル用認証メニュー */}
              {!isAuthenticated && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="cursor-pointer">
                      ログイン
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup" className="cursor-pointer">
                      新規登録
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* モバイル用ログアウト */}
              {isAuthenticated && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
                    </button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});
