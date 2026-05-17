# boardAsset visual completion

状態: done
タスク種別: 修正

## 背景

PR #13 で reference 6画面、`Course.boardAsset`、コース01の完成済みボード、Canvas の `boardAsset` 描画、固定アートボードCSS、Playwright visual inventory test は追加済み。
一方で、コース02〜06は `boardAsset` が未設定で、visual regression は skip のまま残っている。

## 目的

当初画像6枚に寄せるための未完了土台のうち、現在のリポジトリだけで安全に進められる範囲を実装し、未達事項は検証可能な形で残す。

## なぜなぜ分析サマリ

- confirmed: `app/web/public/assets/v2/course-boards/` には `course_01_pastel_planet_board.png` しか存在しない。
- confirmed: `app/web/src/data/courses.ts` で `boardAsset` が設定されているのはコース01のみ。
- confirmed: `app/web/tests/visual/reference-artboard.spec.ts` の visual regression は `test.describe.skip` で無効化されている。
- inferred: 02〜06を選択した場合、Canvas は `boardAsset` 描画ではなく `drawChipTrack()` フォールバックへ戻る。
- inferred: 完全な `toHaveScreenshot()` 有効化は、6画面UIが reference と一致する座標ベース実装まで進まないと恒常的に失敗する。
- open_question: 当初画像そのものから作られたコース02〜06の board 画像は、現時点のリポジトリには見当たらない。
- root cause: 参照画像固定と描画入口は追加されたが、全コースへの board asset 展開と visual regression の段階化が不足している。
- remediation: 既存 asset で提供可能な範囲を整理し、02〜06の boardAsset 欠落を検出するテストまたは補完実装を追加する。完全一致が不可能な箇所は未対応として明記する。

## スコープ

- `courses.ts` の `boardAsset` 設定漏れ対策
- visual test の skip 状況を改善または明示的に検出
- 必要に応じた最小限の doc/task/report 更新

## スコープ外

- 当初画像6画面の完全な座標ベース全面再実装
- `chipTrack.ts` の当たり判定を board 画像道路形状へ精密調整
- リポジトリに存在しない当初画像アセットの新規復元

## 作業計画

1. 既存 asset、Course 定義、描画、visual test を確認する。
2. 現存 asset だけでコース02〜06に `boardAsset` を付与できるか判断する。
3. 付与できない場合は、欠落を見逃さないテストと追跡情報を追加する。
4. build と visual inventory test を実行する。
5. 作業レポート、commit、push、PR、受け入れ条件コメントまで進める。

## ドキュメント保守方針

ユーザー可視の完成状態に関わるため、恒久 docs に未対応事項が既にあるか確認する。恒久 docs 更新が不要な場合は作業レポートと PR 本文に理由を残す。

## 受け入れ条件

- [x] コース02〜06の `boardAsset` 欠落が、実装またはテストで見逃されない状態になっている。
- [x] visual regression の skip 状態について、解除できる場合は解除し、解除できない場合は理由と次工程が明示されている。
- [x] `npm run build` が pass する。
- [x] `npm run test:visual` が pass する。
- [x] 未対応の完全一致作業を完了扱いにせず、作業レポートと PR に残している。

## 完了結果

- PR: https://github.com/tsuji-tomonori/biribiri-racers/pull/14
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/14#issuecomment-4470420037
- セルフレビューコメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/14#issuecomment-4470420041
- 検証: `npm ci`、`npm run build`、`npm run test:visual`、`git diff --check` pass
- 制約: GitHub Apps は PR 作成・コメント投稿ともに 403 のため `gh` で代替した。

## 検証計画

- `npm run build` in `app/web`
- `npm run test:visual` in `app/web`
- `git diff --check`

## PRレビュー観点

- 既存の生成コース fallback に戻る経路を増やしていないか。
- 未提供 asset を架空に見せていないか。
- visual test が失敗を隠すだけの変更になっていないか。

## リスク

- 当初画像由来の board asset が02〜06分存在しない場合、完全な見た目一致はこのPRだけでは達成できない。
- visual regression を即時有効化すると、既存UIが reference と未一致のためテストが赤くなる可能性が高い。
