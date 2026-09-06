from typing import Annotated, cast

from fastapi import APIRouter, Depends

from app.integrations.deps import connection

from . import functions as api_functions
from .contract import CONTRACT
from .samples import ERROR
from .schemas import Connection

router = APIRouter()


@router.get(
    "/api/config",
    operation_id="getConfig",
    summary="getConfig",
    responses={
        status: {
            "description": "Operation error",
            "content": {"application/json": {"example": ERROR}},
        }
        for status in cast(list[int], CONTRACT["errors"])
    },
    openapi_extra={"x-requirement-ids": ["BR-AWS-001"]},
)
def execute(config: Annotated[Connection, Depends(connection)]) -> Connection:
    return api_functions.execute(config)
