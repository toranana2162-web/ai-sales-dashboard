import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { parseSalesCsv } from "@/lib/csv/parse-sales-csv";
import { createAdminClient } from "@/lib/db/supabase-admin";

/**
 * CSVアップロードを受け取り、検証してからデータベースへ登録するAPI。
 * ARCHITECTURE.md 4.2章・5章、REQUIREMENTSv2.md 8章に対応。
 */
export async function POST(request: Request) {
  // 1. ログイン確認
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  // 2. 送られてきたファイルを取り出す
  let file: File;
  try {
    const formData = await request.formData();
    const uploaded = formData.get("file");
    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        { error: "ファイルが選択されていません。" },
        { status: 400 },
      );
    }
    file = uploaded;
  } catch {
    return NextResponse.json(
      { error: "アップロードされたデータを読み取れませんでした。" },
      { status: 400 },
    );
  }

  // 3. ファイル形式チェック(拡張子が.csvであること)
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "CSVファイル(.csv)を選択してください。" },
      { status: 400 },
    );
  }

  // 4. CSVの中身を検証する(UTF-8チェック・パース・型チェック・空データチェック・複数月チェック)
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = parseSalesCsv(buffer);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 5. データベースへ登録する(service_role keyで実行、RLSの影響を受けない)
  const supabase = createAdminClient();
  const { error: rpcError } = await supabase.rpc("replace_monthly_sales", {
    p_target_month: result.targetMonth,
    p_uploaded_by: user.id,
    p_original_filename: file.name,
    p_rows: result.rows,
  });

  if (rpcError) {
    console.error("replace_monthly_sales failed:", rpcError);
    return NextResponse.json(
      {
        error:
          "データベースへの登録に失敗しました。しばらくしてから再度お試しください。",
      },
      { status: 500 },
    );
  }

  // 6. 成功レスポンス
  return NextResponse.json({
    targetMonth: result.targetMonth,
    rowCount: result.rows.length,
  });
}
