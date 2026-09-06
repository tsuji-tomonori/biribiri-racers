"""Explicit development server using the real application and room authorization."""

import asyncio
import base64
import json

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

from app.authorizer import Context, Event, authorized
from app.core.models import Connection
from app.core.rooms import Rooms, view
from app.integrations.deps import connection, service
from app.integrations.store import MemoryStore
from app.main import create_app

store = MemoryStore()
rooms = Rooms(store)
app = create_app()
app.dependency_overrides[service] = lambda: rooms
app.dependency_overrides[connection] = lambda: Connection(
    websocketUrl="ws://127.0.0.1:4322/event/realtime", httpHost="localhost"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:4321"],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class Message(BaseModel):
    type: str
    id: str = ""
    channel: str = ""
    authorization: dict[str, str] = Field(default_factory=dict[str, str])


async def socket(ws: WebSocket) -> None:
    protocols = ws.headers.get("sec-websocket-protocol", "").split(",")
    encoded = next((s.strip()[7:] for s in protocols if s.strip().startswith("header-")), "")
    try:
        headers = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        token = str(headers.get("Authorization", ""))
        event = Event(authorizationToken=token, requestContext=Context(operation="EVENT_CONNECT"))
        if not authorized(event, rooms):
            await ws.close(code=4403)
            return
    except (ValueError, ValidationError):
        await ws.close(code=4403)
        return
    await ws.accept(subprotocol="aws-appsync-event-ws")
    subscription = ""
    version = -1
    try:
        while True:
            try:
                message = Message.model_validate(
                    await asyncio.wait_for(ws.receive_json(), timeout=0.1)
                )
                if message.type == "connection_init":
                    await ws.send_json({"type": "connection_ack", "connectionTimeoutMs": 30000})
                elif message.type == "subscribe":
                    e = Event(
                        authorizationToken=message.authorization.get("Authorization", ""),
                        requestContext=Context(
                            operation="EVENT_SUBSCRIBE", channel=message.channel
                        ),
                    )
                    if not authorized(e, rooms):
                        await ws.send_json({"type": "subscribe_error", "id": message.id})
                        continue
                    subscription = message.id
                    await ws.send_json({"type": "subscribe_success", "id": subscription})
            except TimeoutError:
                pass
            if subscription:
                room = store.get(token.split(":")[0])
                if room and room.version != version:
                    version = room.version
                    await ws.send_json(
                        {"type": "data", "id": subscription, "event": view(room).model_dump_json()}
                    )
    except WebSocketDisconnect:
        return


app.websocket("/event/realtime")(socket)
