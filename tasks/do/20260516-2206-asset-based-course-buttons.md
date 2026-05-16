# コースとボタンを asset pack v2 ベースで組み立てる

- 状態: do
- タスク種別: 修正
- ブランチ: `codex/asset-pack-v2-ui`
- 対象: `app/web/`

## 背景

前回の asset pack v2 UI 反映では、主にコースカード、カート、ロゴ、一部エフェクトを UI に接続した。追加で、ユーザーから「コースやボタンもアセットベースで組み立てて。基本アセットにあるものは全部使ってUIをくみ上げるイメージ」と指示があった。

## 目的

`biribiri_racers_asset_pack_v2.zip` に含まれる基本カテゴリを、CSS 図形だけでなく実画像 asset として UI の構成要素に割り当てる。特にコース部品、メニュー用ボタン画像、UI フレーム/コントロール、背景テーマを実画面に反映する。

## スコープ

- `logo_and_buttons/menu_button_*.png` をボタン・ショートカットの見た目に利用する。
- `course_parts/*.png` をコース選択カード、詳細、メニューのコースステージに利用する。
- `ui_frames_controls/*.png` をパネル、入力、HUD、アイコン系コントロールの装飾に利用する。
- `background_themes/*` のテーマバッジ、パノラマ、床、ボーダーをコーステーマ表示に利用する。
- asset mapping と UI spec を更新する。

## スコープ外

- zip 内の全 2,416 ファイルを無差別に配信対象へ追加すること。
- オンラインルーム、ランキング、保存済みデータなど未実装機能の実装。
- コース画像をそのまま当たり判定に変換すること。

## 軽量なぜなぜ分析

- 問題文: 前回反映後も一部の UI は CSS 背景や文字ボタン中心で、asset pack の基本部品で UI を組み立てている印象が弱い。
- 確認済み事実:
  - zip には `logo_and_buttons`、`course_parts`、`ui_frames_controls`、`background_themes` が含まれる。
  - 現行 UI は `course_cards`、`kart_sprites`、一部 `effects_badges` を主に使用している。
  - ボタンは semantic button だが、見た目は CSS グラデーション中心である。
- 推定原因:
  - 初回スコープで asset 追加を必要最小限に絞り、ボタン画像・部品レイヤー・背景テーマまでは接続していなかった。
- 根本原因:
  - asset pack のカテゴリ横断的な配置方針が UI spec と実装にまだ不足している。
- 対策:
  - 基本カテゴリごとに代表 asset を UI の明確な構成要素へ割り当てる。
  - 見た目だけでなく course metadata と CSS custom property で選択コースに連動させる。

## 受け入れ条件

- [ ] メインの大ボタン、戻る/参加/マップ等の操作ボタンに `menu_button_*.png` または `ui_frames_controls` 画像が反映されている。
- [ ] コース選択・マップ詳細・メニューのステージに `course_parts/*.png` が表示され、コースを部品で組み立てている印象が出ている。
- [ ] 選択コースに応じて `background_themes` のバッジ、背景、床/ボーダー asset が UI に反映される。
- [ ] 既存のボタン操作、コース選択、レース開始までの導線を壊していない。
- [ ] 375px と 1440px のブラウザ確認で、主要 UI の重なり・横スクロール・テキスト破綻がない。
- [ ] 未実装のオンライン機能やランキングを実データのように偽装しない。
- [ ] 選定した検証が pass し、未実施項目がある場合は理由を記録している。
- [ ] PR コメントで受け入れ条件確認とセルフレビューを日本語で残している。

## 検証計画

- `git diff --check`: pass
- `node --check app/web/app.js`: pass
- `python3 -m http.server 8026` によるローカル配信: pass
- headless Chrome で 375px / 1440px の menu/map/room 画面確認: pass
  - menu 1440px: `/tmp/biribiri-asset-buttons-menu-1440b.png`
  - menu 375px: `/tmp/biribiri-asset-buttons-menu-375b.png`
  - map 1440px: `/tmp/biribiri-asset-buttons-map-1440.png`
  - room 1440px: `/tmp/biribiri-asset-buttons-room-1440.png`
  - map 375px: `/tmp/biribiri-asset-buttons-map-375b.png`

## ドキュメントメンテナンス計画

- `docs/ui-spec-asset-pack-v2-ui.md` の asset mapping と受け入れ条件を更新する。
- README/API/運用手順の変更は不要見込み。理由は作業レポートに記録する。

## リスク

- 「基本アセット全部」は、全ファイル追加ではなく、基本カテゴリを画面構成に使う意味として扱う。全ファイルを配信対象化すると静的アプリの読み込み重量が大きくなるため、表示に使う asset を中心に取り込む。
