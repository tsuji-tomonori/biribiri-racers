# asset 重なり・コース見た目・縮尺比の UI 改善

- 状態: done
- タスク種別: 修正
- ブランチ: `codex/ui-asset-overlap-scale-fix`
- 対象: `app/web/index.html`, `app/web/app.js`, `app/web/styles.css`

## 背景

asset pack v2 反映後、ユーザーから以下の指摘があった。

- 「アセットの上に文字があったり」: PNG 内に既に焼き込まれているテキストの上に、HTML 側のテキストが重なって表示されている。
- 「コースが `.workspace` にある画像のようになっていない」: `course-cards/course_*_card.png` は元々 1 枚で完結したカード（カード番号・名前・★・ミニマップ・説明・ラップ数・予想タイム入り）だが、現在の UI ではミニマップ部分相当の領域に押し込まれ、別途文字を周囲に並べているため参照画像と一致しない。
- 「アセットの縮尺比がおかしかったり」: 縦長（≒ 2:3）のコースカード PNG を `height: 112px` の横長 thumb 領域に `background-size: cover` で流し込んでいるため、PNG が中央クロップされ、ミニマップ部分しか見えなくなっている。

## 目的

`.workspace/` に置かれた参照イメージと PNG の意図に沿うように、画像内テキストと HTML テキストの二重表示を解消し、各アセットを本来の縦横比で表示する。

## なぜなぜ分析サマリ

### 問題文

asset pack v2 反映後の `app/web` UI で、コースカード・ボタン・装飾 PNG の上に HTML 側の文字や固定サイズ枠が重なり、`.workspace/` 参照画像および PNG 本来の表示意図から外れている。

### 確認済み事実

- `renderCourseButtons` / `renderCourseGrid` は、`course_*.png` を `course-thumb` / `mini-course-thumb` の背景に置きつつ、コース番号・コース名・★・説明文を HTML で別表示している。
- コースカード PNG は `461x519`, `460x520`, `359x473`, `324x473`, `331x473` などで、横長サムネ枠に収める前提ではない。
- `.course-thumb` は `height: 112px`、`.mini-course-thumb` は `height: 70px` で、`background-size: cover` により PNG の一部だけが見える。
- `mega-button[data-action="start"]`, `select-map-course`, `join-submit` などは PNG 背景を持つ一方で、HTML の `<strong>` と `.button-icon` が可視のまま残る箇所がある。
- `notice-icon`, `stage-logo`, `stage-kart`, `winner-banner-art`, `medal`, `theme-badge-art` などは幅中心の指定が多く、画面幅や隣接要素次第で過大/過小に見える可能性がある。

### 推定原因

- v2 PNG が「情報入り完成カード」か「無地ボタン素材」かを区別する UI 実装ルールが不足していた。
- 既存の CSS 背景サムネイル構造を流用したため、完成カード PNG に対しても `cover` と固定高さが適用された。
- アクセシブルなテキストを残す必要性と、視覚表示としての PNG 焼き込み文字を優先する必要性が CSS で分離されていなかった。

### 根本原因

完成済み PNG アセットを、従来の「背景画像 + HTML ラベル」部品として扱い続けたことにより、表示責務が PNG と HTML の間で重複した。さらに、画像本来の縦横比を維持する共通ルールがないため、固定高さと `cover` によるクロップが発生した。

### 対策方針

- 完成カード PNG は `<img>` として表示し、HTML の重複可視テキストを削除または sr-only/aria-label に寄せる。
- PNG ラベル付きボタンは、可視表示を PNG に任せ、HTML テキストと icon はアクセシブル名として残す。
- 装飾 PNG は `height: auto`, `object-fit: contain`, 明示的な max サイズを揃え、歪みと過大表示を抑える。
- `docs/ui-spec-asset-pack-v2-ui.md` に、焼き込みテキスト入り PNG の扱いと縦横比維持ルールを残す。

## スコープ

- コースカード表示（`renderCourseButtons` の home recommended、`renderCourseGrid` の map グリッド、course-picker の mini-course）
  - PNG 1 枚でカード全体を表現する構成に切り替え、PNG に含まれるテキストと重複する HTML テキストを取り除く。
  - PNG の本来のアスペクト比（縦長）を維持するスタイル（`aspect-ratio` または `<img>` 直挿入）に変更する。
