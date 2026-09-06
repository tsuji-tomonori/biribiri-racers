import hashlib
import hmac
import secrets
import time
from collections.abc import Callable

from app.integrations.store import Store

from .models import (
    MAX_PLAYERS,
    POINTS,
    Command,
    Credentials,
    Enter,
    Player,
    PublicPlayer,
    Room,
    Standing,
    View,
)
from .physics import STEP, TRACKS, create, tick


class RoomError(Exception):
    def __init__(self, status: int, message: str) -> None:
        self.status, self.message = status, message
        super().__init__(message)


def require(condition: bool, status: int, message: str) -> None:
    if not condition:
        raise RoomError(status, message)


def view(room: Room) -> View:
    values = room.model_dump(include=set(View.model_fields) - {"players"})
    values["players"] = [
        PublicPlayer.model_validate(p.model_dump(include=set(PublicPlayer.model_fields)))
        for p in room.players
    ]
    return View.model_validate(values)


def auth(room: Room, token: str) -> Player:
    hashed = hashlib.sha256(token.encode()).hexdigest()
    for p in room.players:
        if p.active and hmac.compare_digest(p.tokenHash, hashed):
            return p
    raise RoomError(403, "このルームの参加権限がありません。")


def record(room: Room, player: Player, outcome: str) -> None:
    if any(s.playerId == player.id for s in room.standings):
        return
    used = {s.rank for s in room.standings}
    free = [i for i in range(1, len(room.roster) + 1) if i not in used]
    rank = free[-1] if outcome == "dnf" else free[0]
    room.standings.append(
        Standing(
            playerId=player.id,
            name=player.name,
            rank=rank,
            points=0 if outcome == "dnf" else POINTS[rank - 1],
            outcome="dnf" if outcome == "dnf" else ("last" if outcome == "last" else "finish"),
        )
    )


def settle(room: Room) -> None:
    if room.phase != "racing":
        return
    remaining = [
        p
        for p in room.players
        if p.id in room.roster and not any(s.playerId == p.id for s in room.standings)
    ]
    if len(remaining) > 1:
        return
    if remaining:
        record(room, remaining[0], "last")
    room.standings.sort(key=lambda s: s.rank)
    for p in room.players:
        p.score += next((s.points for s in room.standings if s.playerId == p.id), 0)
    room.history.append(room.standings[:])
    room.history = room.history[-len(TRACKS) :] if room.mode == "grand-prix" else room.history[-1:]
    room.phase = (
        "complete" if room.mode == "grand-prix" and room.round == len(TRACKS) else "results"
    )


def reap(room: Room, now: int) -> None:
    for p in room.players:
        if p.active and now - p.lastSeen > 30000:
            p.active = False
            if room.phase == "racing" and p.id in room.roster:
                record(room, p, "dnf")
    if not any(p.active and p.id == room.hostId for p in room.players):
        room.hostId = next((p.id for p in room.players if p.active), "")
    settle(room)


