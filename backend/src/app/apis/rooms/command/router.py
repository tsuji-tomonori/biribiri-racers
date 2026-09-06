from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.rooms import Rooms
from app.integrations.deps import service, token

from . import functions as api_functions
from .samples import ERROR
from .schemas import Command, Response

router = APIRouter()


@router.post(
    "/api/rooms/{code}/commands",
    operation_id="roomCommand",
    summary="roomCommand",
    responses={
        403: {"description": "Forbidden", "content": {"application/json": {"example": ERROR}}}
    },
    openapi_extra={"x-requirement-ids": ["BR-RACE-001"]},
)
def execute(
    code: str,
    body: Command,
    credential: Annotated[str, Depends(token)],
    rooms: Annotated[Rooms, Depends(service)],
) -> Response:
    return api_functions.execute(code, body, credential, rooms)
