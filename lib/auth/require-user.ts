import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

/**
 * APIルートの先頭で呼び出す、ログイン確認の共通処理。
 * ARCHITECTURE.md 12章・REQUIREMENTSv2.md 20.3章に対応。
 *
 * 使い方:
 *   const { user, unauthorized } = await requireUser();
 *   if (unauthorized) return unauthorized; // 未ログインならここで401を返して終了
 *   // ここから先は user が必ず存在する
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      unauthorized: NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 },
      ),
    };
  }

  return { user, unauthorized: null };
}
