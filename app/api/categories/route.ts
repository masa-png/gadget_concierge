import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // カテゴリ一覧を取得（認証不要の公開API）
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "asc", // 作成日時でソート
      },
    });

    // レスポンス形式を統一
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    }));

    return NextResponse.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("カテゴリ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "カテゴリ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POSTメソッドは管理者用（必要に応じて実装）
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, parentId } = body;

    // バリデーション
    if (!name || !description) {
      return NextResponse.json(
        { error: "カテゴリ名と説明は必須です" },
        { status: 400 }
      );
    }

    // カテゴリ作成
    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId: parentId || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      category,
      message: "カテゴリが正常に作成されました",
    });
  } catch (error) {
    console.error("カテゴリ作成エラー:", error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 }
    );
  }
}
