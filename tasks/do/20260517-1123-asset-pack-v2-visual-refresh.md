# asset pack v2 visual refresh による Web UI 立て直し

- 状態: do
- タスク種別: 修正
- 想定ブランチ: `codex/asset-pack-v2-visual-refresh`
- 対象: `app/web/`

## 背景

asset pack v2 を使った UI 反映後も、ユーザー確認で以下の違和感が出ている。今回の依頼では単なる CSS 微修正ではなく、`app/web` の主要画面を v2 アセット中心の明るいキッズ向けアーケードレーシング UI として再構成する。

- アセットの上に文字が載っていて、画像そのものの見せ方が崩れている。
- コース表現が `.worktrees/asset-pack-v2-ui` などにある参照画像・アセットの見た目に十分寄っていない。
- アセット同士の縮尺比が不自然で、コース部品・カート・バッジが同じ画面内で別スケールに見える。

## 目的

参照画像と asset pack v2 の意図に合わせ、画像アセットを「文字の背景」ではなく UI の主要ビジュアルとして扱う。メニュー、ルーム、コード参加、マップ、待機、ゲーム中 HUD、リザルトを、既存の画面遷移・操作・canvas 当たり判定を維持したまま、v2 の course-card / course-parts / buttons / ui / logo / effects / icons / karts / themes を主役にした表示へ立て直す。

## スコープ

- `app/web/src/components/screens/*`、`app/web/src/components/course/*`、`app/web/src/components/ui/*`、`app/web/src/data/assets.ts`、`app/web/src/data/courses.ts`、`app/web/styles.css` を中心に確認・修正する。
- メニューは 1440px desktop で自然な 2 カラム、375px mobile で 1 カラムに落とす。
- course-card PNG は画像として見せ、焼き込み済みラベルと同じ HTML テキストを画像上に重ねない。
- button 要素の semantic HTML と accessible name を維持しながら、v2 button / UI frame を主要アクションに適用する。
- Room / Join / Map / Ready / Game / Result で、未実装オンライン・ランキング系を実データに見せない honest state を維持する。
- ゲーム中 canvas の描画、操作、当たり判定は既存挙動を維持する。

## スコープ外

- レース物理、当たり判定、AI、オンライン機能の追加。
- asset pack 全ファイルの無差別な配信対象化。
- 参照画像に存在しない架空データや fake ranking の追加。
- course-card / course-parts を使った表示用刷新を超える collision map 再設計。

## 確認済みの改善ポイント

1. ボタン画像の上に文字を載せる/隠す実装が混在している。
   - `mega-button` は `menu_button_*.png` を背景にしつつ、一部テキストを visually-hidden にしている。
   - 一方で `start` や `select-map-course` などは背景画像の上に文字を表示しており、画像内の装飾と文字が競合しやすい。
   - 改善方針: ボタン画像に文字込みのものを使う場合は視覚テキストを別レイヤーに重ねない。文字なしフレームを使う場合は、テキスト専用の帯・余白・コントラストを確保する。

2. コースステージが参照画像の「コースらしい形」になっていない。
   - `.track-preview` は course card / panorama を全面背景にし、その上へ数個の `course_parts` を絶対配置している。
   - これだとコース部品が飾りに見え、参照画像のような走路・分岐・スタート/ゴールの構造が弱い。
   - 改善方針: コースカード画像を背景に敷くのではなく、走路レイヤー、スタート/ゴール、障害物、装飾 props を分けて、各コースごとに 1 つの見えるミニコースとして組み直す。

3. アセットの縮尺基準が統一されていない。
   - 例: `course_parts_007.png` は 230x176、`course_parts_012.png` は 61x146、`blue_boost.png` は 123x189、`start_badge.png` は 372x129。
   - 現状は `width: 34%` や `width: 10%` のような個別指定が中心で、元画像の実寸比・役割ごとの標準サイズが task/spec に残っていない。
   - 改善方針: asset role ごとに標準表示サイズを定義する。例: kart 56-76px、badge 72-120px、road segment は course container 幅に対する同一単位、decorative prop は奥行きに応じた 3 段階。

4. 文字と画像の責務が分離されていない。
   - コースカード、ショートカット、フッター操作で、画像背景・ラベル・装飾が同じボックスに密集している。
   - 改善方針: 画像プレビュー領域とテキスト領域を明確に分ける。画像の上に置く文字は、バッジ/短い状態表示など必要最小限に限定し、背景スクラムを避ける。

5. responsive 時の破綻検出が不十分。
   - 既存 task では 375px/1440px の確認はあるが、「アセット上の文字」「縮尺比」「参照コースとの一致」を個別の検収項目として持っていない。
   - 改善方針: 375px / 768px / 1440px で、画像上テキストなし、コース形状、縮尺比、横スクロールなしをチェック項目化する。

## 軽量なぜなぜ分析

