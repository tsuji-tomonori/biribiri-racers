# UI design spec implementation report

## 受けた指示

- 提示された「ビリビリレーサーズ デザイン仕様書」をもとに実装する。
- 直前の `/plan` 後に `go` 指示があったため、計画で止まらず実装、検証、PR 作成まで進める。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | 仕様書の主要画面を既存 Web アプリへ反映する | 対応 |
| R2 | `courseId` を正とするコースマスタへ寄せる | 対応 |
| R3 | オンライン未実装機能を実データのように見せない | 対応 |
| R4 | PC/タッチ HUD の方針を UI に反映する | 対応 |
| R5 | README と task/report を更新する | 対応 |
| R6 | 実行した検証だけを記録する | 対応 |

## 検討・判断の要約

- 既存は静的 Web の一人プレイ初版だったため、オンライン対戦や永続化は実装せず、未接続・準備中状態として正直に表示した。
- 仕様全体を外部画像アセット前提で完全再現するのではなく、既存の CSS/canvas 表現を拡張して主要フローを実装した。
- コース名の名称揺れ対策として、`app/web/app.js` の `courses` マスタに `id`、`name`、`aliases`、難易度、説明、想定タイム、実装状態を集約した。
- 画面文言と README では、ルームコードや共有が接続可能な実データではないことを明示した。

## 実施作業

- `app/web/index.html`
  - HOME、TEAM_CREATE、JOIN_BY_CODE、MAP_LIST、RACE_LOBBY、GAMEPLAY、RESULT 相当の主要セクションを整理・追加。
  - コード参加、フレンド、共有、オンラインランキングは未接続状態として表示。
  - タッチ操作用 HUD 要素とクイックチャット表示を追加。
- `app/web/app.js`
  - `courses` マスタを導入し、`courseId` ベースでコース名、説明、タグ、記録表示を同期。
  - コースカード、マップ一覧、参加コード入力、ラップ/人数/公開設定 UI の状態同期を追加。
  - レース完了時の一時ベスト記録を選択中コースへ保存。
- `app/web/styles.css`
  - 追加画面、コースカード、空状態、マップ詳細、タッチ HUD、狭幅表示のスタイルを追加。
  - モバイル幅で横方向にはみ出しにくいよう、グリッドとボタン幅を調整。
- `app/web/README.md`
  - 新しい画面一覧、コースマスタ方針、未実装範囲、確認コマンドを追記。
- `tasks/do/20260516-1831-ui-design-spec-implementation.md`
  - 作業前に受け入れ条件、検証計画、リスクを記載。

## 成果物

| 成果物 | 内容 |
|---|---|
| `app/web/index.html` | 主要画面構成と仕様文言の反映 |
| `app/web/app.js` | `courseId` ベースのマスタ、状態同期、画面操作 |
| `app/web/styles.css` | 追加画面と HUD の見た目、レスポンシブ調整 |
| `app/web/README.md` | 実装済み画面、制約、確認手順 |
| `tasks/do/20260516-1831-ui-design-spec-implementation.md` | 作業タスクと受け入れ条件 |

## 実行した検証

- `node --check app/web/app.js`: pass
- `git diff --check`: pass
- `python3 -m http.server 4174 --directory app/web`: pass。`4173` は使用中だったため `4174` を使用。
- `curl -I http://127.0.0.1:4174/`: pass。通常 sandbox ではローカルソケット作成が許可されなかったため、承認済みの `require_escalated` で HTTP 200 を確認。
- `google-chrome --headless=new --disable-gpu --dump-dom http://127.0.0.1:4174/`: pass。DBus 警告は出たが終了コード 0 で DOM が出力された。
- `google-chrome --headless=new --disable-gpu --window-size=1365,768 --screenshot=/tmp/biribiri-home-desktop.png http://127.0.0.1:4174/`: pass。
- `google-chrome --headless=new --disable-gpu --window-size=390,844 --screenshot=/tmp/biribiri-home-mobile-4.png http://127.0.0.1:4174/`: pass。

## 未対応・制約・リスク

- 実オンライン対戦、コード検索、フレンド、共有、永続ランキングは未実装。
- 画像アセット、9-slice 素材、collision mask / tile map 分離は未実装。
- headless Chrome のスクリーンショット確認は HOME 画面中心で、全画面の視覚確認は未自動化。
- モバイル幅は横はみ出しを抑える調整を入れたが、全端末の実機確認は未実施。

## Fit 評価

総合fit: 4.3 / 5.0

理由: 仕様書の主要画面、データモデル方針、未実装機能の正直な表示、README 更新、検証は対応した。一方で、オンライン機能や画像素材ベースの完全なコースビュー、全画面の自動視覚検証はスコープ外として残っている。
