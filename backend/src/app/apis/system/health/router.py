from fastapi import APIRouter

from . import functions as api_functions
from .samples import ERROR

router = APIRouter()


@router.get(
    "/api/health",
    operation_id="health",
    summary="health",
    responses={
        403: {"description": "Forbidden", "content": {"application/json": {"example": ERROR}}}
    },
    openapi_extra={"x-requirement-ids": ["BR-AWS-001"]},
)
def execute() -> dict[str, str]:
    return api_functions.execute()
