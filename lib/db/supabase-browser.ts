import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ(利用者の画面)側で使うSupabaseクライアント。
 *
 * ARCHITECTURE.md 8章の方針により、これはログイン関連(Supabase Auth)の
 * 処理にのみ使用する。売上データ等のテーブル・RPCへのアクセスには
 * 絶対に使わないこと(必ずNext.jsのAPIルート経由で行う)。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
