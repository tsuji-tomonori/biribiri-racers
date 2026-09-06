#!/usr/bin/env bash
set -euo pipefail
mkdir -p .build
# Rebuild only this generated asset directory; stale dependencies must not ship.
python -c "import shutil; shutil.rmtree('.build/lambda', ignore_errors=True)"
uv export --project backend --locked --no-dev --no-emit-project --output-file .build/requirements.txt > /dev/null
uv pip install --python-platform x86_64-manylinux2014 --python-version 3.12 --only-binary :all: --target .build/lambda --requirements .build/requirements.txt
cp -R backend/src/app .build/lambda/app
python - <<'PY'
from pathlib import Path
import shutil
for p in Path('.build/lambda').rglob('__pycache__'):
    shutil.rmtree(p)
PY
