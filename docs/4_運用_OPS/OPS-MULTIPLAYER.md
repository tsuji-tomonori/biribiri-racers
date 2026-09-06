# 匿名対戦の開発・検証・配備
種別: OPS / 更新: 2026-09-06 / 要件: BR-AWS-001, BR-DOC-001

## ローカル
Node 24、Python 3.12.13、uv 0.11.33を使用する。

```bash
npm ci
uv sync --project backend --locked --python 3.12.13
npm run dev:api
# 別ターミナル
PUBLIC_API_BASE=http://127.0.0.1:4322/api npm run dev
```

`app.local`は明示的なローカル開発専用のメモリストアとAppSync互換配信を使う。実際のAPIで部屋を作るため架空参加者は表示しない。本番 `app.main.handler` はROOMS_TABLE必須、DynamoDB障害時にメモリへ切り替えない。API未設定の静的buildではオンライン操作時に未設定と表示する。

## 生成と検査
```bash
python tools/quintflow.py setup
python tools/portable_python.py setup
npm run data:generate
npm run test:physics-parity
npm run infra:synth
npm run docs:generate
npm run docs:check
uv run --project backend app-archlint
uv run --project backend ruff check backend
uv run --project backend pyright --project backend/pyproject.toml
uv run --project backend mypy --config-file backend/pyproject.toml backend/src backend/tests
uv run --project backend pytest backend/tests
npm run check
npm run test:coverage
PUBLIC_API_BASE=http://127.0.0.1:4322/api npm run build
npx playwright install chromium
npm run test:online
```

要件正本は `spec/requirements/requirements.qnt`。JSON・Markdown・REQファイルは生成物。APIの追加はoperation単位のrouter/functions/schemas/samples/contractを揃え、`spec/trace/api.json`を実在テストへ対応させる。インフラ変更時は `spec/trace/cdk.json` をレビューして更新する。要件対応をsynthから自動的に推測しない。FastAPI docsは本番公開せず、CI artifactのOpenAPI JSONを利用する。

## AWS配備（この作業では未実行）
東京リージョン。対象アカウントを確認し、必要なCDK bootstrapを済ませた環境で差分をレビューして配備する。デプロイ用のCI権限やアクセスキーをリポジトリに含めない。

```bash
npm run infra:synth
npx cdk diff
npx cdk deploy --outputs-file .build/outputs.json
npm run build:aws
# outputs.json の FrontendBucket と DistributionId を使用する。
aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET/ --exclude index.html --cache-control 'public,max-age=3600'
aws s3 cp dist/index.html s3://YOUR_FRONTEND_BUCKET/index.html --cache-control 'no-cache'
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths '/*'
```

CDKは静的S3バケットまで構築する。成果物のuploadは上記の明示的な配備工程で行う。DynamoDBは削除保護・PITR・RETAIN、S3もRETAIN。復旧は既知のコミットからLambdaと静的buildを再配備し、破壊的なtable削除をしない。FailedEventsキュー、ApiErrorAlarm、DynamoDB throttle、Lambda duration/concurrency、AppSync配信エラーを確認する。DLQの内容はStream再処理情報でありroom tokenではない。停止期間がStreams保持時間を超えた場合はAPI readで最新状態を再取得する。

リリース前に実AWSでCloudFront WebSocket upgrade・IAM配信・切断再接続・10人同時入力の遅延と消費容量を計測する。ローカル互換serverのテストはAWS経路の配備確認を代替しない。
