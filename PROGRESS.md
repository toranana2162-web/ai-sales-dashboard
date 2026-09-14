# 実装進捗メモ

最終更新: 2026-09-15

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0（プロジェクト基盤）・Milestone 1（データベース・RPC関数）が全て完了。** Milestone 2（認証）に着手する段階。

---

## 完了したこと

### Milestone 0: プロジェクト基盤（すべて完了）
- Next.js + TypeScript + Tailwind CSSのプロジェクトを作成（npm使用）
- ネイビー色（`#1a2e5c`）をTailwindの`navy`として登録済み
- GitHubリポジトリ作成・プッシュ済み：https://github.com/toranana2162-web/ai-sales-dashboard
- GitHub Actionsで基本CI（`.github/workflows/pr-check.yml`）を構築済み
- mainブランチの保護ルール（PR必須）を設定済み
- Supabaseプロジェクトを作成済み
- Vercelプロジェクトを作成し、GitHubと連携・初回デプロイ済み（**現在はHobby(無料)プランで運用**）
- 環境変数を整理済み（`.env.local`とVercel両方。`ANTHROPIC_API_KEY`のみMilestone 6で追加予定）

### Milestone 1: データベース・RPC関数（すべて完了）
`supabase/migrations/`に以下のSQLファイルを作成し、Supabase上で実行・動作確認済み。

1. `0001_create_tables.sql`：4つのテーブル（`profiles` / `monthly_uploads` / `sales_transactions` / `ai_reports`）＋インデックス＋**RLS（行レベルセキュリティ）を有効化**（anon/authenticatedキーからの直接アクセスを遮断）
2. `0002_replace_monthly_sales.sql`：CSVアップロード時の登録・置換処理（1トランザクション）
3. `0003_get_monthly_summary.sql`：単月の売上・粗利・リピート判定用の顧客数・数量
4. `0004_get_category_breakdown.sql`：カテゴリ別売上
5. `0005_get_sku_ranking.sql`：SKU別売上TOP N
6. `0006_get_monthly_trend.sql`：複数月の売上・粗利・リピート率の推移

**動作確認済みの内容**：
- 新規の月を初めて登録してもエラーにならない（以前のレビューで見つけたFK制約バグの修正確認）
- 同じ月への再アップロードで、古いデータが正しく削除・置換される
- リピート顧客の判定ロジック（月をまたいだ購入履歴のEXISTS判定）が正しく動作
- リピート率が「算出不可（NULL）」になるケース（それより前のデータが無い場合）を正しく判定
- カテゴリ別・SKU別集計が正しく動作
- 複数月の推移（`get_monthly_trend`）が正しく動作

**テスト用のダミーデータ**（削除せずそのまま残している）：
- 2025年11月：C999さん（帽子、SKU999、10000円）
- 2025年12月：C999さん（帽子、SKU999、2000円）※リピート確認用

**セキュリティ上の重要な決定**：全RPC関数は`revoke ... from public` + `grant ... to service_role`により、サーバー側（service_role key）からのみ呼び出せるように制限済み。

---

## 次にやること：Milestone 2（認証）

- [ ] Supabase Authを有効化し、Next.js（App Router）用のSupabase SSRクライアントを実装する
- [ ] ログイン画面（メール＋パスワード）を実装する
- [ ] middlewareで未認証アクセスをログイン画面へリダイレクトする
- [ ] 全APIルートでセッション検証を行う共通処理を実装する
- [ ] ブラウザから直接呼び出すSupabase処理をAuth関連のみに限定することをコードレビューで確認する
- [ ] 利用者7名分のアカウントをSupabaseダッシュボードで作成し、`profiles`行を作成する

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- SupabaseのSQL実行は、SQL Editorへのコピー＆ペーストで行っている（Supabase CLIは未導入）
- Supabaseダッシュボードが一時的にクラッシュすることがあったが、データベース自体には影響なし（画面側の不具合）
