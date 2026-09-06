"""Project-owned deterministic FastAPI/DynamoDB adapter; SQL is not applicable."""

import ast
import hashlib
import json
import sys
from pathlib import Path
from typing import cast

from app.main import create_app
from app.tools.archlint import check as architecture_check

ROOT = Path(__file__).parents[4]
OUT = ROOT / "docs/design/generated/fastapi"


def render(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def generate() -> dict[str, str]:
    architecture_check()
    source = ROOT / "backend/src/app"
    schema = create_app().openapi()
    operations: list[dict[str, object]] = []
    rows = [
        "# FastAPI implementation design",
        "",
        "AUTO-GENERATED. DO NOT EDIT.",
        "",
        "| Method | Path | Operation | Access | Requirements |",
        "|---|---|---|---|---|",
    ]
    for path in sorted((source / "apis").rglob("contract.py")):
        tree = ast.parse(path.read_text())
        assignment = tree.body[0]
        if not isinstance(assignment, ast.Assign):
            raise ValueError(f"Literal contract required: {path}")
        contract = cast(dict[str, object], ast.literal_eval(assignment.value))
        route = schema["paths"][str(contract["path"])][str(contract["method"]).lower()]
        if (
            route["operationId"] != contract["operation_id"]
            or route["x-requirement-ids"] != contract["requirements"]
        ):
            raise ValueError(f"Contract/OpenAPI mismatch: {path}")
        operation = {**contract, "source": str(path.parent.relative_to(ROOT))}
        operations.append(operation)
        rows.append(
            f"| {contract['method']} | {contract['path']} | {contract['operation_id']} | "
            f"{contract['auth']} | {contract['requirements']} |"
        )
    actual = sum(
        len([m for m in value if m in ("get", "post", "put", "delete", "patch")])
        for value in schema["paths"].values()
    )
    if len(operations) != actual:
        raise ValueError("Unregistered route")
    trace_path = ROOT / "spec/trace/api.json"
    trace = json.loads(trace_path.read_text())
    catalog_path = ROOT / "spec/requirements/requirements.json"
    active = {
        r["id"]
        for r in json.loads(catalog_path.read_text())["requirements"]
        if r["status"] == "active"
    }
    expected = {
        (str(o["operation_id"]), req)
        for o in operations
        for req in cast(list[str], o["requirements"])
    }
    observed: set[tuple[str, str]] = set()
    test_paths: set[Path] = set()
    for link in trace["links"]:
        pair = (link["artifact"]["id"], link["requirement_id"])
        if pair in observed or pair[1] not in active or not link["tests"]:
            raise ValueError("Invalid or duplicate API trace")
        observed.add(pair)
        for node in link["tests"]:
            file, function = node.split("::")
            test = ROOT / file
            if not test.resolve().is_relative_to(ROOT / "backend/tests"):
                raise ValueError("Escaped test path")
            test_paths.add(test)
            if not any(
                isinstance(n, ast.FunctionDef) and n.name == function
                for n in ast.parse(test.read_text()).body
            ):
                raise ValueError(f"Missing trace test: {node}")
    if expected != observed or {r for _, r in expected} != set(trace["applicable_requirement_ids"]):
        raise ValueError("API trace does not cover exactly the declared surface")
    hashes = {
        str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(source.rglob("*"))
        if p.suffix in (".py", ".json") and "__pycache__" not in p.parts
    }
    for dependency in [trace_path, catalog_path, *sorted(test_paths)]:
        hashes[str(dependency.relative_to(ROOT))] = hashlib.sha256(
            dependency.read_bytes()
        ).hexdigest()
    return {
        "trace.gen.json": render(trace),
        "openapi.gen.json": render(schema),
        "operations.gen.json": render(operations),
        "DESIGN.gen.md": "\n".join(rows) + "\n",
        "manifest.gen.json": render(
            {
                "adapter": "biribiri-fastapi-dynamodb-v1",
                "sources": hashes,
                "unsupported_surface": [
                    {
                        "path": "backend/src/app/integrations/dynamo.py",
                        "reason": "No SQL/DDL: see DynamoDB design and tests.",
                        "support_status": "not-applicable-sql",
                    }
                ],
            }
        ),
    }


def main() -> None:
    values = generate()
    check = "--check" in sys.argv
    for name, body in values.items():
        path = OUT / name
        if path.is_symlink() or OUT.is_symlink():
            raise ValueError("Symlink output forbidden")
        if check:
            if not path.is_file() or path.read_text() != body:
                raise ValueError(f"Generated design drift: {path.relative_to(ROOT)}")
        else:
            OUT.mkdir(parents=True, exist_ok=True)
            path.write_text(body)
    print("API design checked" if check else "API design generated")
