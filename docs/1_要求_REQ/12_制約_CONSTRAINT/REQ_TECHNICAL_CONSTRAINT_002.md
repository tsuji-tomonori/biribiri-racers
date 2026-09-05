# REQ_TECHNICAL_CONSTRAINT_002 検証済みPages公開

種別: 技術制約 / 出所: ユーザー明示 / 優先度: 必須 / 状態: 検証済み / 版: 1.0

## 要求
GitHub Actionsは検証が成功したmainの成果物だけをGitHub Pagesへ自動公開する。

## 受け入れ条件
型検査・単体テスト・整形・ビルド・E2Eに成功したrunでPages公開と公開後smokeが成功する。PR runでは公開を実行しない。

## 属性・レビュー
理由: 公開品質と再現可能性。責任: 保守者。依存: Pages Source=GitHub Actions。代替: 今回なし。OPS-001に手順を定義。検証可能性・単一公開条件・権限境界を確認。公開成功前は完了扱いしない。