class Rooms:
    def __init__(self, store: Store, clock: Callable[[], int] | None = None) -> None:
        self.store = store
        self.now = clock or (lambda: int(time.time() * 1000))

    def member(self, request: Enter, code: str, slot: int) -> tuple[Player, Credentials]:
        token = secrets.token_urlsafe(32)
        pid = secrets.token_hex(12)
        return Player(
            id=pid,
            name=request.name.strip() or "レーサー",
            color=request.color,
            slot=slot,
            tokenHash=hashlib.sha256(token.encode()).hexdigest(),
            lastSeen=self.now(),
        ), Credentials(code=code, playerId=pid, token=token)

    def create(self, request: Enter) -> tuple[View, Credentials]:
        require(request.course < len(TRACKS), 400, "コースがありません。")
        for _ in range(10):
            code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
            player, credentials = self.member(request, code, 0)
            room = Room(
                code=code,
                ttl=self.now() // 1000 + 14400,
                hostId=player.id,
                mode=request.mode,
                course=0 if request.mode == "grand-prix" else request.course,
                players=[player],
                serverTime=self.now(),
            )
            if self.store.put(room, None):
                return view(room), credentials
        raise RoomError(503, "ルームを作成できませんでした。")

    def get(self, code: str) -> Room:
        room = self.store.get(code)
        require(room is not None, 404, "ルームが見つかりません。")
        if room is None:
            raise RoomError(404, "ルームが見つかりません。")
        require(room.ttl * 1000 > self.now(), 410, "ルームの有効期限が切れました。")
        return room

    def read(self, code: str, token: str) -> View:
        room = self.get(code)
        auth(room, token)
        return view(room)

    def mutate(self, code: str, apply: Callable[[Room], None]) -> View:
        for attempt in range(25):
            room = self.get(code)
            previous = room.version
            apply(room)
            room.version += 1
            room.serverTime = self.now()
            if self.store.put(room, previous):
                return view(room)
            time.sleep(secrets.randbelow(min(100, 5 * (attempt + 1)) + 1) / 1000)
        raise RoomError(503, "更新が混み合っています。再試行してください。")

    def join(self, code: str, request: Enter) -> tuple[View, Credentials]:
        credentials: Credentials | None = None

        def apply(room: Room) -> None:
            nonlocal credentials
            require(
                room.phase in ("lobby", "results") and (room.mode == "free" or room.round == 0),
                409,
                "レース進行中です。",
            )
            reap(room, self.now())
            active = [p for p in room.players if p.active]
            require(len(active) < MAX_PLAYERS, 409, "このルームは満員です。")
            slot = next(i for i in range(MAX_PLAYERS) if not any(p.slot == i for p in active))
            player, credentials = self.member(request, code, slot)
            room.players = [*active, player]
            if not room.hostId:
                room.hostId = player.id
            for p in room.players:
                p.ready = False

        result = self.mutate(code, apply)
        if credentials is None:
            raise RuntimeError("No join credentials")
        return result, credentials

    def command(self, code: str, token: str, command: Command) -> View:
        def apply(room: Room) -> None:
            player = auth(room, token)
            key = player.id + ":" + command.requestId
            if key in room.requests:
                return
            reap(room, self.now())
            require(player.active, 403, "再参加してください。")
            player.lastSeen = self.now()
            if command.type in ("settings", "start", "next"):
                require(player.id == room.hostId, 403, "ホストのみ操作できます。")
            self.apply(room, player, command)
            if command.type not in ("input", "heartbeat"):
                room.requests = [*room.requests, key][-100:]

        return self.mutate(code, apply)

    def apply(self, room: Room, p: Player, c: Command) -> None:
        if c.type == "heartbeat":
            return
        if c.type == "leave":
            p.active = False
            if room.phase == "racing" and p.id in room.roster:
                record(room, p, "dnf")
            reap(room, self.now())
            return
        if c.type in ("ready", "settings", "start"):
            require(room.phase == "lobby", 409, "待機ルームで操作してください。")
        if c.type == "ready":
            p.ready = c.ready
        elif c.type == "settings":
            require(room.mode == "free" or room.round == 0, 409, "GP途中の設定変更はできません。")
            require(c.course < len(TRACKS), 400, "コースがありません。")
            room.mode = c.mode
            room.course = 0 if c.mode == "grand-prix" else c.course
            for member in room.players:
                member.ready = False
        elif c.type == "start":
            active = [a for a in room.players if a.active]
            require(
                len(active) >= 2 and all(a.ready for a in active),
                409,
                "2人以上が準備完了してください。",
            )
            room.players = active
            room.roster = [a.id for a in active]
            room.raceId = secrets.token_hex(12)
            room.startAt = self.now() + 3000
            room.phase = "racing"
            room.round += 1
            room.standings = []
            for a in active:
                a.racer = create(TRACKS[room.course], a.slot, a.color, a.name)
                a.seq = a.ticks = 0
        elif c.type == "next":
            require(room.phase in ("results", "complete"), 409, "結果確定を待ってください。")
            if room.mode == "grand-prix":
                if room.phase == "complete":
                    room.round = room.course = 0
                    room.history = []
                    for a in room.players:
                        a.score = 0
                else:
                    room.course = room.round
            room.phase = "lobby"
            for a in room.players:
                a.ready = False
        elif c.type == "input":
            self.input(room, p, c)

    def input(self, room: Room, p: Player, c: Command) -> None:
        require(c.raceId == room.raceId, 409, "前のレースの入力です。")
        if c.seq <= p.seq:
            return
        require(c.seq == p.seq + 1, 409, "入力の再同期が必要です。")
        count = sum(f.ticks for f in c.frames)
        require(0 < count <= 120, 400, "入力は1秒以内で送信してください。")
        if room.phase != "racing" or any(s.playerId == p.id for s in room.standings):
            return
        require(p.racer is not None and self.now() >= room.startAt, 409, "開始を待ってください。")
        require(
            (p.ticks + count) * STEP * 1000 <= self.now() - room.startAt + 100,
            429,
            "入力が速すぎます。",
        )
        if p.racer is None:
            raise RuntimeError("Missing racer")
        for frame in c.frames:
            for _ in range(frame.ticks):
                p.ticks += 1
                tick(TRACKS[room.course], p.racer, frame.input, p.ticks * STEP)
        p.seq = c.seq
        if p.racer.finish is not None:
            record(room, p, "finish")
        settle(room)
