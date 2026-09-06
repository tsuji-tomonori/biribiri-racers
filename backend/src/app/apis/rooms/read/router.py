from typing import Annotated, cast

from fastapi import APIRouter, Depends

from app.core.rooms import Rooms
from app.integrations.deps import service, token

from . import functions as api_functions
from .contract import CONTRACT
from .samples import ERROR
from .schemas import Response

router = APIRouter()


@router.get(
    "/api/rooms/{code}",
    operation_id="readRoom",
    summary="readRoom",
    responses={
        status: {
            "description": "Operation error",
            "content": {"application/json": {"example": ERROR}},
        }
        for status in cast(list[int], CONTRACT["errors"])
    },
    openapi_extra={"x-requirement-ids": ["BR-SEC-001"]},
)
def execute(
    code: str, credential: Annotated[str, Depends(token)], rooms: Annotated[Rooms, Depends(service)]
) -> Response:
    return api_functions.execute(code, credential, rooms)
