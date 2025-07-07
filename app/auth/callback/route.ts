// app/auth/callback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // PKCE認証フロー（新しい方式）のパラメータ
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // OAuth認証フロー（従来の方式）のパラメータ
  const code = searchParams.get("code");

  const next = searchParams.get("next") ?? "/profile";

  if (token_hash && type) {
    // PKCE認証フロー（メール確認など）
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error && data?.user) {
      console.log("Email verification successful for user");
      console.log(
        "Session data:",
        data.session ? "Session exists" : "No session"
      );

      // セッションがあればCookieにセットしてリダイレクト
      const response = NextResponse.redirect(`${origin}${next}`);
      if (data.session) {
        response.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        response.cookies.set("sb-refresh-token", data.session.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      } else {
        console.log("No session data available for user");
      }
      return response;
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
      console.log("OAuth authentication successful for user");
      console.log(
        "Session data:",
        data.session ? "Session exists" : "No session"
      );

      // セッションがあればCookieにセットしてリダイレクト
      const response = NextResponse.redirect(`${origin}${next}`);
      if (data.session) {
        response.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        response.cookies.set("sb-refresh-token", data.session.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      } else {
        console.log("No session data available for user");
      }
      return response;
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
