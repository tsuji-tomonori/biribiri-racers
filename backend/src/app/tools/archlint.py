"""Check operation ownership and prevent SDK access in routes/domain code."""

import ast
from pathlib import Path

ROOT = Path(__file__).parents[1]


def check() -> None:
    for path in ROOT.rglob("*.py"):
        tree = ast.parse(path.read_text(), filename=str(path))
        if "apis" in path.parts or "core" in path.parts:
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    modules = [a.name for a in node.names]
                elif isinstance(node, ast.ImportFrom):
                    modules = [node.module or ""]
                else:
                    continue
                if any(m.split(".")[0] in ("boto3", "botocore") for m in modules):
                    raise ValueError(f"SDK boundary: {path}:{node.lineno}")
    for path in (ROOT / "apis").rglob("router.py"):
        for name in ("functions.py", "schemas.py", "samples.py", "contract.py"):
            if not (path.parent / name).is_file():
                raise ValueError(f"Missing operation artifact: {path.parent / name}")
        tree = ast.parse(path.read_text())
        functions = [n for n in tree.body if isinstance(n, ast.FunctionDef)]
        if len(functions) != 1 or not isinstance(functions[0].body[-1], ast.Return):
            raise ValueError(f"Route must directly return an operation: {path}")


def main() -> None:
    check()
    print("Architecture checks passed")
