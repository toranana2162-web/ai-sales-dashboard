import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * サーバーコンポーネント・APIルートから、ログイン状態(セッション)を
 * 確認するためのSupabaseクライアント。
 *
 * anon keyを使うため、これ自体はRLSの制限を受ける(=売上データ等には
 * アクセスできない)。あくまで「ログインしているかどうかの確認」用。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component から呼ばれた場合はCookieを書き込めないが、
            // middleware側でセッション更新を行うため無視してよい。
          }
        },
      },
    },
  );
}
