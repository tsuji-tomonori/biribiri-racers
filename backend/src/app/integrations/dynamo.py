from __future__ import annotations

import hashlib
import zlib
from typing import TYPE_CHECKING, SupportsBytes, cast

from boto3.dynamodb.conditions import Attr
from boto3.dynamodb.types import Binary

from app.core.models import Room

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import Table

LIMIT = 128 * 1024


def encode(room: Room) -> bytes:
    raw = room.model_dump_json().encode()
    if len(raw) > LIMIT:
        raise ValueError("Room size limit exceeded")
    return zlib.compress(raw)


def decode(data: bytes) -> Room:
    decoder = zlib.decompressobj()
    raw = decoder.decompress(data, LIMIT + 1)
    if len(raw) > LIMIT or not decoder.eof or decoder.unused_data:
        raise ValueError("Invalid room data")
    return Room.model_validate_json(raw)


class DynamoStore:
    def __init__(self, table: Table) -> None:
        self.table = table

    def get(self, code: str) -> Room | None:
        item = self.table.get_item(Key={"code": code}, ConsistentRead=True).get("Item")
        if not item:
            return None
        data = item["state"]
        if not isinstance(data, Binary):
            raise ValueError("Room state is not binary")
        return decode(bytes(cast(SupportsBytes, data)))

    def put(self, room: Room, version: int | None) -> bool:
        try:
            self.table.put_item(
                Item={
                    "code": room.code,
                    "version": room.version,
                    "ttl": room.ttl,
                    "state": encode(room),
                },
                ConditionExpression=Attr("code").not_exists()
                if version is None
                else Attr("version").eq(version),
            )
            return True
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            return False

    def limit(self, ip: str, action: str, maximum: int, now: int) -> bool:
        key = f"LIMIT#{action}#{now // 60000}#{hashlib.sha256(ip.encode()).hexdigest()}"
        try:
            self.table.update_item(
                Key={"code": key},
                UpdateExpression="SET #ttl = :ttl ADD #count :one",
                ExpressionAttributeNames={"#ttl": "ttl", "#count": "count"},
                ExpressionAttributeValues={":ttl": now // 1000 + 120, ":one": 1},
                ConditionExpression=Attr("count").not_exists() | Attr("count").lt(maximum),
            )
            return True
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            return False
