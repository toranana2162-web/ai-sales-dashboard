# 実装進捗メモ

最終更新: 2026-09-21

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0〜7（プロジェクト基盤〜CI/CD）がすべて完了。** ここからは**すべての変更をブランチ＋PR経由で行う**運用に切り替わった。Milestone 8（セキュリティ・非機能要件の確認）に着手する段階。

---

## 【重要】これ以降の運用ルール

`main`ブランチの保護ルールが正しく機能するようになったため、**直接`main`へpushすることはできない**。
今後の変更はすべて以下の手順で行う。

```
git checkout -b <ブランチ名>
（変更してコミット）
git push -u origin <ブランチ名>
gh pr create --base main --head <ブランチ名> --title "..." --body "Claude-Session: https://claude.ai/code/session_014jwXqgpJRts5Fq6vYW1yzd"
gh pr checks <PR番号> --watch
gh pr merge <PR番号> --merge --delete-branch
```

`gh` CLIは導入済み・認証済み（`toranana2162-web`としてログイン済み）。

---

## 完了したこと

### Milestone 0〜6：省略（DEVLOG.md参照）

### Milestone 7: CI/CD（すべて完了、大きな発見あり）
- `pr-check.yml`にテスト実行ステップを追加、Node.jsバージョンを実際の環境に合わせ24に更新
- 初めて実際にPRを作成し、CI・Vercelプレビューデプロイ・マージまでの一連の流れを検証
  - CI失敗を実際に検出：`app/layout.tsx`の`LayoutProps<"/">`型がNext.jsのビルド生成物に依存しており、ビルド前の型チェックでは存在しないためCIで失敗 → プレーンな型定義に修正
- **ブランチ保護ルールの重大な不備を発見・修正**：
  1. Milestone 0で「設定した」つもりだったブランチ保護ルールが、実は一度も保存されていなかった（未設定の状態だった）
  2. classic branch protection・Rulesetsのどちらも、**プライベートリポジトリ＋無料プランでは実際には有効化されない**という制約を発見
  3. ユーザーの判断で、リポジトリをPublic（公開）に変更してこの制約を回避
  4. 公開後も、リポジトリ所有者はデフォルトでルールを迂回できることが判明 → 「Do not allow bypassing the above settings」を有効化
  5. 「Require approvals」が誤って有効(1件必須)になっており、レビュアー不在のため永久にマージ不可能な状態になっていた → 無効化
  6. 実際に直接pushを試みて「protected branch hook declined」で拒否されることを確認し、正しく機能することを実証
- Vercelとの自動デプロイ連携（mainマージ後の自動本番反映）を実際のPRマージで確認
- **GitHub CLI(`gh`)を導入**（Homebrewも新規インストール）。今後はPRの作成・チェック確認・マージをコマンドで実行する

---

## 次にやること：Milestone 8（セキュリティ・非機能要件の確認）

- [ ] APIキー・service role keyがソースコードに含まれていないことを確認する
- [ ] 本番環境（Vercel）がHTTPSで提供されていることを確認する
- [ ] `customer_id`以外の直接的個人情報を保存していないことを確認する
- [ ] 想定データ量（月間最大1万行）のCSVで、アップロードから集計・表示までが10秒以内に完了することを確認する
- [ ] Supabase Free tierの自動一時停止の挙動を確認する

その後 Milestone 9（受け入れテスト、22項目）で完了。

---

## 注意点・思い出しておくこと

- **すべての変更はブランチ＋PR経由。直接`main`へのpushは拒否される（上記の運用ルール参照）**
- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める(ただし`gh` CLI導入後は、PR作成・マージ自体はAIがコマンドで実行してよい)
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key・APIキー等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- **リポジトリはPublicに変更済み**（無料プランでブランチ保護を有効にするため。売上データ自体はSupabase側にあり、リポジトリには含まれていない）
- テストは`npm test`（Vitest）で実行し、CIにも組み込み済み
- 現在DBに入っている実データ：2025年11月(15件、正式サンプルCSVより)、2025年12月(C999さんのダミー1件)
