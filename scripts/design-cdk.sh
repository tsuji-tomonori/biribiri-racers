#!/usr/bin/env bash
set -euo pipefail
python tools/portable_python.py run .agents/skills/generate-implementation-design/scripts/designflow.py -- cdk --template cdk.out/BiribiriMultiplayer.template.json --requirements spec/requirements/requirements.json --trace spec/trace/cdk.json --test-root backend/tests --repo-root . --out docs/design/generated/cdk/BiribiriMultiplayer "$@"
