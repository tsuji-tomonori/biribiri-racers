# チップ構成レースコース実装

状態: done

## 背景

`app/web` の UI は asset pack v2 の course-card / course-parts / themes を表示に使っているが、ゲーム中 canvas の走行路と当たり判定は単一のローカルトラックに依存している。選択コースごとに、参照画像に近いポップなチップ構成のレースコースを canvas へ反映する。

## 目的

待機プレビュー、ゲーム中 canvas、ミニマップ、当たり判定、スタート復帰位置を同じコース仕様から導出し、`Course.themeAssets.floor` と `Course.partAssets` をレース canvas でも利用する。

## タスク種別

機能追加

## スコープ

- 対象: `app/web/src/game/chips/`, `app/web/src/game/drawing.ts`, `app/web/src/hooks/useRaceController.ts`, `app/web/README.md`
- 非対象: React 画面構成の大幅変更、オンライン機能、新規 npm パッケージ追加、リザルトやルーム作成フローの再設計

## 実装計画

1. 既存の `track.ts` / `drawing.ts` / `useRaceController.ts` / `courses.ts` を確認し、現在の描画・衝突・進捗計算を把握する。
2. `game/chips/chipTrack.ts` にコース別の中心線、道幅、サンプル、スタート姿勢、`Path2D` 判定、最近傍進捗、復帰位置を定義する。
3. `game/chips/chipRenderer.ts` に床、道路、チップ壁、電撃ライン、背景装飾、START / GOAL、ミニマップ縮小描画を実装する。
4. `drawing.ts` を chip renderer に接続し、既存カートスプライト、HUD、ブースト、半透明ダメージ表現を維持する。
5. `useRaceController.ts` の preload、開始位置、衝突復帰、進捗更新をコース別仕様に切り替える。
6. README の現状制約と構成説明を更新する。

## ドキュメント保守計画

ユーザー可視のゲーム中コース表現と当たり判定が変わるため、`app/web/README.md` の構成・コースデータ・制約を更新する。

## 受け入れ条件

- [x] `?screen=ready` で選択コースのチップベースプレビューが表示される。
- [x] ゲーム中 canvas で、コースごとに違う走行ライン、壁チップ、テーマ床が表示される。
- [x] 壁外へ出るとスタートへ戻り、接触回数が増える。
- [x] コース 01〜05 の `Course.partAssets` がチップ描画に使われる。
- [x] ミニマップがチップコースの縮小版として表示される。
- [x] 既存の HUD、タイム、ラップ、ブースト、リザルト遷移が維持される。
- [x] `cd app/web && npm run build` が通る。
- [x] README が新しい canvas コース仕様に更新される。

## 検証計画

- `cd app/web && npm run build`
- `git diff --check`
- 必要に応じてローカルレンダリング確認またはコード上の描画経路確認を行い、未実施項目は PR コメントと作業レポートに明記する。

## 検証結果

- `npm ci`: pass
- `cd app/web && npm run build`: pass
- `git diff --check`: pass
- `google-chrome --headless=new --disable-gpu --screenshot=/tmp/chip-ready-adjusted.png --window-size=1440,1000 'http://127.0.0.1:5173/?screen=ready'`: pass
- PR: https://github.com/tsuji-tomonori/biribiri-racers/pull/12
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/12#issuecomment-4469200677
- セルフレビューコメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/12#issuecomment-4469201520
- 制約: 手動操作による 3 ラップ完走、壁接触回数インクリメント、リザルト遷移の実ブラウザ確認は未実施。

## PR レビュー観点

- chipTrack のコース別仕様から描画・進捗・衝突が一貫して導出されていること。
- 画像ロード失敗時も canvas が空白にならず、床とチップのフォールバックが残ること。
- 既存 HUD / カート / ブースト / ラップ / リザルトの既存 API を壊していないこと。
- 新規 npm パッケージを追加していないこと。

## リスク

- Canvas の視覚品質はスクリーンショット検証をしない場合、build とコード確認だけでは完全には保証できない。
- Path2D の `isPointInStroke` はブラウザ API のため、Node build では型検証に留まる。