- アクションボタンのアセットとラベル重複
  - `mega-button[data-action="start" / "select-map-course" / "join-submit" / "force-start"]` 等、PNG 内に「ルーム作成」「マップ」「参加」など日本語ラベルが既に含まれているものは、可視テキストを sr-only にして PNG ラベルだけを見せるか、PNG をテキストなしの素材（`top_blank_ribbon.png` など）に差し替える。
  - `mega-button` 既存の sr-only ルール（room/join/howto/settings/map/menu/paste-code 用）に未追加の data-action を網羅する。
- カート / バッジ / ロゴ等の縮尺
  - `theme-badge-art`, `course-card-badge`, `stage-kart-*`, `medal`, `winner-banner-art`, `stage-logo`, `notice-icon` などで明示 width のみ指定し height が auto になっているもの、または逆に高さ固定で歪むものを `aspect-ratio` または `object-fit: contain` で揃える。
  - ready 画面の `stage-logo` / `start-line-label` / `ready-effect` 配置・サイズも参照画像と比較し過大/過小を是正する。
- 通知・notice バー
  - `notice-icon` (`new_badge.png`) と隣接テキストのバランス確認、必要なら高さ固定。

## スコープ外

- ゲームロジック（衝突判定、ブースト挙動、ラップ計測）の変更。
- オンライン機能、ランキング、フレンド連携の実装。
- 新規アセットの作成・差し替え（既存 v2 pack の範囲で対応）。
- レイアウトグリッドの大幅再設計（必要箇所のみ局所修正）。

## 想定される改善ポイント一覧

ヒアリングではなく実コード/実 PNG から確認した内容を初期一覧として残す（実装時に追補・削除可）。

1. `index.html` の course-card に重ねている `<span>${course.id}</span><strong>${course.name}</strong><small>★ … / status</small><em>${course.description}</em>` が、PNG に焼き込まれた "01 パステルプラネット / ★★★ / 説明文 / ラップ数 / 予想タイム" と重複している。
2. `.course-thumb { height: 112px }` がカード PNG（縦長）を横長領域に cover で押し込み、ミニマップ部分しか見えていない。`aspect-ratio: 250 / 360`（実 PNG 比に合わせる）等への変更が必要。
3. `mini-course-thumb` も同様にカード PNG を縮小しているため、`course-picker` で参照画像と異なる見た目になっている。
4. `mega-button[data-action="start"]` 等は PNG にラベル文字が入っているため、`<strong>作成する</strong>` 等の HTML テキストと二重表示になっている。sr-only 化対象を拡張する。
5. `button-icon` を `display: none` にしている data-action と、`background-image` を割り当てている data-action の対応関係が不揃いで、PNG 内アイコンと HTML アイコンが二重に出ている箇所がある（要照合）。
6. `course-card-badge` が `width: clamp(40px, 34%, 78px)` / `max-height: 72px` で `object-fit: contain` だが、サムネ自体が歪んでいるため見た目が崩れる。サムネ修正後に再調整が必要。
7. `theme-badge-art` の `width: 92px` / `max-width: 20vw` 指定で、画像本来の正方形比が保たれているか確認する。
8. `track-preview` 内 `stage-kart-*` / `stage-effect-*` / `goal-banner` の位置・サイズが、参照画像（`.workspace/ChatGPT Image 2026年5月16日 14_30_*.png`）と比較して縮尺が崩れていないか確認する。
9. `notice-bar` の `notice-icon` (`new_badge.png`) に明示サイズがなく、レイアウト次第で巨大化する可能性がある。
10. 結果画面の `winner-banner-art` / `medal_1st.png` と `<p class="winner-en">WINNER!</p>` 等の文言が、PNG 焼き込み文字と重複している場合は片方に統一する。

## 実装方針: コース表示をアセットベースで再構築（#2 詳細）

### 前提（実 PNG の確認結果）

- `course_01_pastel_planet_card.png`: 461 × 519（≒ 0.89:1）
- `course_02_pikapika_city_card.png`: 460 × 520（≒ 0.88:1）
- `course_03_candy_loop_card.png`: 460 × 519（≒ 0.89:1）
- `course_04_thunder_garden_card.png`: 359 × 473（≒ 0.76:1）
- `course_05_ice_cube_card.png`: 324 × 473（≒ 0.69:1）
- `course_06_sky_spiral_card.png`: 331 × 473（≒ 0.70:1）

→ PNG 間で縦横比が揃っていない。**カードの「外枠」は HTML/CSS で共通化し、PNG はその中に `object-fit: contain` で原寸比で収める**方針とする（アセット側のリサイズ・トリミングは行わない）。

### 基本方針

