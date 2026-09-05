# REQ_ACCEPTANCE_001 受入検証索引

種別: 受入基準索引 / 状態: 検証済み / 版: 1.0

各機能要求001〜008の受け入れ条件はそれぞれのファイルに定義する。このファイルは追加の複合要求ではなく証跡の索引。

- 操作・衝突・経路・勝敗: tests/unit/racing.test.ts
- DOM入力からの開始・充填・復帰・CPU結果・プレイヤー完走・再試行・画像失敗: tests/e2e/game.spec.ts
- 表示幅375/768/1440: Playwrightの3projectと画面画像
- 公開後の配信SHAと実操作: scripts/verify-deployed.mjs / @smoke
- 実施状態・CI run・画面確認: reports/working/20260905-1500-astro-rebuild.md

自動テストは実行結果で判定し、実機パッド、スクリーンリーダー、感触の主観評価を代替しない。
