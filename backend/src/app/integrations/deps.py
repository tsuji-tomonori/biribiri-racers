import os
import threading
from functools import lru_cache
from typing import TYPE_CHECKING, cast

import boto3
from botocore.config import Config
from fastapi import Header, Request

from app.core.models import Connection
from app.core.rooms import Rooms
from app.integrations.dynamo import DynamoStore

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource

# boto3 resources are not shared across request threads.
_local = threading.local()


def service() -> Rooms:
    value = getattr(_local, "rooms", None)
    if isinstance(value, Rooms):
        return value
    resource = cast(
        "DynamoDBServiceResource",
        boto3.resource(
            "dynamodb",
            config=Config(
                connect_timeout=2,
                read_timeout=3,
                retries={"mode": "standard", "total_max_attempts": 3},
            ),
        ),
    )
    rooms = Rooms(DynamoStore(resource.Table(os.environ["ROOMS_TABLE"])))
    _local.rooms = rooms
    return rooms


def token(authorization: str = Header(default="")) -> str:
    return authorization.removeprefix("Bearer ")


def source_ip(request: Request) -> str:
    # API Gateway's trusted source IP. Direct-origin callers cannot forge a quota key.
    return request.client.host if request.client else "unknown"


@lru_cache
def connection() -> Connection:
    return Connection(
        websocketUrl=os.environ.get("WEBSOCKET_URL", "/event/realtime"),
        httpHost=os.environ.get("EVENT_HTTP_HOST", ""),
    )
