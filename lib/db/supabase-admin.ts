import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * service_role key を使う、管理者権限のSupabaseクライアント。
 *
 * RLS(行レベルセキュリティ)をすべて無視してアクセスできる強い権限を持つ。
 * 必ずAPIルート(サーバー側)からのみ呼び出すこと。
 * ブラウザ側のコードに絶対に含めてはいけない。
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
