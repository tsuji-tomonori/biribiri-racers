import json
import math
from pathlib import Path

from pydantic import BaseModel, Field

from .models import Input, Racer

STEP = 1 / 120


class Point(BaseModel):
    x: float
    y: float
    s: float = 0
    angle: float = 0
    width: float = 115


class Finish(BaseModel):
    a: tuple[float, float]
    b: tuple[float, float]
    normal: tuple[float, float]


class Gimmick(BaseModel):
    kind: str
    x: float
    y: float
    radius: float
    angle: float = 0


class Track(BaseModel):
    gimmicks: list[Gimmick] = Field(default_factory=list[Gimmick])
    id: int
    name: str
    speed: float
    grip: float
    wallRise: float
    lapAnchor: tuple[float, float]
    length: float
    path: list[Point]
    gates: list[Point]
    outer: list[tuple[float, float]]
    holes: list[list[tuple[float, float]]]
    finish: Finish


class Machine(BaseModel):
    speed: float
    duration: float
    charge: float
    boost: float
    turn: float
    grip: float


class Data(BaseModel):
    tracks: list[Track]
    machines: list[Machine]


data = Data.model_validate(
    json.loads((Path(__file__).parents[1] / "data/game.gen.json").read_text())
)
TRACKS, MACHINES = data.tracks, data.machines


def clamp(v: float, a: float, b: float) -> float:
    return max(a, min(b, v))


def angle(v: float) -> float:
    return math.atan2(math.sin(v), math.cos(v))


