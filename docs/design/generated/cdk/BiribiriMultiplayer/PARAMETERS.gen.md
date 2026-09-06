<!-- AUTO-GENERATED. DO NOT EDIT DIRECTLY.
Generate: `python tools/portable_python.py run <host-skill-path>/scripts/designflow.py -- cdk --template <template.yaml> --requirements <requirements.json> --trace <trace.json> --test-root <test-root> --out <output>`
Check: `python tools/portable_python.py run <host-skill-path>/scripts/designflow.py -- cdk --template <template.yaml> --requirements <requirements.json> --trace <trace.json> --test-root <test-root> --out <output> --check`
-->

# CloudFormation parameters

| Name | Type | Default | Allowed values | Description |
|---|---|---|---|---|
| `BootstrapVersion` | `AWS::SSM::Parameter::Value<String>` | /cdk-bootstrap/hnb659fds/version | - | Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip] |
