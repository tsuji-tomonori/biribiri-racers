from typing import Annotated, cast

from fastapi import APIRouter, Depends

from app.core.rooms import Rooms
from app.integrations.deps import service, source_ip

from . import functions as api_functions
from .contract import CONTRACT
from .samples import ERROR
from .schemas import Enter, Response

router = APIRouter()


@router.post(
    "/api/rooms/{code}/join",
    operation_id="joinRoom",
    summary="joinRoom",
    responses={
        status: {
            "description": "Operation error",
            "content": {"application/json": {"example": ERROR}},
        }
        for status in cast(list[int], CONTRACT["errors"])
    },
    openapi_extra={"x-requirement-ids": ["BR-ROOM-002"]},
)
def execute(
    code: str,
    body: Enter,
    ip: Annotated[str, Depends(source_ip)],
    rooms: Annotated[Rooms, Depends(service)],
) -> Response:
    return api_functions.execute(code, body, ip, rooms)