def on_road(t: Track, x: float, y: float) -> bool:
    def inside(poly: list[tuple[float, float]]) -> bool:
        hit = False
        for i, a in enumerate(poly):
            b = poly[i - 1]
            if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
                hit = not hit
        return hit

    def clearance(poly: list[tuple[float, float]], rise: float = 0) -> float:
        best = math.inf
        for i, a in enumerate(poly):
            b = poly[(i + 1) % len(poly)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            u = clamp(((x - a[0]) * dx + (y + rise - a[1]) * dy) / (dx * dx + dy * dy or 1), 0, 1)
            best = min(best, math.hypot(x - a[0] - u * dx, y + rise - a[1] - u * dy))
        return best

    return (
        inside(t.outer)
        and clearance(t.outer) >= 30
        and all(not inside(h) and clearance(h, t.wallRise) >= 48 for h in t.holes)
    )


def clear_gimmicks(r: Racer) -> None:
    r.spin = r.floorBoost = 0
    r.wind = False
    r.activeGimmicks = []


def spawn(t: Track, r: Racer) -> None:
    clear_gimmicks(r)
    p = t.path[0]
    back = (r.id // 2) * 24
    lanes = [
        v
        for v in (-25, 25, 0, -50, 50)
        if on_road(
            t,
            p.x - math.sin(p.angle) * v - math.cos(p.angle) * back,
            p.y + math.cos(p.angle) * v - math.sin(p.angle) * back,
        )
    ]
    lateral = lanes[r.id % 2] if len(lanes) > r.id % 2 else (lanes[0] if lanes else 0)
    r.x = p.x - math.sin(p.angle) * lateral - math.cos(p.angle) * back
    r.y = p.y + math.cos(p.angle) * lateral - math.sin(p.angle) * back
    if not on_road(t, r.x, r.y):
        r.x, r.y = p.x, p.y
    r.heading = p.angle
    r.vx = r.vy = r.speed = r.charge = r.boost = r.progress = r.travel = r.winding = 0
    r.pushing = False
    r.gate = 0


def create(t: Track, slot: int, color: int, name: str) -> Racer:
    r = Racer(id=slot, color=color, name=name)
    spawn(t, r)
    return r


def nearest(t: Track, r: Racer) -> Point:
    return min(
        (
            p
            for p in t.path
            if not (r.gate == 0 and p.s > t.length * 0.85)
            and not (r.gate == len(t.gates) and p.s < t.length * 0.15)
        ),
        key=lambda p: (p.x - r.x) ** 2 + (p.y - r.y) ** 2,
    )


def at(t: Track, s: float) -> Point:
    low, high = 0, len(t.path) - 1
    while low < high:
        m = (low + high) // 2
        if t.path[m].s < s:
            low = m + 1
        else:
            high = m
    return t.path[low]


def tick(t: Track, r: Racer, inp: Input, time: float) -> None:
    dt = STEP
    if r.finish is not None:
        return
    if r.shock > 0:
        r.shock = max(0, r.shock - dt)
        if r.shock == 0:
            spawn(t, r)
            r.respawn = 0.75
        return
    if r.respawn > 0:
        r.respawn = max(0, r.respawn - dt)
        return
    r.floorBoost = max(0, r.floorBoost - dt)
    if r.spin > 0:
        r.spin = max(0, r.spin - dt)
        return
    active: list[int] = []
    r.wind = False
    for i, g in enumerate(t.gimmicks):
        if math.hypot(r.x - g.x, r.y - g.y) > g.radius:
            continue
        active.append(i)
        if g.kind == "wind":
            r.wind = True
        if i in r.activeGimmicks:
            continue
        if g.kind == "spin":
            r.spin = 0.8
            r.speed = r.vx = r.vy = r.boost = r.floorBoost = r.charge = 0
            r.pushing = False
        if g.kind == "dash":
            r.floorBoost = 1.1
    r.activeGimmicks = active
    if r.spin > 0:
        return
    m = MACHINES[r.color]
    ox, oy = r.x, r.y
    if not inp.push and r.pushing:
        if r.charge > 0.12:
            r.boost = (0.35 + 1.15 * r.charge) * m.duration
            r.dashCount += 1
        r.charge = 0
    r.pushing = inp.push
    r.boost = max(0, r.boost - dt)
    if inp.push:
        r.charge = clamp(r.charge + dt / m.charge, 0, 1)
        r.boost = r.floorBoost = 0
    target = (
        52
        if inp.push
        else t.speed * m.speed * (m.boost if r.boost > 0 else (1.55 if r.floorBoost > 0 else 1))
    )
    r.speed += (target - r.speed) * (1 - math.exp(-(7 if inp.push else 1.6) * dt))
    turn = (
        inp.steer
        * m.turn
        * (3.45 if inp.push else 2.55)
        * (0.55 + 0.45 * clamp(r.speed / 85, 0, 1))
    )
    if inp.assist:
        q = at(t, nearest(t, r).s + 80)
        error = angle(math.atan2(q.y - r.y, q.x - r.x) - r.heading)
        if abs(error) < 1.2:
            turn += clamp(error * 1.2, -0.82, 0.82) * (1 - abs(inp.steer) * 0.65)
    r.heading = angle(r.heading + turn * dt)
    traction = 1 - math.exp(-(10 if inp.push else t.grip * m.grip) * dt)
    r.vx += (math.cos(r.heading) * r.speed - r.vx) * traction
    r.vy += (math.sin(r.heading) * r.speed - r.vy) * traction
    wind_x = wind_y = 0.0
    for i in r.activeGimmicks:
        g = t.gimmicks[i]
        if g.kind == "wind":
            wind_x += math.cos(g.angle) * 85
            wind_y += math.sin(g.angle) * 85
    r.x += (r.vx + wind_x) * dt
    r.y += (r.vy + wind_y) * dt
    if not on_road(t, r.x, r.y):
        r.hits += 1
        r.x, r.y = ox, oy
        r.speed = r.vx = r.vy = r.charge = r.boost = r.progress = r.travel = r.winding = 0
        r.pushing = False
        r.gate = 0
        clear_gimmicks(r)
        r.shock = 0.3
        return
    if r.gate < len(t.gates):
        gate = t.gates[r.gate]
        tx, ty = math.cos(gate.angle), math.sin(gate.angle)
        if (
            (ox - gate.x) * tx + (oy - gate.y) * ty < 0
            and (r.x - gate.x) * tx + (r.y - gate.y) * ty >= 0
            and math.hypot(r.x - gate.x, r.y - gate.y) < gate.width
        ):
            r.gate += 1
    n = nearest(t, r)
    limit = t.gates[r.gate].s if r.gate < len(t.gates) else t.length
    r.progress = clamp(min(n.s, limit) / t.length, 0, 1)
    r.travel += math.hypot(r.x - ox, r.y - oy)
    ax, ay = t.lapAnchor
    r.winding += angle(math.atan2(r.y - ay, r.x - ax) - math.atan2(oy - ay, ox - ax))
    f = t.finish
    mx, my = (f.a[0] + f.b[0]) / 2, (f.a[1] + f.b[1]) / 2
    before = (ox - mx) * f.normal[0] + (oy - my) * f.normal[1]
    after = (r.x - mx) * f.normal[0] + (r.y - my) * f.normal[1]
    dx, dy = f.b[0] - f.a[0], f.b[1] - f.a[1]
    dot = (r.x - f.a[0]) * dx + (r.y - f.a[1]) * dy
    if (
        r.gate == len(t.gates)
        and r.winding >= math.pi * 2
        and r.travel > t.length * 0.48
        and before < 0 <= after
        and 0 <= dot <= dx * dx + dy * dy
    ):
        r.finish = time - dt - before / (after - before) * dt
        r.progress = 1
        r.speed = r.vx = r.vy = 0
