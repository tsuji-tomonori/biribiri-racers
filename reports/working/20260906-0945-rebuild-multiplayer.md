# 匿名10人対戦の再構築
状態: 完了（実装・検証、AWS配備は対象外） / PR: https://github.com/tsuji-tomonori/biribiri-racers/pull/23

## 指示と範囲
Work環境で前回の未保存実装が失われたため再構築。ログイン不要、最大10人、部屋作成・参加、位置/壁接触のイベント同期、最下位確定時終了、全コースGPと自由選択を対象とする。FastAPI/Mangum、DynamoDB単独DB、AppSync Events、CloudFront/S3/API Gateway、CDK、Dev-standardの要件と自動生成設計書を指定された。

## 実施と判断
最新mainを専用worktreeに取り込み、作業中にマージされたPR #22の3コースも統合。全8コースを対象にした。DynamoDBのversion条件付き更新で最大人数と順位を直列化し、StreamsからAppSyncへ配信する。入力をPythonでも計算し、位置やゴールの直接申告を受け付けない。匿名トークンはハッシュ保存し、配信は参加者のルームに限定する。ログインサービス、Redis、RDSは追加しない。

Dev-standard既定profileを導入。Quintの正本から要件JSON/Markdown/REQ個別ファイルを生成。FastAPIのDynamoDB向けproject adapterと、標準CDK generatorを用意し、operation/resource→要件→実在テストを明示した。APIとCDKの2回生成のbyte一致、意図的なドリフトの拒否、復元後のcheck成功を確認した。CDK CLIのテレメトリー通信は自動承認レビューに拒否されたため、公式CDKのApp.synth()を直接呼ぶローカル生成を使う。検査を迂回せず、生成template bytesの一致を維持する。

## 検証の証拠
- TypeScript/Astro、infra TypeScript、Ruff、Pyright strict、mypy strict、operation境界検査。
- 既存ゲームの単体108件成功。Statements 99.29%、Branches 92.35%、Functions 100%。
- API、同時入室、順位/GP全コース、トークン境界、DynamoDB条件更新、配信payload、ローカルWebSocket、全8コースのTS/Python物理比較を追加。
- 検証対象コードSHA: `782652076442d243206bfb925965a8b326082df3`。以後の差分は本レポートとタスク完了記録のみ。
- [最終オンラインCI](https://github.com/tsuji-tomonori/biribiri-racers/actions/runs/34002755934) 成功。バックエンド13件成功（coverage 89%）。10ブラウザの入室と11人目拒否、375/768/1440pxの操作E2Eは4件成功・2件は重複する10人ケースを意図的にskip。CDK synth、文書check、AWS向けbuildも成功。
- [最終既存ゲームCI](https://github.com/tsuji-tomonori/biribiri-racers/actions/runs/34002755928) 成功。単体108件、E2E39件成功・12件は端末別重複ケースを意図的にskip（全51件、6.2分）。PRなのでdeploy/smokeは実行されない。
- 最終CI artifact `9980021229` の全7枚を取得し、375/768/1440pxの待機室・レース・10人画面を目視確認。全員YOU表示とミニマップ上の退出ボタン重なりを修正し、自車だけのYOU表示と操作配置を確認した。モバイル見出しと既存再走ボタンの文言も修正済み。

## 成果物とfit
ルーム画面と既存レース描画の統合、backend/のoperation構成、infra/app.ts、spec/requirements、spec/trace、docs/design/generated、開発・配備手順を同じPRでレビューできる。実装・文書生成の要求は対応。最終コードの両CIとブラウザ画面を確認し、PRへ受入・セルフレビューコメントを記録して完了判定した。spec-recoveryの新規成果物を作る作業ではないため、validate_spec_recovery.pyは適用しない。今回のQuint正本・trace・生成物にはそれぞれの専用checkを適用した。

## 制約・未実施
AWSアカウント未指定のため、実AWS配備・負荷/遅延/費用測定・CloudFront経由の実WebSocket確認は未実施。mainへのマージはしていない。WorkのFirefoxはページ生成時に停止したため、その試行をブラウザ成功の根拠にしない。CIの固定Playwright/Chromiumで検証する。匿名対戦はカジュアル用途の到着順判定。大規模多数ルーム、悪意ある既存購読の強制失効、競技用遅延補償は本版の対象外でARC文書に明記した。

## セルフレビュー
部屋単位認可、host操作、レスポンスのtoken除外、CASでの10人上限と順位、seq再送、ルーム切替後の遅延配信、レース間再参加、配置・自車表示、既存操作文言を確認した。生成文書は整合性の証拠であり、実AWSの要件充足や負荷性能の証明とはしていない。
