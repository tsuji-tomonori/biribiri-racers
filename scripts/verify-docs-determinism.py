"""Prove repeatability and negative drift checks, restoring every probe in finally."""
import hashlib
import subprocess
from pathlib import Path

root = Path('docs/design/generated')

def snapshot() -> dict[str, str]:
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}

commands = [['uv','run','--project','backend','app-docs'], ['bash','scripts/design-cdk.sh']]
for command in commands:
    subprocess.run(command, check=True)
before = snapshot()
for command in commands:
    subprocess.run(command, check=True)
assert snapshot() == before, 'Non-deterministic generation'
for path, command in [(root/'fastapi/openapi.gen.json', commands[0]),
                       (root/'cdk/BiribiriMultiplayer/RESOURCES.gen.md', commands[1])]:
    if not path.is_file():
        raise ValueError(f'Expected generated artifact absent: {path}')
    content = path.read_bytes()
    try:
        path.write_bytes(content + b'\nDRIFT PROBE\n')
        result = subprocess.run([*command, '--check'], capture_output=True, text=True)
        assert result.returncode != 0, 'Drift was accepted'
    finally:
        path.write_bytes(content)
    subprocess.run([*command, '--check'], check=True)
assert snapshot() == before, 'Probe changed generated documents'
print('API/CDK: byte-identical regeneration and drift rejection verified')
