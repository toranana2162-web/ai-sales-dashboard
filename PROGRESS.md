# 実装進捗メモ

最終更新: 2026-09-14

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0（プロジェクト基盤）が全て完了。** Milestone 1（データベース・RPC関数）に着手する段階。

---

## 完了したこと

### Milestone 0: プロジェクト基盤（すべて完了）
- Next.js + TypeScript + Tailwind CSSのプロジェクトを作成（npm使用）
- ネイビー色（`#1a2e5c`）をTailwindの`navy`として登録済み
- GitHubリポジトリ作成・プッシュ済み：https://github.com/toranana2162-web/ai-sales-dashboard
- GitHub Actionsで基本CI（`.github/workflows/pr-check.yml`：型チェック・Lint・ビルド確認）を構築済み
- mainブランチの保護ルール（PR必須）を設定済み
- Supabaseプロジェクトを作成済み
- Vercelプロジェクトを作成し、GitHubと連携・初回デプロイ済み（**現在はHobby(無料)プランで運用。商用公開時にProへ切替予定 ※ARCHITECTURE.md 3.2章に追記済み**）
- 環境変数を整理済み：
  - `.env.local`（ローカル、Git対象外）と Vercelの両方に設定済み
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` は設定済み
  - `ANTHROPIC_API_KEY` は未取得（Milestone 6で取得・追加予定）
  - `.env.example`（見本ファイル、Git対象）も作成済み

---

## 次にやること：Milestone 1（データベース・RPC関数）

ARCH 4章・6章の設計をそのままマイグレーションとして実装する。

- [ ] `supabase/migrations/`にテーブル定義を作成：`profiles` / `monthly_uploads`（`status`列含む）/ `sales_transactions` / `ai_reports`
- [ ] `sales_transactions`に外部キー制約とインデックス（`target_month`, `customer_id`, `order_date`）を設定
- [ ] RPC関数`replace_monthly_sales`を実装（ARCH 4.2章）
- [ ] RPC関数`get_monthly_summary`を実装（ARCH 6.1章）
- [ ] RPC関数`get_category_breakdown`を実装（ARCH 6.3章）
- [ ] RPC関数`get_sku_ranking`を実装（ARCH 6.4章）
- [ ] RPC関数`get_monthly_trend`を実装（ARCH 6.5章）
- [ ] ローカル/テスト環境でマイグレーションを流し、`replace_monthly_sales`の動作を手動確認

このMilestoneはSupabaseの管理画面（SQL Editor）を使う想定。詳細は着手時に説明する。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- Supabaseのキー名称が新しくなっている：Publishable key(旧anon key) / Secret key(旧service_role key)
- Next.jsではブラウザ側でも使う環境変数に`NEXT_PUBLIC_`を付ける必要がある（Supabaseの2つの値がこれに該当）
