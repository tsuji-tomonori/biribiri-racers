from fastapi import APIRouter

from . import functions as api_functions
from .samples import ERROR
from .schemas import Connection

router = APIRouter()


@router.get(
    "/api/config",
    operation_id="getConfig",
    summary="getConfig",
    responses={
        403: {"description": "Forbidden", "content": {"application/json": {"example": ERROR}}}
    },
    openapi_extra={"x-requirement-ids": ["BR-AWS-001"]},
)
def execute() -> Connection:
    return api_functions.execute()
