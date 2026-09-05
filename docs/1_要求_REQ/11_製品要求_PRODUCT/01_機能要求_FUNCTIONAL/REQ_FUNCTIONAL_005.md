# REQ_FUNCTIONAL_005 停止

種別: 機能要求 / 出所: 今回の公開依頼・継続ゲーム仕様 / 優先度: 必須 / 状態: 実装済み・公開検証中 / 版: 1.0

## 要求
一時停止中、システムは走行状態の時間発展を停止する。

## 受け入れ条件
カウントダウン/走行中に停止でき、待機後も時間が同一で、復帰後に進行を再開する。

## 検証・追跡
検証先: `tests/unit/racing.test.ts / tests/e2e/game.spec.ts`。受入索引: `docs/1_要求_REQ/21_受入基準_ACCEPTANCE/REQ_ACCEPTANCE_001.md`。
依存: REQ_TECHNICAL_CONSTRAINT_001。責任: リポジトリ保守者。レビュー: 観測可能・単一条件・検証可能であり、実装箇所とテストを対応付けた。証跡はreports/workingの当該作業報告に記録する。
