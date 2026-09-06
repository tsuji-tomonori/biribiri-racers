from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.rooms import Rooms
from app.integrations.deps import service, source_ip

from . import functions as api_functions
from .samples import ERROR
from .schemas import Enter, Response

router = APIRouter()


@router.post(
    "/api/rooms",
    operation_id="createRoom",
    summary="createRoom",
    responses={
        403: {"description": "Forbidden", "content": {"application/json": {"example": ERROR}}}
    },
    openapi_extra={"x-requirement-ids": ["BR-ROOM-001"]},
)
def execute(
    body: Enter, ip: Annotated[str, Depends(source_ip)], rooms: Annotated[Rooms, Depends(service)]
) -> Response:
    return api_functions.execute(body, ip, rooms)
