<!-- tools/quintflow.pyによる自動生成。spec/requirements/requirements.qntを編集すること。 -->
# biribiri-racers 要件一覧

- スキーマ版: 1
- カタログ版: 1
- Product(JSON): <code>"biribiri-racers"</code>
- 更新日(JSON): <code>"2026-09-06"</code>
- 正本: `spec/requirements/requirements.qnt`
- 機械可読view: `spec/requirements/requirements.json`

| ID | 版 | 状態 | 種別 | 原子的な義務 | 検証方法 |
|---|---:|---|---|---|---|
| <code>"BR-ROOM-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、ログインなしでルームを作成するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-ROOM-002"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、ルームの同時参加を10人に制限するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-SEC-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、ルームの状態参照を参加者に制限するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-RACE-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、最下位が決定した時点でレースを終了するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-SYNC-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、参加者の入力から計算した位置と接触を同期するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-GP-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、グランプリで全コースを順番に進めるを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-FREE-001"</code> | 1 | 有効 | 機能 | ビリビリレーサーズは、フリー対戦で毎回コースを選べるを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-AWS-001"</code> | 1 | 有効 | 制約 | ビリビリレーサーズは、指定されたフルサーバレス構成をCDKで定義するを**提供する**（<code>"provide"</code>） | automated tests |
| <code>"BR-DOC-001"</code> | 1 | 有効 | 制約 | ビリビリレーサーズは、APIとCDKの設計書を実装から自動生成するを**提供する**（<code>"provide"</code>） | automated tests |

## BR-ROOM-001: ログインなしでルームを作成する

