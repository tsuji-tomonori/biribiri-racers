"""Project view adapter: one canonical requirement per SWEBOK-lite file."""
import json
import sys
from pathlib import Path

catalog = json.loads(Path('spec/requirements/requirements.json').read_text())
for requirement in catalog['requirements']:
    folder = Path('docs/1_要求_REQ/11_製品要求_PRODUCT/01_機能要求_FUNCTIONAL')
    if requirement['type'] == 'constraint':
        folder = Path('docs/1_要求_REQ/12_制約_CONSTRAINT')
    path = folder / (requirement['id'] + '.md')
    body = f"# {requirement['id']} {requirement['title']}\n\n種別: REQ / 自動生成 / 正本: spec/requirements/requirements.qnt\n\n{requirement['rationale']}\n\n## 受入条件\n\n"
    for ac in requirement['acceptance_criteria']:
        body += f"- {ac['id']}: {ac['given']}。{ac['when']}とき、{ac['then']}。\n"
    body += f"\n検証: `{requirement['verification']['evidence']}`\n"
    if '--check' in sys.argv:
        if not path.is_file() or path.read_text() != body:
            raise ValueError(f'Requirement page drift: {path}')
    else:
        folder.mkdir(parents=True, exist_ok=True)
        path.write_text(body)
