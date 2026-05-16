# .workspace 参照画像に合わせたUI/マップ調整

- 状態: done
- タスク種別: 修正
- ブランチ: `codex/ui-map-reference-match`
- 作業日: 2026-05-16

## 背景

ユーザーから「.workspace の画像とできる限りUIを合わせて。特にマップの部分」と依頼された。参照画像は、白基調パネル、太い青アウトライン、ピンク/青/ミント/黄の大きなボタン、カラフルな電撃壁、灰色の太い路面、START/GOALゲート、ミニマップを特徴とするゲームUIである。

## 目的

既存の `app/web` 一人プレイUIを、参照画像の方向性に近づける。特にゲーム中Canvas、開始前プレビュー、ミニマップ、コースカードのマップ表現を優先する。

## スコープ

- `app/web/app.js` のコース形状、Canvas描画、ミニマップ描画
- `app/web/styles.css` の画面装飾、マッププレビュー、カード、レスポンシブ調整
- 必要に応じた `app/web/index.html` の表示文言・構造微調整
- `app/web/README.md` の更新要否確認
- 作業レポート作成、commit、PR作成、PRコメント

## 軽量なぜなぜ分析

### 問題文

現行UIのマップ表現が `.workspace` の参照画像に比べて抽象的で、特にゲーム本体CanvasとCSS製プレビューが同じコース世界観に見えない。

### 確認済み事実

- `app/web/app.js` は `drawTrack` でCanvasコースを描いている。
- `app/web/styles.css` は `.track-preview` と `.mini-map-art` をCSSグラデーションで別表現として描いている。
- 参照画像では、ゲーム本体、コースプレビュー、ミニマップが共通して「太い灰色路面」「カラフルな電撃壁」「START/GOALゲート」「角丸ブロック」の視覚言語を持つ。

### 推定原因

- 初版実装では動作するレースゲームを優先し、Canvas描画とCSSプレビューのデザイン統一が後回しになった。
- マップの視覚要素が抽象的な線・グラデーション中心で、参照画像の立体的なブロック壁や電撃エフェクトを十分に表現していない。

### 根本原因

マップを構成する共通の視覚ルールが定義されておらず、CanvasとCSSが別々の簡易表現で実装されている。

### 対策

- Canvas描画に参照画像の主要要素を追加する。
- CSSプレビューをCanvasと同じ色・形状・START/GOAL表現へ寄せる。
- UI全体のパネル・ボタン・背景を参照画像に近い白基調/青アウトライン/高彩度配色へ調整する。

## 受け入れ条件

- [x] メインのコースマップが参照画像に近い、太い灰色路面、カラフル電撃壁、START/GOALゲート、方向矢印を持つ。
- [x] コースプレビュー、ミニマップ、リザルト内のコース表示が本体マップと視覚的に矛盾しない。
- [x] 既存の一人プレイ操作、壁接触でスタートへ戻る挙動、ラップ完了、ブーストが維持されている。
- [x] 320px相当のモバイル幅でも主要テキストと操作ボタンが重ならない。
- [x] 未実装のオンライン要素を実データのように表示しない。

## 実装計画

1. 参照画像のマップ特徴をCanvasの描画関数へ反映する。
2. CSSの静的マップ表現をCanvasと同じ見た目に寄せる。
3. 画面パネル・ボタン・カード・背景の密度と配色を調整する。
4. ドキュメント更新要否を確認する。
5. 静的サーバーで表示・操作を検証する。

## ドキュメント保守計画

UIの見た目改善が中心で、起動方法・操作方法・初版制約に変更がなければ `app/web/README.md` は更新しない。変更が必要な場合のみ最小限で追記する。

## 検証計画

- `git diff --check`
- `python3 -m http.server 4173 --directory app/web`
- ブラウザまたはヘッドレス確認でトップ画面、ルーム画面、開始前画面、ゲーム画面、リザルト画面を確認
- 操作確認: レース開始、移動、ブースト、壁接触、ラップ/リザルト遷移

## PRレビュー観点

- 参照画像の特徴がマップ部分へ十分反映されているか。
- Canvas描画の当たり判定と見た目が大きく乖離していないか。
- CSSプレビューが本体マップと別物に見えないか。
- レスポンシブ時にUIが重ならないか。
- 本番UIに架空の実データ風表示が増えていないか。

## リスク

- 参照画像はAI生成画像であり、完全一致ではなく方向性の再現になる。
- Canvasの見た目を豪華にすると、当たり判定の視覚境界とのズレが発生しやすい。
- 手動ブラウザ検証の範囲には限界がある。

## 実施メモ

- `app/web/app.js` のCanvas描画に、参照画像の特徴である太い灰色路面、白縁、カラフルな電撃壁ブロック、START/GOAL、壁沿いの短い稲妻、背景装飾、ミニマップ表現を追加した。
- `app/web/styles.css` の背景、パネル、ボタン、コースプレビュー、ミニマップ風カード、モバイル表示を調整した。
- `app/web/README.md` は起動方法・操作・制約に変更がないため更新不要と判断した。

## 検証結果

- `node --check app/web/app.js`: pass
- `git diff --check`: pass
- `pre-commit run --files app/web/app.js app/web/styles.css tasks/do/20260516-1656-ui-map-reference-match.md`: pass
- `python3 -m http.server 4173 --directory app/web`: pass
- `google-chrome --headless=new --no-sandbox --disable-gpu --window-size=1440,900 --screenshot=/tmp/biribiri-menu-2.png http://127.0.0.1:4173/`: pass
- `google-chrome --headless=new --no-sandbox --disable-gpu --window-size=390,844 --screenshot=/tmp/biribiri-mobile-2.png http://127.0.0.1:4173/`: pass
- DevTools Protocol 320pxエミュレーション: pass。`innerWidth: 320`、`scrollWidth: 320`、`hero: 296`、`showcase: 296`。
- DevTools Protocol 画面遷移確認: pass。`screen-room`、`screen-ready`、`screen-game`、`screen-result`。
- DevTools Protocol 壁接触リセット確認: pass。壁外座標から `x: 165`、`y: 545` へ戻り、HUD `1回` を確認。
