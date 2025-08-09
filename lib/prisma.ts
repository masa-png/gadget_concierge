import { PrismaClient } from "@prisma/client"

// PrismaClientのグローバルインスタンスを宣言
declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined
}

// 開発環境では再ロードのたびに新しいPrismaClientが作成されるのを防ぐ
export const prisma =
  global.prismaInstance ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // データベース接続時のタイムゾーンを設定
    datasourceUrl: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'timezone=Asia/Tokyo',
  })

// 開発環境でのみグローバル変数にPrismaClientを保存
if (process.env.NODE_ENV !== "production") global.prismaInstance = prisma
