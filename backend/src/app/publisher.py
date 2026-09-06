import base64
import json
import os
from collections.abc import Callable
from functools import lru_cache
from urllib.request import Request, urlopen

import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from pydantic import BaseModel, Field

from app.core.models import Room
from app.core.rooms import view
from app.integrations.dynamo import decode


class Attribute(BaseModel):
    B: str | None = None


class Change(BaseModel):
    NewImage: dict[str, Attribute] = Field(default_factory=dict[str, Attribute])


class Record(BaseModel):
    dynamodb: Change


class Event(BaseModel):
    Records: list[Record]


class PublishResponse(BaseModel):
    failed: list[object] = Field(default_factory=list[object])


@lru_cache
def session() -> boto3.Session:
    return boto3.Session()


def send(body: str) -> None:
    url = os.environ["EVENT_HTTP_URL"]
    if not url.startswith("https://"):
        raise ValueError("AppSync endpoint must use HTTPS")
    credentials = session().get_credentials()
    if credentials is None:
        raise RuntimeError("Missing AWS credentials")
    request = AWSRequest(
        method="POST", url=url, data=body, headers={"Content-Type": "application/json"}
    )
    SigV4Auth(credentials.get_frozen_credentials(), "appsync", os.environ["AWS_REGION"]).add_auth(
        request
    )
    wire = Request(url, data=body.encode(), headers=dict(request.headers.items()), method="POST")  # noqa: S310 -- HTTPS validated above
    with urlopen(wire, timeout=5) as response:  # noqa: S310 -- HTTPS validated above
        result = PublishResponse.model_validate_json(response.read())
    if result.failed:
        raise RuntimeError("AppSync rejected events")


def publish(event: Event, transport: Callable[[str], None]) -> None:
    latest: dict[str, Room] = {}
    for record in event.Records:
        value = record.dynamodb.NewImage.get("state")
        if value and value.B:
            room = decode(base64.b64decode(value.B))
            if room.code not in latest or room.version > latest[room.code].version:
                latest[room.code] = room
    for room in latest.values():
        transport(
            json.dumps({"channel": f"/rooms/{room.code}", "events": [view(room).model_dump_json()]})
        )


def handler(event: object, context: object) -> None:
    publish(Event.model_validate(event), send)
