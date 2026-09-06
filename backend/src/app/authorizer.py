from pydantic import BaseModel, ValidationError

from app.core.rooms import RoomError, Rooms, auth
from app.integrations.deps import service


class Context(BaseModel):
    operation: str
    channel: str | None = None


class Event(BaseModel):
    authorizationToken: str
    requestContext: Context


def authorized(event: Event, rooms: Rooms) -> bool:
    parts = event.authorizationToken.split(":")
    if len(parts) != 2:
        return False
    code, token = parts
    if event.requestContext.operation not in ("EVENT_CONNECT", "EVENT_SUBSCRIBE"):
        return False
    if (
        event.requestContext.operation == "EVENT_SUBSCRIBE"
        and event.requestContext.channel != f"/rooms/{code}"
    ):
        return False
    try:
        auth(rooms.get(code), token)
    except RoomError:
        return False
    return True


def handler(event: object, context: object) -> dict[str, bool | int]:
    try:
        allowed = authorized(Event.model_validate(event), service())
    except ValidationError:
        allowed = False
    return {"isAuthorized": allowed, "ttlOverride": 0}
