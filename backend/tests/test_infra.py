import json
from pathlib import Path


def test_serverless_template() -> None:
    template = json.loads(Path("cdk.out/BiribiriMultiplayer.template.json").read_text())
    resources = list(template["Resources"].values())
    types = {r["Type"] for r in resources}
    assert {
        "AWS::CloudFront::Distribution",
        "AWS::S3::Bucket",
        "AWS::ApiGatewayV2::Api",
        "AWS::Lambda::Function",
        "AWS::DynamoDB::Table",
        "AWS::AppSync::Api",
    } <= types
    assert not any("RDS" in t or "EC2" in t or "ElastiCache" in t for t in types)
    tables = [r for r in resources if r["Type"] == "AWS::DynamoDB::Table"]
    assert len(tables) == 1
    assert tables[0]["Properties"]["BillingMode"] == "PAY_PER_REQUEST"
    assert tables[0]["Properties"]["DeletionProtectionEnabled"]
    assert tables[0]["Properties"]["StreamSpecification"]["StreamViewType"] == "NEW_IMAGE"
    event = next(
        r["Properties"]["EventConfig"] for r in resources if r["Type"] == "AWS::AppSync::Api"
    )
    assert event["DefaultPublishAuthModes"] == [{"AuthType": "AWS_IAM"}]
    assert event["DefaultSubscribeAuthModes"] == [{"AuthType": "AWS_LAMBDA"}]
    distribution = next(
        r["Properties"]["DistributionConfig"]
        for r in resources
        if r["Type"] == "AWS::CloudFront::Distribution"
    )
    assert {b["PathPattern"] for b in distribution["CacheBehaviors"]} == {
        "/api/*",
        "/event",
        "/event/realtime",
    }
    assert all(r["Metadata"]["RequirementIds"] == ["BR-AWS-001"] for r in resources)
    for r in resources:
        if r["Type"] == "AWS::S3::Bucket":
            assert all(r["Properties"]["PublicAccessBlockConfiguration"].values())
        if r["Type"] == "AWS::Lambda::Function":
            assert r["Properties"]["Runtime"] == "python3.12"
            assert r["Properties"]["ReservedConcurrentExecutions"] <= 50