要件ID(JSON): <code>"BR-ROOM-001"</code>
タイトル(JSON): <code>"ログインなしでルームを作成する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"ログインなしでルームを作成する"</code>
ビリビリレーサーズは、ログインなしでルームを作成するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-ROOM-001-AC1"</code> 前提: 参加者が名前を入力する。条件: 作成する。期待結果: 匿名の参加トークンと6文字コードを返す。
  - criterion(JSON Object): <code>{"given":"参加者が名前を入力する","id":"BR-ROOM-001-AC1","then":"匿名の参加トークンと6文字コードを返す","when":"作成する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_api
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_api","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/apis/rooms/create/router.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-ROOM-002: ルームの同時参加を10人に制限する

要件ID(JSON): <code>"BR-ROOM-002"</code>
タイトル(JSON): <code>"ルームの同時参加を10人に制限する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"ルームの同時参加を10人に制限する"</code>
ビリビリレーサーズは、ルームの同時参加を10人に制限するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-ROOM-002-AC1"</code> 前提: 10人が参加済み。条件: 11人目が参加する。期待結果: 409で拒否し10人を超えない。
  - criterion(JSON Object): <code>{"given":"10人が参加済み","id":"BR-ROOM-002-AC1","then":"409で拒否し10人を超えない","when":"11人目が参加する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_ten_players
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_ten_players","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/core/rooms.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-SEC-001: ルームの状態参照を参加者に制限する

要件ID(JSON): <code>"BR-SEC-001"</code>
タイトル(JSON): <code>"ルームの状態参照を参加者に制限する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"ルームの状態参照を参加者に制限する"</code>
ビリビリレーサーズは、ルームの状態参照を参加者に制限するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-SEC-001-AC1"</code> 前提: 異なるルームのトークンがある。条件: 参照または購読する。期待結果: 操作を拒否しトークンを状態配信に含めない。
  - criterion(JSON Object): <code>{"given":"異なるルームのトークンがある","id":"BR-SEC-001-AC1","then":"操作を拒否しトークンを状態配信に含めない","when":"参照または購読する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_api
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_api","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/authorizer.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-RACE-001: 最下位が決定した時点でレースを終了する

要件ID(JSON): <code>"BR-RACE-001"</code>
タイトル(JSON): <code>"最下位が決定した時点でレースを終了する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"最下位が決定した時点でレースを終了する"</code>
ビリビリレーサーズは、最下位が決定した時点でレースを終了するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-RACE-001-AC1"</code> 前提: 未確定が2人。条件: 1人の順位が確定する。期待結果: 残る1人の順位を確定して結果に遷移する。
  - criterion(JSON Object): <code>{"given":"未確定が2人","id":"BR-RACE-001-AC1","then":"残る1人の順位を確定して結果に遷移する","when":"1人の順位が確定する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_ranking_and_gp
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_ranking_and_gp","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/core/rooms.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-SYNC-001: 参加者の入力から計算した位置と接触を同期する

要件ID(JSON): <code>"BR-SYNC-001"</code>
タイトル(JSON): <code>"参加者の入力から計算した位置と接触を同期する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"参加者の入力から計算した位置と接触を同期する"</code>
ビリビリレーサーズは、参加者の入力から計算した位置と接触を同期するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-SYNC-001-AC1"</code> 前提: レース進行中。条件: 入力イベントを送信する。期待結果: サーバー計算した位置と接触回数を全参加者に配信する。
  - criterion(JSON Object): <code>{"given":"レース進行中","id":"BR-SYNC-001-AC1","then":"サーバー計算した位置と接触回数を全参加者に配信する","when":"入力イベントを送信する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_api
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_api","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/publisher.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-GP-001: グランプリで全コースを順番に進める

要件ID(JSON): <code>"BR-GP-001"</code>
タイトル(JSON): <code>"グランプリで全コースを順番に進める"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"グランプリで全コースを順番に進める"</code>
ビリビリレーサーズは、グランプリで全コースを順番に進めるを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-GP-001-AC1"</code> 前提: グランプリが開始される。条件: 各戦の結果が確定する。期待結果: 登録された全コースを順に進めて総合点を確定する。
  - criterion(JSON Object): <code>{"given":"グランプリが開始される","id":"BR-GP-001-AC1","then":"登録された全コースを順に進めて総合点を確定する","when":"各戦の結果が確定する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_ranking_and_gp
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_ranking_and_gp","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/core/rooms.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-FREE-001: フリー対戦で毎回コースを選べる

要件ID(JSON): <code>"BR-FREE-001"</code>
タイトル(JSON): <code>"フリー対戦で毎回コースを選べる"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"フリー対戦で毎回コースを選べる"</code>
ビリビリレーサーズは、フリー対戦で毎回コースを選べるを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `functional`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"functional"</code>

受入条件:
- <code>"BR-FREE-001-AC1"</code> 前提: フリー対戦の待機中。条件: ホストがコースを選ぶ。期待結果: 次のレースに選択コースを使用する。
  - criterion(JSON Object): <code>{"given":"フリー対戦の待機中","id":"BR-FREE-001-AC1","then":"次のレースに選択コースを使用する","when":"ホストがコースを選ぶ"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_rooms.py::test_api
検証(JSON Object): <code>{"evidence":"backend/tests/test_rooms.py::test_api","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/core/rooms.py"]</code>
- テスト: <code>["backend/tests/test_rooms.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-AWS-001: 指定されたフルサーバレス構成をCDKで定義する

要件ID(JSON): <code>"BR-AWS-001"</code>
タイトル(JSON): <code>"指定されたフルサーバレス構成をCDKで定義する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"指定されたフルサーバレス構成をCDKで定義する"</code>
ビリビリレーサーズは、指定されたフルサーバレス構成をCDKで定義するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `constraint`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"product"</code> / category=<code>"nonfunctional"</code>

受入条件:
- <code>"BR-AWS-001-AC1"</code> 前提: AWS構成を生成する。条件: CDK synthを実行する。期待結果: CloudFront・非公開S3・API Gateway・FastAPI Lambda・AppSync・DynamoDBのみのDB構成を生成する。
  - criterion(JSON Object): <code>{"given":"AWS構成を生成する","id":"BR-AWS-001-AC1","then":"CloudFront・非公開S3・API Gateway・FastAPI Lambda・AppSync・DynamoDBのみのDB構成を生成する","when":"CDK synthを実行する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_infra.py::test_serverless_template
検証(JSON Object): <code>{"evidence":"backend/tests/test_infra.py::test_serverless_template","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["infra/app.ts"]</code>
- テスト: <code>["backend/tests/test_infra.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>

## BR-DOC-001: APIとCDKの設計書を実装から自動生成する

要件ID(JSON): <code>"BR-DOC-001"</code>
タイトル(JSON): <code>"APIとCDKの設計書を実装から自動生成する"</code>
主体(JSON): <code>"ビリビリレーサーズ"</code>
対象(JSON): <code>"APIとCDKの設計書を実装から自動生成する"</code>
ビリビリレーサーズは、APIとCDKの設計書を実装から自動生成するを**提供する**。
行為enum: <code>"provide"</code>

根拠: ユーザーが指定した匿名複数人対戦を実現し保守する。
根拠(JSON): <code>"ユーザーが指定した匿名複数人対戦を実現し保守する。"</code>

項目版: 1 / 状態: `active` / 種別: `constraint`
変更識別子: <code>"task:20260906-rebuild-multiplayer"</code>
分類: scope=<code>"project"</code> / category=<code>"nonfunctional"</code>

受入条件:
- <code>"BR-DOC-001-AC1"</code> 前提: 実装を変更する。条件: 設計書生成と差分検査を実行する。期待結果: OpenAPIとsynthの設計書が決定的に生成されドリフトを検出する。
  - criterion(JSON Object): <code>{"given":"実装を変更する","id":"BR-DOC-001-AC1","then":"OpenAPIとsynthの設計書が決定的に生成されドリフトを検出する","when":"設計書生成と差分検査を実行する"}</code>

要求源(JSON List): <code>["conversation:20260906-multiplayer-rebuild"]</code>
検証方法: automated tests
検証証跡: backend/tests/test_design.py::test_generated_documents
検証(JSON Object): <code>{"evidence":"backend/tests/test_design.py::test_generated_documents","method":"automated tests"}</code>
トレース(JSON List、順序保持):
- 設計: <code>[]</code>
- 実装: <code>["backend/src/app/tools/design.py"]</code>
- テスト: <code>["backend/tests/test_design.py"]</code>
- 参照資料: <code>["dev-standard"]</code>
廃止理由: <code>""</code>
後継要件: <code>""</code>
