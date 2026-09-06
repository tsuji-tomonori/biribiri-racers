from typing import cast

from fastapi import APIRouter

from . import functions as api_functions
from .contract import CONTRACT
from .samples import ERROR

router = APIRouter()


@router.get(
    "/api/health",
    operation_id="health",
    summary="health",
    responses={
        status: {
            "description": "Operation error",
            "content": {"application/json": {"example": ERROR}},
        }
        for status in cast(list[int], CONTRACT["errors"])
    },
    openapi_extra={"x-requirement-ids": ["BR-AWS-001"]},
)
def execute() -> dict[str, str]:
    return api_functions.execute()
