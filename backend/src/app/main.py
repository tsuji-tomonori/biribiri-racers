from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mangum import Mangum

from app.apis.rooms.command.router import router as command
from app.apis.rooms.create.router import router as create
from app.apis.rooms.join.router import router as join
from app.apis.rooms.read.router import router as read
from app.apis.system.config.router import router as config
from app.apis.system.health.router import router as health
from app.core.rooms import RoomError


def room_error(request: Request, error: RoomError) -> JSONResponse:
    return JSONResponse({"detail": error.message}, status_code=error.status)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Biribiri anonymous multiplayer",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.exception_handler(RoomError)(room_error)
    app.include_router(health)
    app.include_router(config)
    app.include_router(create)
    app.include_router(join)
    app.include_router(read)
    app.include_router(command)
    return app


app = create_app()
handler = Mangum(app, lifespan="off")
