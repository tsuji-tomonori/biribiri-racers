from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.rooms import Rooms
from app.integrations.deps import service, token

from . import functions as api_functions
from .samples import ERROR
from .schemas import Response

router = APIRouter()


@router.get(
    "/api/rooms/{code}",
    operation_id="readRoom",
    summary="readRoom",
    responses={
        403: {"description": "Forbidden", "content": {"application/json": {"example": ERROR}}}
    },
    openapi_extra={"x-requirement-ids": ["BR-SEC-001"]},
)
def execute(
    code: str, credential: Annotated[str, Depends(token)], rooms: Annotated[Rooms, Depends(service)]
) -> Response:
    return api_functions.execute(code, credential, rooms)
