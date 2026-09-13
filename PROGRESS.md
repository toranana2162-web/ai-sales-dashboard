# 実装進捗メモ

最終更新: 2026-09-12

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.mdを参照してください。

---

## 今の状態（ひとことで）

Milestone 0（プロジェクト基盤）のうち、コード関連の3項目が完了。
GitHubリポジトリへのプッシュも完了し、コードはオンライン上にも保存されている状態。

---

## 完了したこと

### 1. Next.js + TypeScriptプロジェクトの初期化
- `create-next-app`でプロジェクトを作成（App Router / TypeScript / Tailwind CSS / ESLint）
- パッケージマネージャーは npm を使用
- `npm run build` が成功することを確認済み

### 2. Tailwind CSSの基本カラー設定
- `app/globals.css` にネイビー色（`#1a2e5c`）を`--navy`として登録し、`bg-navy` / `text-navy` 等のクラス名で使えるようにした
- トップページ（`app/page.tsx`）はNext.jsのデフォルトテンプレートから、確認用の簡易な仮画面に置き換え済み（本番のダッシュボード画面はMilestone 5で作成予定）

### 3. GitHubリポジトリの作成・プッシュ
- リポジトリ: https://github.com/toranana2162-web/ai-sales-dashboard
- ブランチ名: `main`
- Gitのコミット名義: `toranana2162-web` / `toranana2162@gmail.com`（このリポジトリのみに設定。グローバル設定は変更していない）
- 初回コミット・プッシュ完了

---

## 次にやること

**Milestone 0の残りタスク**

- [ ] 基本CIパイプラインを構築する（`.github/workflows/pr-check.yml`：型チェック・Lint・ビルド確認）
- [ ] mainブランチに保護ルール（CIチェック必須）を設定する
- [ ] Supabaseプロジェクトを作成する（ユーザー操作が必要）
- [ ] Vercelプロジェクトを作成し、GitHubリポジトリと連携する（ユーザー操作が必要）
- [ ] 環境変数を整理する（`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY`）

この後は Milestone 1（データベース・RPC関数）→ Milestone 2（認証）→ ... と、TASKS.mdの順番通りに進める。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する（詳細は会話履歴を参照）
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
