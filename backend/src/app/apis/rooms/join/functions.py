from app.core.models import Enter, Response
from app.core.rooms import Rooms, require


def execute(code: str, body: Enter, ip: str, rooms: Rooms) -> Response:
    """Execute the joinRoom operation through the room service boundary."""
    require(
        rooms.store.limit(ip, "join", 30, rooms.now()),
        429,
        "操作が多すぎます。少し待ってください。",
    )
    room, credentials = rooms.join(code, body)
    return Response(room=room, credentials=credentials)
