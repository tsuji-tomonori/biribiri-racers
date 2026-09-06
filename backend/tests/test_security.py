import base64
import json
from typing import cast

import boto3
import pytest
from moto import mock_aws
from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource
from pydantic import ValidationError
from test_rooms import Clock, cmd

from app.authorizer import Context, Event, authorized
from app.core.models import Command, Enter, Frame, Input
from app.core.physics import STEP, TRACKS
from app.core.rooms import RoomError, Rooms, record, settle
from app.integrations.dynamo import DynamoStore, encode
from app.integrations.store import MemoryStore
from app.publisher import Event as StreamEvent
from app.publisher import publish


def test_room_authorization_and_stream() -> None:
    api = Rooms(MemoryStore())
    room, token = api.create(Enter(name="host", color=0))
    for operation, channel, expected in [
        ("EVENT_CONNECT", None, True),
        ("EVENT_SUBSCRIBE", f"/rooms/{room.code}", True),
        ("EVENT_SUBSCRIBE", "/rooms/*", False),
        ("EVENT_SUBSCRIBE", "/rooms/OTHER", False),
        ("EVENT_PUBLISH", f"/rooms/{room.code}", False),
    ]:
        assert (
            authorized(
                Event(
                    authorizationToken=f"{room.code}:{token.token}",
                    requestContext=Context(operation=operation, channel=channel),
                ),
                api,
            )
            == expected
        )
    state = api.get(room.code)
    payload = {
        "Records": [
            {"dynamodb": {"NewImage": {"state": {"B": base64.b64encode(encode(state)).decode()}}}}
        ]
    }
    sent: list[str] = []
    publish(StreamEvent.model_validate(payload), sent.append)
    event = json.loads(sent[0])
    assert event["channel"] == f"/rooms/{room.code}"
    assert len(event["events"]) == 1
    assert "tokenHash" not in sent[0] and token.token not in sent[0]
    api.command(room.code, token.token, cmd("leave"))
    assert not authorized(
        Event(
            authorizationToken=f"{room.code}:{token.token}",
            requestContext=Context(operation="EVENT_CONNECT"),
        ),
        api,
    )


def test_input_boundaries_and_gp_all_courses() -> None:
    clock = Clock()
    store = MemoryStore()
    api = Rooms(store, clock)
    room, host = api.create(Enter(name="host", color=0, mode="grand-prix"))
    _, guest = api.join(room.code, Enter(name="guest", color=1))
    for course in range(len(TRACKS)):
        assert room.course == course
        for c in (host, guest):
            api.command(room.code, c.token, cmd("ready", ready=True))
        room = api.command(room.code, host.token, cmd("start"))
        packet = cmd(
            "input",
            raceId=room.raceId,
            seq=1,
            frames=[Frame(input=Input(steer=0, push=False, assist=True), ticks=120)],
        )
        with pytest.raises(RoomError):
            api.command(room.code, host.token, packet)
        clock.value += 3100
        with pytest.raises(RoomError) as error:
            api.command(room.code, host.token, packet)
        assert error.value.status == 429
        clock.value += 1000
        room = api.command(room.code, host.token, packet)
        assert room.players[0].ticks == 120
        assert api.command(room.code, host.token, packet).players[0].ticks == 120
        with pytest.raises(RoomError):
            api.command(
                room.code,
                host.token,
                cmd(
                    "input",
                    raceId="old",
                    seq=2,
                    frames=[Frame(input=Input(steer=0, push=False, assist=True), ticks=1)],
                ),
            )
        # Domain finish fixture: rank settlement, no client-accessible finish endpoint.
        state = api.get(room.code)
        record(state, state.players[0], "finish")
        settle(state)
        assert store.put(state, state.version)
        room = api.read(room.code, host.token)
        assert [s.rank for s in room.standings] == [1, 2]
        assert room.players[0].score == 15 * (course + 1)
        assert room.phase == ("complete" if course == len(TRACKS) - 1 else "results")
        if course < len(TRACKS) - 1:
            room = api.command(room.code, host.token, cmd("next"))
    room = api.command(room.code, host.token, cmd("next"))
    assert room.course == 0 and room.round == 0 and room.players[0].score == 0
    with pytest.raises(ValidationError):
        Input(steer=float("nan"), push=False, assist=True)
    with pytest.raises(ValidationError):
        Command.model_validate({"type": "input", "requestId": "1234567890123456", "x": 12345})
    assert STEP == 1 / 120


def test_dynamo_conditional_store() -> None:
    with mock_aws():
        resource = cast(
            DynamoDBServiceResource, boto3.resource("dynamodb", region_name="ap-northeast-1")
        )
        table = resource.create_table(
            TableName="rooms",
            KeySchema=[{"AttributeName": "code", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "code", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        store = DynamoStore(table)
        api = Rooms(store)
        room, c = api.create(Enter(name="host", color=0))
        assert api.read(room.code, c.token).code == room.code
        original = api.get(room.code)
        changed = original.model_copy(deep=True)
        changed.version += 1
        assert store.put(changed, original.version)
        assert not store.put(original, original.version)
        assert store.limit("ip", "create", 1, 1000000)
        assert not store.limit("ip", "create", 1, 1000000)
