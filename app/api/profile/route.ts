import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // デバッグ用ログ
    console.log("GET /api/profile - User:", user?.id);
    console.log("GET /api/profile - UserError:", userError);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prismaでプロフィールを取得
    const profile = await prisma.userProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // デバッグ用ログ
    console.log("POST /api/profile - User:", user?.id);
    console.log("POST /api/profile - UserError:", userError);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディからプロフィール情報を取得
    const body = await request.json();
    const { username, full_name } = body;

    // Prismaでプロフィールをupsert（作成または更新）
    const profile = await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        username: username || user.user_metadata?.name || user.email,
        full_name: full_name || user.user_metadata?.name || user.email,
      },
      create: {
        userId: user.id,
        username: username || user.user_metadata?.name || user.email,
        full_name: full_name || user.user_metadata?.name || user.email,
      },
    });

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
