import json
import math
from pathlib import Path

import pytest

from app.core.models import Input
from app.core.physics import STEP, TRACKS, create, tick


def test_typescript_python_parity() -> None:
    cases = json.loads(Path(".build/physics-trace.json").read_text())
    assert len(cases) == len(TRACKS) * 2
    for case in cases:
        t = TRACKS[int(case["course"])]
        r = create(t, case["slot"], case["slot"] % 4, "player")
        for i in range(1, 1201):
            tick(
                t, r, Input(steer=math.sin(i / 150) * 0.4, push=i % 180 < 50, assist=True), i * STEP
            )
            if i % 60 == 0:
                other = case["snapshots"][i // 60 - 1]
                for key, value in r.model_dump().items():
                    if key == "name":
                        continue
                    if isinstance(value, float):
                        assert value == pytest.approx(other[key], abs=1e-7), (
                            case["course"],
                            i,
                            key,
                        )
                    else:
                        assert value == other[key], (case["course"], i, key)


def test_ten_starts_are_distinct_and_legal() -> None:
    from app.core.physics import on_road

    for track in TRACKS:
        racers = [create(track, i, i % 4, str(i)) for i in range(10)]
        assert len({(r.x, r.y) for r in racers}) == 10
        assert all(on_road(track, r.x, r.y) for r in racers)