1. **PNG をカード全体として扱う**（サムネ + テキスト構成をやめる）。
   - 既存の `<div class="course-thumb" style="background-image: var(--card-course-image)"></div>` + 別文字並列 の構造を廃止。
   - 代わりに `<img class="course-card-art" src="${course.previewAsset}" alt="${course.name}">` を 1 枚カード本体として配置。
   - `alt` には日本語コース名を入れ、PNG 内テキストが画像として読めない環境にもアクセシブルにする。
2. **PNG 内に焼き込まれた情報（コース名・★・説明・ラップ数・予想タイム）は HTML で複製しない**。
   - これらの動的に変わり得る値は、選択中コースの「詳細パネル」（`.course-detail`, `.map-detail`, ready/result 画面の `.course-info-card`）にのみ表示する。
   - カード自体は **看板**として扱い、PNG 内の表示が正（recommendedLaps/expectedTime と PNG の値が異なってもカード上は触らない、詳細パネル側で正規データを表示）。
3. **アスペクト比は PNG ごとに維持**し、グリッドは `align-items: start` で高さ差を許容する。
   - 列幅は揃えるが行内で高さは PNG 比に従う。
   - 02–03 系（背の高いカード）と 05–06 系（やや背が低いカード）が混在しても、PNG の歪みを優先しないこと。
4. **選択状態は枠装飾のみで表現**（PNG には触らない）。
   - `.course-card.is-selected` でリング/シャドウ/`outline` を強調。既存 `border-color: var(--pink-600)` を、`outline: 4px solid var(--pink-600); outline-offset: 4px` 等で外側に出す（PNG の角丸に被らないように）。
   - `aria-selected="true"` は既存ロジックを維持。

### 箇所別の実装

#### A. ホーム おすすめコース（`#home-recommended-courses`, `renderCourseButtons` 後半）

- 構造を変更:
  ```html
  <article class="course-card course-card-art-frame">
    <img class="course-card-art" src="..." alt="コース名">
  </article>
  ```
- CSS:
  - `.course-card-art-frame` は `display: flex; padding: 8px; background: #fff` の薄い額縁のみ。
  - `.course-card-art { width: 100%; height: auto; display: block; object-fit: contain; }`
  - 3 枚横並びのコンテナ（既存 `.recommended-courses`）は `grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 14px` に。

#### B. マップ一覧（`#course-grid`, `renderCourseGrid`）

- 構造を変更:
  ```html
  <button class="course-card map-card course-card-art-frame" data-course-id="...">
    <img class="course-card-art" src="..." alt="コース名">
  </button>
  ```
- 既存の `min-height: 252px` を撤去、`align-items: start` に。
- 列数は 1440px で 3 列、720px 未満で 2 列、375px で 1 列を維持（既存ブレークポイントに合わせる）。
- `course.implementationStatus === "thumbnail_only"` の場合のラベル「詳細未確定」は、カード PNG の右上角に小さい `.status-pill` を**重ねず**、カード外（下）に独立行で表示する（重ねるとアセット上の文字問題が再発するため）。

#### C. ルーム作成のコースピッカー（`#course-picker`, `renderCourseButtons` 前半）

- `.mini-course` は現状 `mini-course-thumb` + テキストの構成。これも `<img>` 1 枚＋外枠のみに揃える。
- 横並びで 4 枚なので、`flex-wrap: wrap; gap: 10px;` で 1 枚あたり最大幅 130px 程度。`<img>` は `width: 100%; height: auto;`。
- 選択時に枠 ring を出すだけにし、コース番号・名前・★ は隣の `.course-detail` 側で見せる。

#### D. 詳細パネル（`.course-detail`, `.map-detail`）

- ここに **動的データ**（選択コースの `course.recommendedLaps`, `formatExpectedTime(...)`, `course.records.bestTimeMs`, `course.tags`）を集約。
- 既存の `theme-badge-art` + `mini-map-art` + 説明文の 3 カラム構成は維持して可。
- ただし `.mini-map-art` も同様に PNG の中央クロップで歪むため、ここでも **コースカード PNG を `<img>` で表示**するか、`background-size: contain; background-position: center; background-color: #fff` に切り替える。
- ready / result 画面の `.mini-map-art.small`, `.course-info-card` 内のサムネにも同じ方針を適用。

#### E. メニュー右側の `track-preview`（コースステージ）

- ここは「カード PNG を背景に course-parts を重ねたショーケース」として既に成立しているため、構造は維持。
- ただし `--stage-course-image` を cover で敷くと PNG 内のテキスト（名前・ラップ数等）が背景として見え二重感が出るため、**`background-image` から `--stage-course-image` を外し、`--theme-panorama` のみに**する。背景はあくまで「ステージ」、コースカードはカード表示側で見せる責務分担。

