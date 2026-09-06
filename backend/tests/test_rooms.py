from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.models import Command, Enter
from app.core.rooms import RoomError, Rooms
from app.integrations.deps import service
from app.integrations.store import MemoryStore
from app.main import create_app


class Clock:
    value = 1000000

    def __call__(self) -> int:
        return self.value


def cmd(kind: str, **values: object) -> Command:
    return Command.model_validate({"type": kind, "requestId": str(uuid4()), **values})


def test_ten_players() -> None:
    api = Rooms(MemoryStore())
    room, host = api.create(Enter(name="host", color=0))

    def join(i: int) -> bool:
        try:
            api.join(room.code, Enter(name=f"p{i}", color=i % 4))
            return True
        except RoomError as e:
            assert e.status == 409
            return False

    with ThreadPoolExecutor(max_workers=12) as pool:
        assert sum(pool.map(join, range(12))) == 9
    room = api.read(room.code, host.token)
    assert len(room.players) == 10
    assert len({p.slot for p in room.players}) == 10
    assert "tokenHash" not in room.model_dump_json()
    assert host.token not in room.model_dump_json()


def test_ranking_and_gp() -> None:
    api = Rooms(MemoryStore())
    room, host = api.create(Enter(name="host", color=0, mode="grand-prix"))
    _, b = api.join(room.code, Enter(name="b", color=1))
    _, c = api.join(room.code, Enter(name="c", color=2))
    for credential in (host, b, c):
        api.command(room.code, credential.token, cmd("ready", ready=True))
    with pytest.raises(RoomError):
        api.command(room.code, b.token, cmd("start"))
    start = cmd("start")
    room = api.command(room.code, host.token, start)
    assert api.command(room.code, host.token, start).raceId == room.raceId
    room = api.command(room.code, b.token, cmd("leave"))
    assert room.phase == "racing"
    room = api.command(room.code, c.token, cmd("leave"))
    assert room.phase == "results"
    assert [s.rank for s in room.standings] == [1, 2, 3]
    assert room.standings[0].playerId == host.playerId
    assert room.players[0].score == 15
    room = api.command(room.code, host.token, cmd("next"))
    assert room.course == 1
    with pytest.raises(RoomError):
        api.join(room.code, Enter(name="late", color=0))


def test_expiry_reconnect() -> None:
    clock = Clock()
    api = Rooms(MemoryStore(), clock)
    room, host = api.create(Enter(name="host", color=0))
    _, guest = api.join(room.code, Enter(name="guest", color=1))
    clock.value += 25000
    api.command(room.code, guest.token, cmd("heartbeat"))
    clock.value += 6000
    room = api.command(room.code, guest.token, cmd("heartbeat"))
    assert room.hostId == guest.playerId
    with pytest.raises(RoomError):
        api.read(room.code, host.token)
    clock.value += 14400000
    with pytest.raises(RoomError) as error:
        api.read(room.code, guest.token)
    assert error.value.status == 410


def test_api() -> None:
    app = create_app()
    rooms = Rooms(MemoryStore())
    app.dependency_overrides[service] = lambda: rooms
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
        response = client.post("/api/rooms", json={"name": "host", "color": 0}).json()
        code = response["room"]["code"]
        token = response["credentials"]["token"]
        assert client.get(f"/api/rooms/{code}").status_code == 403
        assert (
            client.get(
                f"/api/rooms/{code}", headers={"Authorization": f"Bearer {token}"}
            ).status_code
            == 200
        )
        assert client.post("/api/rooms", json={"name": "", "color": 0}).status_code == 422
        for _ in range(5):
            assert client.post("/api/rooms", json={"name": "host", "color": 0}).status_code == 200
        assert client.post("/api/rooms", json={"name": "host", "color": 0}).status_code == 429
