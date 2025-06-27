// app/auth/callback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cuid } from "zod/v4";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // PKCE認証フロー（新しい方式）のパラメータ
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // OAuth認証フロー（従来の方式）のパラメータ
  const code = searchParams.get("code");

  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    // PKCE認証フロー（メール確認など）
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error && data?.user) {
      console.log("Email verification successful for user:", data.user.id);

      // メール確認成功後にプロフィールを作成
      try {
        // 既存のプロフィールをチェック
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("userId")
          .eq("userId", data.user.id) // UUIDをそのまま使用
          .single();

        if (!existingProfile) {
          // プロフィールが存在しない場合は作成
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              id: cuid(),
              userId: data.user.id, // UUIDをそのまま使用
              username: data.user.user_metadata?.name || data.user.email,
              full_name: data.user.user_metadata?.name || data.user.email,
            });

          if (profileError) {
            console.error(
              "Profile creation error after email verification:",
              profileError
            );
          } else {
            console.log(
              "Profile created successfully after email verification"
            );
          }
        } else {
          console.log("Profile already exists for user:", data.user.id);
        }
      } catch (profileErr) {
        console.error("Unexpected error during profile creation:", profileErr);
      }

      // 成功時は指定されたページまたはホームにリダイレクト
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error (PKCE):", error);
      // エラー時は確認ページにエラーパラメータ付きでリダイレクト
      return NextResponse.redirect(
        `${origin}/auth/confirm?error=${encodeURIComponent(
          error?.message || "verification_failed"
        )}`
      );
    }
  } else if (code) {
    // OAuth認証フロー（Google認証など）
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // OAuth成功後にもプロフィールを作成
      try {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("userId")
          .eq("userId", data.user.id) // UUIDをそのまま使用
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              userId: data.user.id, // UUIDをそのまま使用
              username: data.user.user_metadata?.name || data.user.email,
              full_name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email,
            });

          if (profileError) {
            console.error("Profile creation error after OAuth:", profileError);
          } else {
            console.log("Profile created successfully after OAuth");
          }
        }
      } catch (profileErr) {
        console.error(
          "Unexpected error during OAuth profile creation:",
          profileErr
        );
      }

      // 成功時は指定されたページまたはホームにリダイレクト
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error (OAuth):", error);
      // エラー時は確認ページにエラーパラメータ付きでリダイレクト
      return NextResponse.redirect(
        `${origin}/auth/confirm?error=${encodeURIComponent(
          error?.message || "oauth_failed"
        )}`
      );
    }
  }

  // パラメータがない場合は確認ページにリダイレクト
  console.error("Auth callback: No valid parameters found");
  return NextResponse.redirect(`${origin}/auth/confirm?error=invalid_request`);
}
