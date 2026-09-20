# 実装進捗メモ

最終更新: 2026-09-20

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0〜6（プロジェクト基盤〜AI分析機能）がすべて完了。** 本番環境（Vercel）の設定不備も発見・修正済み。Milestone 7（CI/CD）に着手する段階。

---

## 完了したこと

### Milestone 0〜6：省略（DEVLOG.md参照）

### 本番環境の設定不備を発見・修正
Milestone 6の完了確認中、Vercelの環境変数を確認したところ、9月14日(Milestone 0作業時)に設定した
Supabase関連の変数が`NEXT_PUBLIC_`接頭辞の無い名前(`SUPABASE_URL`等)のまま登録されていたことが判明。
`.env.local`側は正しく直っていたが、Vercel側は直っていなかった。

- Vercelの「Integrations」で自動連携が無いことを確認済み(原因は自動連携ではない)
- `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`を正しい名前・正しいType(Config)で登録し直し
- 誤って削除してしまった`SUPABASE_SERVICE_ROLE_KEY`も、正しいType(Secret)で再登録
- 再デプロイし、本番環境でログインできることを確認済み

**教訓**：ローカル(`.env.local`)の設定を修正した際は、Vercel側も忘れずに同じ内容に更新する必要がある。

---

## 次にやること：Milestone 7（CI/CD）

- [ ] 基本CIパイプライン（`pr-check.yml`）へテスト実行ステップを追加する（現在39件のテストがある）
- [ ] Vercelとの自動デプロイ連携を確認する
- [ ] mainブランチ保護ルールを最終確認する

その後 Milestone 8（セキュリティ・非機能要件の確認）→ Milestone 9（受け入れテスト）で完了。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key・APIキー等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- テストは`npm test`（Vitest、現在39件）で実行。CIへの組み込みはMilestone 7で予定通り実施
- **ローカルの`.env.local`を変更したら、Vercel側の環境変数も同じ内容に更新すること**（今回抜けていたため注意）
- 現在DBに入っている実データ：2025年11月(15件、正式サンプルCSVより)、2025年12月(C999さんのダミー1件)
- `ai_reports`には11月・12月ともに生成済みのレコードがある
