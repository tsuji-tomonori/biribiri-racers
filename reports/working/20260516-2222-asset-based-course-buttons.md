# コースとボタンの asset based UI 追加レポート

## 受けた指示

- `.workspace/biribiri_racers_asset_pack_v2.zip` のアセットを利用し、画像のような UI へ寄せる。
- 追加指示として、コースやボタンもアセットベースで組み立て、基本アセットにあるものを UI に使うイメージで修正する。

## 要件整理

- CSS 図形中心だったボタン、コース部品、UI フレーム、背景テーマを実 PNG asset に接続する。
- semantic button / input / course metadata は維持し、見た目だけを画像ベースに寄せる。
- 未実装のオンライン、ランキング、フレンド機能を実データのように表示しない。
- 全ファイル追加ではなく、基本カテゴリを UI の主要部品として使う。

## 検討・判断

- `logo_and_buttons/menu_button_004` から `menu_button_020` と `top_blank_ribbon` をボタン背景として利用した。
- `course_parts/*.png` は全 71 件を配置し、コースごとの部品列とメニューのコースステージへ割り当てた。
- `ui_frames_controls/*.png` と `icons/*.png` は、コントロール、入力、パネル印、プレイヤーアイコンの装飾に利用した。
- `background_themes` は 5 テーマ分を配置し、選択コースの `themeAssets` からバッジ、背景、床、ボーダーを切り替える構成にした。
- Sky Spiral 専用の background theme は asset pack 内にないため、コースカードと汎用コース部品の fallback 表示に留めた。

## 実施作業

- `app/web/assets/v2/` に buttons、course-parts、ui、icons、themes を追加した。
- `app/web/app.js` の course metadata に `themeAssets` と `partAssets` を追加し、コースカード、マップカード、詳細表示に反映した。
- `app/web/index.html` にステージ用コース部品レイヤーとテーマバッジ表示を追加した。
- `app/web/styles.css` に asset pack ベースのボタン、フレーム、背景、コース部品、mobile header 調整を追加した。
- `docs/ui-spec-asset-pack-v2-ui.md` の asset mapping と受け入れ条件を更新した。
- `tasks/do/20260516-2206-asset-based-course-buttons.md` を作成した。

## 成果物

- `app/web/assets/v2/buttons/`
- `app/web/assets/v2/course-parts/`
- `app/web/assets/v2/ui/`
- `app/web/assets/v2/icons/`
- `app/web/assets/v2/themes/`
- `app/web/app.js`
- `app/web/index.html`
- `app/web/styles.css`
- `docs/ui-spec-asset-pack-v2-ui.md`
- `tasks/do/20260516-2206-asset-based-course-buttons.md`

## 検証

- `node --check app/web/app.js`: pass
- `git diff --check`: pass
- `python3 -m http.server 8026`: pass
- headless Chrome screenshot: pass
  - menu 1440px: `/tmp/biribiri-asset-buttons-menu-1440b.png`
  - menu 375px: `/tmp/biribiri-asset-buttons-menu-375b.png`
  - map 1440px: `/tmp/biribiri-asset-buttons-map-1440.png`
  - room 1440px: `/tmp/biribiri-asset-buttons-room-1440.png`
  - map 375px: `/tmp/biribiri-asset-buttons-map-375b.png`

## 指示への fit 評価

- コースカードだけでなく `course_parts` と `background_themes` を使い、コース選択とステージを部品ベースの見た目に寄せた。
- メイン操作、戻る、マップ、ショートカット、入力/小型コントロールに `menu_button` と `ui_frames_controls` を使った。
- 基本カテゴリを UI に横断的に使う方針は満たした。一方で、全 2,416 ファイルを配信対象にすることは初回表示重量の観点から避けた。

## 未対応・制約・リスク

- Sky Spiral 専用の background theme が asset pack にないため、Sky の背景テーマ切り替えは fallback である。
- headless Chrome 実行時に `/favicon.ico` は 404 になるが、既存の favicon 未設定によるもので今回の UI asset 読み込みには影響しない。
- README/API/運用手順は変更不要。静的 UI の表示 asset 追加であり、起動手順や API 契約を変更していない。
