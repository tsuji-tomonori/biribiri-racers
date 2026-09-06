# BR-AWS-001 指定されたフルサーバレス構成をCDKで定義する

種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt

ユーザーが指定した匿名複数人対戦を実現し保守する。

## 受入条件

- BR-AWS-001-AC1: AWS構成を生成する。CDK synthを実行するとき、CloudFront・非公開S3・API Gateway・FastAPI Lambda・AppSync・DynamoDBのみのDB構成を生成する。

検証: `backend/tests/test_infra.py::test_serverless_template`
