# 当初画像基準のアートボード化とコース boardAsset 化

状態: done

タスク種別: 修正

## 背景

現在の UI は当初画像そのものの再現ではなく、v2 素材を使って別レイアウトを組み直した状態になっている。特にレース画面は完成済みコースアートではなく Canvas で道・壁・チップ・電撃線を生成しており、参照画像から大きくずれている。

## 目的

当初画像 6 画面を canonical reference として扱う方針に切り替え、最初の実装単位としてゲーム画面のコース背景を完成画像 `boardAsset` ベースにする。あわせて固定アートボード化へ進めるための UI 仕様・CSS 分割の入口を作る。

## スコープ

- `.workspace` の 1672x941 画像から reference とコースボードに使う画像を整理する。
- `Course` に `boardAsset` を追加し、プリロードと Canvas 描画で利用する。
- `drawTrack()` は `boardAsset` がある場合に完成済み画像を背景として描画し、未設定時のみ既存の `drawChipTrack()` にフォールバックする。
- 6 画面を固定アートボード基準で再実装するための UI 仕様を更新する。
- CSS 追記だけで直す方針を避け、画面別 CSS 分割へ進められる構成を作る。

## スコープ外

- 6 画面すべてのピクセル完全一致。
- `chipTrack.ts` の当たり判定座標を参照画像の道路形状へ完全再調整する作業。
- Playwright/pixelmatch 依存の追加と golden screenshot test の全面導入。

## なぜなぜ分析サマリ

- confirmed: 既存 `docs/ui-spec-asset-pack-v2-ui.md` は、正確な当初スクリーンショットではなく workspace 画像と v2 素材を source of truth とする前提を明記している。
- confirmed: `drawTrack()` は `drawChipTrack()` を呼び、完成済みコース画像ではなく Canvas 生成コースを描画している。
- confirmed: `Course` は `previewAsset` と `mapAsset` を持つが、ゲーム画面背景用の完成済み `boardAsset` を持たない。
- inferred: 画面全体を当初画像の座標から逆算せず、再利用コンポーネントと流動レイアウトで再構成したため、座標・余白・HUD 配置が参照画像と乖離した。
- root cause: 参照画像を golden reference として固定する仕様・データモデル・検証手段がなく、完成画像を描画する経路より Canvas 生成や後追い CSS 上書きが優先されていた。
- remediation: reference 画像を明示し、`Course.boardAsset` と描画経路を追加し、UI 仕様に固定アートボードと visual regression 方針を明記する。

## 実施計画

- [x] workspace 画像と既存 assets を棚卸しし、reference/boardAsset の対応を記録する。
- [x] UI 仕様を「当初画像 6 画面の再現」に更新し、アートボード・asset mapping・検証方針を明記する。
- [x] `Course.boardAsset`、プリロード、Canvas 背景描画を実装する。
- [x] CSS 分割または入口 import を作り、固定アートボード基準の土台を追加する。
- [x] reference/board/QA 画像を PNG のまま追加できるよう、pre-commit の large-file 上限を調整する。
- [x] 型チェック/build と必要なブラウザ確認を実施する。
- [x] 作業レポート、commit、push、PR、受け入れ条件コメント、task done 更新を完了する。

## ドキュメント保守計画

UI の前提と検証方針が変わるため、`docs/ui-spec-asset-pack-v2-ui.md` を更新する。README は開発手順や公開 API が変わらない限り更新不要と判断する。

## 受け入れ条件

- [x] 当初画像 6 画面を canonical reference とする方針が仕様に記録されている。
- [x] `Course` に `boardAsset` が追加され、少なくとも Pastel Planet のゲーム画面背景に完成済みコースボード画像を使える。
- [x] `useRaceController` のプリロード対象に `boardAsset` が含まれる。
- [x] `drawTrack()` は `boardAsset` 読み込み済み時に画像を contain 描画し、未設定時は既存のチップ描画へフォールバックする。
- [x] CSS は追記上書きの継続ではなく、固定アートボード用の分離された入口を持つ。
- [x] 既存のゲーム操作と描画が TypeScript build を通過する。
- [x] 未対応の visual regression test 全面導入と当たり判定再調整は、未完了として PR 本文・コメント・レポートに明記されている。

## 検証結果

- `npm run build` in `app/web`: pass
- `npm run test:visual` in `app/web`: pass（reference 画像寸法確認 6 件 pass、pixel comparison 6 件 skipped）
- `git diff --check`: pass
- `google-chrome --headless=new --window-size=1672,941 --screenshot=/tmp/biribiri-game-1672-after.png http://127.0.0.1:5174/?screen=game`: pass（boardAsset 表示を確認、ただし既存レイアウトは reference と未一致）
- `google-chrome --headless=new --window-size=375,667 --screenshot=/tmp/biribiri-game-375-after.png http://127.0.0.1:5174/?screen=game`: pass（表示確認のみ。既存ゲーム画面はモバイルで横方向に収まりきっていない）
- `pre-commit run --files <staged files>`: pass

## 未対応・既知差分

- 6 画面の座標ベース全面再実装は未完了。
- Playwright の pixel comparison は、現行 UI が reference と大きく違うため skipped にしている。
- `chipTrack.ts` の当たり判定座標は `boardAsset` の道路形状へ未調整。
- `styles.css` の後半レイヤー削除と画面別 CSS への完全分割は未完了。今回の変更では `src/styles/artboard.css` を入口として追加した。

## 検証計画

- `npm run build` in `app/web`
- `git diff --check`
- 可能なら Vite dev server + 1672x941/1440px/375px のブラウザ表示確認

## PR レビュー観点

- boardAsset が実データ/実 asset 由来であり、架空の UI データを増やしていないこと。
- Canvas 背景画像と既存当たり判定のズレを既知制約として明記していること。
- 仕様が「v2素材の再設計」ではなく「当初画像再現」に更新されていること。

## リスク

- workspace 画像の画面種別はファイル名だけでは判別できないため、画像内容確認に基づく推定が入る。
- 完成済みコースボード画像を全コース分用意できない場合、当面は Pastel Planet から段階導入する。
- 見た目と当たり判定の道路形状が完全には一致しない可能性がある。