- 問題文: asset pack v2 反映後の UI で、アセット上の文字重なり、参照画像と異なるコース表現、アセット縮尺の不統一が見える。
- 確認済み事実:
  - `app/web/styles.css` で `menu_button_*.png` が button background として使われ、一部の視覚テキストは非表示化されている。
  - `.track-preview` は course card / panorama を背景に、少数の `course_parts` を絶対配置している。
  - 使用中 asset には 61px 幅から 372px 幅まで大きく異なる元寸法がある。
  - `docs/ui-spec-asset-pack-v2-ui.md` の受け入れ条件には、今回の 3 症状を個別に判定する項目がない。
- 推定原因:
  - asset pack のカテゴリ横断利用を優先し、各 asset の役割・標準表示サイズ・テキスト重ね可否の設計が後追いになった。
  - コース画像を presentation preview として扱う方針のまま、参照画像に近いミニコース構成まで落とし込めていない。
- 根本原因:
  - asset mapping は「どの画像を使うか」中心で、「どのレイヤーに、どの縮尺で、文字とどう分離して使うか」まで検収可能に定義されていない。
- 対策:
  - asset role 別のレイヤー規約と標準サイズを UI spec / task に追加する。
  - コース表現を course card 背景依存から、部品構成のミニコースへ更新する。
  - ブラウザ QA の観点に、画像上テキスト、参照コース形状、縮尺比を追加する。

## 実装計画

1. `.worktrees/asset-pack-v2-ui/app/web/assets/v2/` と現行 `app/web/assets/v2/` の参照対象を確認し、使う course parts / theme props / button assets を再分類する。
2. `docs/ui-spec-asset-pack-v2-ui.md` に asset role、表示サイズ、文字重ね可否、コース構成ルールを追加する。
3. メニューの `track-preview` と course detail / map card の画像レイヤーを、背景画像依存からコース部品レイヤー中心へ組み直す。
4. ボタン・ショートカット・フッター操作は、文字入り画像を使う場合は視覚テキストを重ねず、文字なし画像を使う場合はテキスト用レイヤーを明確化する。
5. asset の `object-fit`、`aspect-ratio`、role 別 CSS custom property を整理し、縮尺比を揃える。
6. 375px / 768px / 1440px で menu / room / map / ready を実ブラウザ確認し、スクリーンショットを作業レポートに記録する。

## ドキュメントメンテナンス計画

- `docs/ui-spec-asset-pack-v2-ui.md` を更新し、今回の改善観点を durable な UI 仕様として残す。
- README / API / 運用手順は、UI 表示仕様の範囲に留まる場合は更新不要。更新不要の理由を作業レポートに記録する。

## 受け入れ条件

- [ ] v2 course-card PNG がメニュー、ルーム/コース選択、マップ、待機/結果周辺で見える。
- [ ] course-card PNG が `cover` で切り抜かれず、焼き込み済みラベルと同じ HTML テキストが画像上に重複表示されていない。
- [ ] v2 kart/effect PNG がプレビュー、結果、レース隣接 UI で見える。
- [ ] v2 menu-button PNG が主要/補助アクションで見える。
- [ ] baked-label button は可視文字を二重表示せず、screen-reader-only 等で accessible name を保持している。
- [ ] v2 course-parts PNG がコースピッカー、マップカード、メニューステージに見える。
- [ ] 選択コースに応じて v2 theme assets が背景・バッジ・床・ボーダーなどへ切り替わり、Sky Spiral は fallback で破綻しない。
- [ ] 375px mobile と 1440px desktop で、重なり、横スクロール、意味不明な余白、画像の潰れがない。
- [ ] 主要アクションは 44px 以上を維持し、focus indicator が見える。
- [ ] 既存の画面遷移、ゲーム操作、コース選択、レース制御、canvas 当たり判定が壊れていない。
- [ ] 未実装のオンライン/ランキング/フレンド/共有系データを捏造していない。
- [ ] `npm run build` と `git diff --check` が pass し、未実施・未解決があれば理由を作業レポートに記録している。

## 検証計画

- `cd app/web`
- `npm install` は `node_modules` がなく、build 実行に必要な場合のみ実行する。
- `npm run build`
- `git diff --check`
- 可能なら dev server で `/`、`/?screen=room`、`/?screen=join`、`/?screen=map`、`/?screen=ready`、`/?screen=result` を確認する。
- 可能なら 1440px desktop と 375px mobile のスクリーンショットを保存し、作業レポートに記録する。

## PR レビュー観点

- 画像を単に増やすのではなく、レイヤー責務と縮尺基準が明確になっていること。
- 文字入りの button asset と DOM テキストが競合していないこと。
- `course_parts` の配置が装飾だけで終わらず、コース形状として読めること。
- モバイルで画像・文字・操作ボタンが圧縮されすぎないこと。
- fake data や未実装機能の見せかけが追加されていないこと。

## リスク・未確認点

- ユーザーが指す「`.worktree にある画像」が特定ファイル名として未指定のため、実装時は `.worktrees/asset-pack-v2-ui` と現行 asset pack の画像を参照元として再確認する。
- course parts の本来の接続ルールが asset 側に明示されていない場合、参照画像との完全一致ではなく、見た目の近似と検収可能なレイヤー構成を優先する。