### app.js の変更点

- `renderCourseButtons` 内のテンプレートリテラルを以下のように簡素化:
  - mini-course: `<img class="mini-course-art" src="${course.previewAsset}" alt="${course.name}">`
  - recommended: `<img class="course-card-art" src="${course.previewAsset}" alt="${course.name}">`
- `renderCourseGrid` 内のテンプレートも同様に画像 1 枚に。
- `coursePartStrip(course)` の出力先は **カード内ではなく**、必要なら詳細パネル下部のデコレーション枠に移すか撤去する（コース部品はステージで見せるため重複しがち）。
- `--card-course-image` CSS 変数は不要になる場合、設定箇所を整理。
- `course.themeAssets.badge` をカード上に重ねる `course-card-badge` も廃止（PNG 内にコース番号が入っているため）。

### styles.css の変更点

- 削除/縮小:
  - `.course-thumb { height: 112px; background-image: var(--card-course-image) ... }` の高さ固定
  - `.mini-course-thumb` の高さ固定・cover 設定
  - `.course-card span`（タグ風ラベル）/ `.course-card strong` / `.course-card small` / `.course-card em` の文字スタイル
  - `.course-card-badge` のオーバーレイ配置
- 追加:
  - `.course-card-art-frame`: 枠（白背景 + 角丸 + 影）のみ
  - `.course-card-art`, `.mini-course-art`: `width: 100%; height: auto; display: block;`
  - 選択強調 `.course-card.is-selected, .mini-course.is-selected { outline: 4px solid var(--pink-600); outline-offset: 4px; }`
- レイアウト:
  - `.course-grid { align-items: start; }`
  - `.recommended-courses { align-items: start; }`
  - `.course-picker { align-items: start; flex-wrap: wrap; }`

### 段階手順

1. `coursePartStrip` 出力の整理と `--card-course-image` の依存箇所棚卸し。
2. ホームの recommended cards を `<img>` ベースに置換 → 1440 / 375 で目視確認。
3. マップグリッドを `<img>` ベースに置換 → 1440 / 375 で目視確認。
4. ルームの course-picker を `<img>` ベースに置換。
5. 詳細パネル / mini-map-art / ready / result のサムネ表示を contain 方針に統一。
6. track-preview から `--stage-course-image` を外し背景二重を解消。
7. 動的データ（ラップ・タイム・記録）が詳細パネル側で正しく表示されているか再確認。
8. headless Chrome でスクショ取得 → `.workspace/ChatGPT Image *.png` と並べて差分目視。

### 想定 NG パターン（避けること）

- カード PNG を `background-size: cover` で枠内にクロップして表示する。
- カード PNG の上に同じ情報（コース名・★・説明）を HTML で重ねる。
- PNG ごとの縦横比違いを `aspect-ratio` 固定で潰す（必ず一部の PNG が歪む）。
- 動的データを PNG 上に重ねて「PNG 内の値と HTML 値が並んで矛盾」を起こす。

## 受け入れ条件

- [ ] `.workspace/ChatGPT Image 2026年5月16日 14_30_*.png` の参照イメージと、`tasks/todo` 対応後の `home`, `map`, `room`, `ready`, `result` 画面のスクショを並べた際に、明らかな文字二重・PNG 歪みが解消されている。
- [ ] コースカード PNG が縦横比を保ったまま 1 枚カードとして表示されている（recommended/map/picker の 3 箇所すべて）。
- [ ] PNG 内に日本語ラベルが含まれるボタンで、HTML 側のテキストは accessible name（sr-only）として残しつつ、視覚的には PNG だけが見えている。
- [ ] カート、バッジ、ロゴ、メダル等の装飾画像で歪みが目視できない（縦横比逸脱なし）。
- [ ] 1440px / 375px の両幅で、主要画面に横スクロール・要素はみ出し・テキスト重なりがない。
- [ ] 既存のボタン操作、コース選択、レース開始→ゴール→結果の導線が壊れていない。
- [ ] 未対応のオンライン/ランキング表示は引き続き「準備中」表記で偽装していない。
- [ ] PR コメントに受け入れ条件確認とセルフレビューを日本語で残している。

## 検証計画

- `git diff --check`: pass を確認。
- 静的版実装時点では `node --check app/web/app.js`: pass を確認。
- 静的版実装時点ではローカル静的配信（例: `python3 -m http.server 8027`）+ headless Chrome で以下を確認。
  - 1440px: menu / room / map / ready / result のスクショ取得
  - 375px: menu / map / room のスクショ取得
  - 参照画像と並べて二重テキスト・歪みがないか目視確認
