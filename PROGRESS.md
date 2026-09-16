# 実装進捗メモ

最終更新: 2026-09-16

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0（プロジェクト基盤）・Milestone 1（データベース・RPC関数）・Milestone 2（認証）が全て完了。** Milestone 3（CSVアップロード機能）に着手する段階。

---

## 完了したこと

### Milestone 0・1：省略（DEVLOG.md参照）

### Milestone 2: 認証（すべて完了）
- `@supabase/ssr` / `@supabase/supabase-js` を導入
- Supabaseクライアントを3種類作成
  - `lib/db/supabase-browser.ts`（ブラウザ用、Authのみ使用）
  - `lib/db/supabase-server.ts`（サーバー用、ログイン状態確認）
  - `lib/db/supabase-admin.ts`（service_role key、APIルートからのDB操作用）
- ログイン画面 `app/(auth)/login/page.tsx`（メール＋パスワード）
- `proxy.ts`（Next.js 16でのmiddlewareの新名称）で未ログイン時のリダイレクトを実装
  - 自動移行ツール`@next/codemod middleware-to-proxy`で`middleware.ts`から移行
- `lib/auth/require-user.ts`：APIルート用のログイン確認共通処理（実際の適用はMilestone 3以降）
- コードレビューで、ブラウザ側はAuth関連のみ使用していることを確認済み
- Supabase Authに動作確認用アカウントを1つ作成し、`profiles`行も作成済み
- **ローカル環境（`npm run dev`）で実際にログイン→トップページ表示までEnd-to-Endで動作確認済み**

**発生した不具合と対応**：Next.jsのデフォルトテンプレートに残っていたダークモード自動切り替え設定が原因で、ログイン画面の入力文字が見えなくなる問題が発生。原因を特定し、ダークモード切り替え設定を削除して修正済み。

---

## 次にやること：Milestone 3（CSVアップロード機能）

- [ ] アップロードUI（ファイル選択・送信）を実装する
- [ ] `POST /api/uploads`を実装する（ファイル形式・UTF-8チェック、csv-parseでパース、Zodスキーマ検証、対象月自動判定、`replace_monthly_sales`のRPC呼び出し）
- [ ] 検証エラー時のエラーメッセージ表示
- [ ] アップロード成功時の結果表示
- [ ] CSV検証ロジックの単体テスト

このMilestoneから`lib/auth/require-user.ts`を実際に使い始める。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- Next.js 16では「middleware」が「Proxy」に名称変更されている（`proxy.ts`）
- ローカル開発サーバーは`npm run dev`で起動（今回はポート3001で稼働中の場合あり。ポート3000は別プロセスが使用中）
- サンプルCSV（`case8-sales-sample.csv`）がプロジェクト直下にあり、Milestone 3のテストに使える
