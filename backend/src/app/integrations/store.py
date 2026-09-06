from threading import Lock
from typing import Protocol

from app.core.models import Room


class Store(Protocol):
    def get(self, code: str) -> Room | None: ...
    def put(self, room: Room, version: int | None) -> bool: ...
    def limit(self, ip: str, action: str, maximum: int, now: int) -> bool: ...


class MemoryStore:
    """Explicit local/test adapter. Never selected by deployed dependencies."""

    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}
        self.counts: dict[str, int] = {}
        self.lock = Lock()

    def get(self, code: str) -> Room | None:
        with self.lock:
            r = self.rooms.get(code)
            return r.model_copy(deep=True) if r else None

    def put(self, room: Room, version: int | None) -> bool:
        with self.lock:
            current = self.rooms.get(room.code)
            if (current.version if current else None) != version:
                return False
            self.rooms[room.code] = room.model_copy(deep=True)
            return True

    def limit(self, ip: str, action: str, maximum: int, now: int) -> bool:
        with self.lock:
            key = f"{ip}:{action}:{now // 60000}"
            self.counts[key] = self.counts.get(key, 0) + 1
            return self.counts[key] <= maximum
