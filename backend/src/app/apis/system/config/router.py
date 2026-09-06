from typing import cast

from fastapi import APIRouter

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
def execute() -> Connection:
    return api_functions.execute()
