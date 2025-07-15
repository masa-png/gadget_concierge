// middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // /api/categories だけ除外し、それ以外のAPIと全ページを認証対象に
    "/((?!_next/static|_next/image|favicon.ico|api/categories|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
