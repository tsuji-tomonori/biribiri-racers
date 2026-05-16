# 画像参照UI実装ワークフロー用 skills / agents 追加

保存先: `tasks/do/20260516-2033-ui-image-workflow-skills.md`

状態: do

タスク種別: ドキュメント更新

## 背景

ユーザーは、スクリーンショットや Figma 画像をもとに同じ見た目・同じ操作感の Web アプリを Codex に作らせるため、`AGENTS.md`、3から5個の skills、3から4個の subagents を整備する構成を提示した。既存リポジトリには worktree/PR flow、UI/a11y、skills/agents 更新用の skill があるため、それらと矛盾しない形で画像参照 UI 実装ワークフローを追加する。

## 目的

画像参照から UI 仕様化、実装、ブラウザ視覚確認、アクセシビリティ確認へ進む再利用可能な Codex workflow をリポジトリローカルに定義する。

## 対象範囲

- `AGENTS.md`
- `skills/screenshot-to-ui-spec/SKILL.md`
- `skills/webapp-slice-builder/SKILL.md`
- `skills/visual-browser-qa/SKILL.md`
- `skills/asset-mapper/SKILL.md`
- `agents/visual-analyzer.toml`
- `agents/frontend-builder.toml`
- `agents/visual-qa.toml`
- `agents/accessibility-reviewer.toml`
- `reports/working/`
- このタスクファイル

## 方針

- 既存 `skills/mobile-first-web-app-ui-ux-a11y/SKILL.md`、`skills/no-mock-product-ui/SKILL.md`、`skills/skills_agents_updater/SKILL.md` と役割を重複させず、画像参照 UI 実装に必要な手順だけを追加する。
- skill は短く、実行順序と成果物を明確にする。
- agent TOML は既存 `agents/*.toml` の形式に合わせ、read-only と workspace-write の境界を明示する。
- deploy skill は今回の最小構成から外し、必要になった時点で追加できるよう `AGENTS.md` に判断基準だけ残す。

## 必要情報

- 既存 `AGENTS.md` は repository worktree flow、PR、post-task report、test selection を常時ルールとして定義済み。
- `app/web` は静的 HTML/CSS/JS 構成で、現時点では Next.js や Vercel 前提ではない。
- `agents/` には TOML 形式の agent 定義がある。
- 元 worktree の未追跡ファイル `reports/working/20260516-1814-ui-design-plan-report.md` は今回の作業に混ぜない。

## 実行計画

1. 既存 skill / agent / `AGENTS.md` の構造を確認する。
2. 画像参照 UI workflow 用の4 skillsを追加する。
3. 画像分析、実装、視覚QA、a11yレビュー用の4 agent TOMLを追加する。
4. `AGENTS.md` に画像/Figma参照 UI 実装時の必須順序と skill/agent 利用方針を追記する。
5. frontmatter、skill名重複、TOML構文、末尾空白、`git diff --check` を検証する。
6. 作業レポートを `reports/working/` に作成する。
7. commit / push / PR 作成 / 受け入れ条件コメントを行う。
8. PR コメント後にタスクを `tasks/done/` へ移動し、同じ PR branch に commit / push する。

## ドキュメントメンテナンス計画

- `AGENTS.md` は developer workflow の恒常ルールとして更新する。
- `docs/` はプロダクト要件や設計変更ではないため更新対象外とする。
- README は開発者向けルールの主導線が `AGENTS.md` と `skills/` にあるため、今回の対象外とする。
- PR 本文では docs/README を更新しない理由を明記する。

## 受け入れ条件

- [ ] `screenshot-to-ui-spec` skill が、画像/Figma参照を UI 仕様と受け入れチェックリストに変換する手順を定義している。
- [ ] `webapp-slice-builder` skill が、既存 repo の routing/components/styles/data flow を確認して1画面または1機能を実装する手順を定義している。
- [ ] `visual-browser-qa` skill が、ブラウザまたは Playwright で desktop/mobile の視覚差分を確認し反復する手順を定義している。
- [ ] `asset-mapper` skill が、既存 asset / icon / logo の探索と placeholder 制約を定義している。
- [ ] 4つの agent TOML が、画像分析、実装、視覚QA、a11yレビューの役割と編集権限を分離している。
- [ ] `AGENTS.md` が、画像/Figma参照 UI 実装時に「仕様化 -> asset整理 -> 実装 -> 視覚QA -> a11y確認」の順序を要求している。
- [ ] skill frontmatter、skill名重複、agent TOML構文、Markdown末尾空白、`git diff --check` を検証している。
- [ ] 作業レポート、commit、push、PR、PR受け入れ条件コメント、タスク完了更新が行われている。

## 検証計画

- `python3 - <<'PY' ...` で `skills/*/SKILL.md` の frontmatter と重複名を確認する。
- `python3 - <<'PY' ...` で追加した `agents/*.toml` を `tomllib` parse する。
- `git diff --check`
- `git status --short`
- スクリプトやアプリコード変更ではないため、アプリの build/test は原則不要。必要性は `implementation-test-selector` の観点で再確認する。

## PRレビュー観点

- 追加 skill が既存 workflow と矛盾せず、必要な場面で発火しやすい `description` になっているか。
- 画像参照 UI 実装の workflow が、画像から直接コードへ飛ばず、仕様化と視覚検証を挟む構成になっているか。
- 本番 UI に架空データや placeholder を混入させない制約が維持されているか。
- agent の編集権限が役割に対して過剰でないか。
- 未実施の検証を実施済みとして記載していないか。

## 未決事項・リスク

- 決定事項: deploy skill は今回追加しない。現 repo は静的 `app/web` が中心であり、deploy 先が確定していないため。
- 決定事項: 画像参照 UI workflow は `skills/` と `agents/` に置く。`.agents/skills` や `.codex/agents` ではなく既存 repo の配置に合わせる。
- リスク: 実際の Codex 環境で repository-local agent TOML の読み込み場所が異なる可能性があるため、PR では既存 `agents/` 形式に合わせた定義として説明する。
