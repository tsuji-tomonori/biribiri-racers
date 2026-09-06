from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MAX_PLAYERS = 10
POINTS = (15, 12, 10, 8, 6, 5, 4, 3, 2, 1)


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Input(Model):
    steer: float = Field(ge=-1, le=1, allow_inf_nan=False)
    push: bool
    assist: bool


class Frame(Model):
    input: Input
    ticks: int = Field(ge=1, le=120)


class Racer(Model):
    id: int
    color: int
    cpu: bool = False
    name: str
    x: float = 0
    y: float = 0
    heading: float = 0
    vx: float = 0
    vy: float = 0
    speed: float = 0
    charge: float = 0
    boost: float = 0
    pushing: bool = False
    gate: int = 0
    progress: float = 0
    hits: int = 0
    respawn: float = 0
    shock: float = 0
    finish: float | None = None
    dashCount: int = 0
    travel: float = 0
    winding: float = 0


class Player(Model):
    id: str
    name: str
    color: int
    slot: int
    tokenHash: str
    ready: bool = False
    active: bool = True
    score: int = 0
    lastSeen: int
    seq: int = 0
    ticks: int = 0
    racer: Racer | None = None


class Standing(Model):
    playerId: str
    name: str
    rank: int
    points: int
    outcome: Literal["finish", "last", "dnf"]


class Room(Model):
    code: str
    version: int = 0
    ttl: int
    hostId: str
    mode: Literal["free", "grand-prix"]
    course: int
    phase: Literal["lobby", "racing", "results", "complete"] = "lobby"
    players: list[Player]
    roster: list[str] = Field(default_factory=list[str])
    raceId: str = ""
    startAt: int = 0
    serverTime: int
    round: int = 0
    standings: list[Standing] = Field(default_factory=list[Standing])
    history: list[list[Standing]] = Field(default_factory=list[list[Standing]])
    requests: list[str] = Field(default_factory=list[str])


class Enter(Model):
    name: str = Field(min_length=1, max_length=16, pattern=r"^[^\x00-\x1f\x7f]+$")
    color: int = Field(ge=0, le=3)
    mode: Literal["free", "grand-prix"] = "free"
    course: int = Field(default=0, ge=0)


class Command(Model):
    type: Literal["ready", "start", "next", "settings", "leave", "heartbeat", "input"]
    requestId: str = Field(min_length=16, max_length=64, pattern=r"^[a-zA-Z0-9-]+$")
    ready: bool = False
    mode: Literal["free", "grand-prix"] = "free"
    course: int = Field(default=0, ge=0)
    raceId: str = ""
    seq: int = Field(default=0, ge=0, le=9007199254740991)
    frames: list[Frame] = Field(default_factory=list[Frame], max_length=120)


class Credentials(Model):
    code: str
    playerId: str
    token: str


class PublicPlayer(Model):
    id: str
    name: str
    color: int
    slot: int
    active: bool
    ready: bool
    score: int
    seq: int
    ticks: int
    racer: Racer | None


class View(Model):
    code: str
    version: int
    hostId: str
    mode: Literal["free", "grand-prix"]
    course: int
    phase: Literal["lobby", "racing", "results", "complete"]
    players: list[PublicPlayer]
    raceId: str
    startAt: int
    serverTime: int
    round: int
    standings: list[Standing]
    history: list[list[Standing]]


class Connection(Model):
    websocketUrl: str
    httpHost: str


class Response(Model):
    room: View
    credentials: Credentials | None = None


class Error(Model):
    detail: str