- 主要導線手動操作（メニュー → ルーム作成 → コース選択 → ready → race → result）を確認。

## 2026-05-17 PR #10 競合解消追記

- `origin/main` 側で `app/web` が Vite + React + TypeScript へ移行済みだったため、旧 `app/web/app.js` は削除側を採用した。
- `CourseCard.tsx` / `MiniCourseButton.tsx` へカード PNG 主体の表示を移植し、PNG に含まれる情報と重複する可視 HTML テキストを出さない構成にした。
- `MegaButton.tsx` と `styles.css` を React の DOM 構造に合わせ、PNG ラベル付きボタンでは accessible name を維持しつつ可視テキストを隠すよう調整した。
- `?screen=ready` / `?screen=result` の直リンク確認を React 側へ移植した。
- 追加検証:
  - `git diff --cached --check`: pass
  - `npm ci --prefix app/web`: pass
  - `npm --prefix app/web run build`: pass（初回は依存未インストールのため `tsc: not found`、依存インストール後に再実行）
  - headless Chrome: `map` 1440px / 375px、`result` 1440px のスクリーンショット生成 pass（保存用に JPEG 化）
- 追加レポート: `reports/working/20260517-0026-pr10-conflict-resolution.md`

## ドキュメントメンテナンス計画

- `docs/ui-spec-asset-pack-v2-ui.md` の Asset Mapping / Acceptance Checklist に、PNG 焼き込みテキストの取り扱い方針（sr-only 化、二重表示禁止、縦横比維持）を追記する。
- README や API ドキュメントの変更は不要見込み。理由は作業レポートに記録する。

## リスク

- カード PNG をそのまま表示すると、現在 CSS で重ねている `★` 数や `ラップ数` などの「動的データ」と PNG 内固定値が不一致になる可能性がある。動的値は PNG の外側（例: 詳細パネル）で表示し、カード自体は静的な看板として割り切る方針で進める。
- ボタンの sr-only 化を進めすぎると、PNG 内テキストが読み取れない場合のフォールバックが弱くなる。`aria-label` は必ず維持する。
- 縦長カード化により map グリッドの行高が増え、1440px / 375px で縦スクロール量が増える可能性がある。受け入れ条件の幅で再確認する。

## PR / 完了記録

- PR: https://github.com/tsuji-tomonori/biribiri-racers/pull/10
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/10#issuecomment-4467216936
- セルフレビューコメント: https://github.com/tsuji-tomonori/biribiri-racers/pull/10#issuecomment-4467219251
- GitHub Apps 操作: PR 作成・コメントとも 403 `Resource not accessible by integration` のため `gh` フォールバック

## 実装結果メモ

- `renderCourseButtons` / `renderCourseGrid` の course card 表示を `<img>` 1 枚中心に変更し、カード内のコース名・説明・★などの重複 HTML 表示を削除した。
- PNG ラベル付き `mega-button` は、視覚表示を PNG に寄せ、HTML テキストと icon を sr-only / 非表示化して accessible name として残した。無地素材の `force-start` は可視テキストを維持した。
- `notice-icon`, `stage-logo`, `stage-kart`, `winner-banner-art`, `medal`, `theme-badge-art` 等に `height: auto` / `object-fit: contain` / aspect ratio を補強した。
- `winner_banner.png` と `.winner-en` の二重表示を解消し、結果画面のコース詳細サムネと本文が重ならないようにした。
- `?screen=ready` / `?screen=result` で直接プレビューできるようにし、README の確認用 URL 説明も更新した。
- `docs/ui-spec-asset-pack-v2-ui.md` に、焼き込みテキスト入り PNG の扱いとスケール維持ルールを追記した。

## 検証結果

- `git diff --check`: pass
- `node --check app/web/app.js`: pass
- `curl -I http://127.0.0.1:8027/`: pass (`HTTP/1.0 200 OK`)
- Chrome headless screenshot: pass（commit hook の 500KB 制限に合わせて JPEG 化）
  - `reports/working/visual-qa-ui-asset-overlap-scale/menu-1440.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/menu-375.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/room-1440.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/room-375.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/map-1440.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/map-375.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/ready-1440.jpg`
  - `reports/working/visual-qa-ui-asset-overlap-scale/result-1440.jpg`
- Chrome CDP flow check: pass
  - `room -> ready -> game -> result` の active screen 遷移を確認
  - 375px viewport で `documentElement.scrollWidth <= window.innerWidth` を確認
