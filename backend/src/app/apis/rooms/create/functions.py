from app.core.models import Enter, Response
from app.core.rooms import Rooms, require


def execute(body: Enter, ip: str, rooms: Rooms) -> Response:
    """Execute the createRoom operation through the room service boundary."""
    require(
        rooms.store.limit(ip, "create", 6, rooms.now()),
        429,
        "操作が多すぎます。少し待ってください。",
    )
    room, credentials = rooms.create(body)
    return Response(room=room, credentials=credentials)
