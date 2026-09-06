from app.core.models import Response
from app.core.rooms import Rooms


def execute(code: str, credential: str, rooms: Rooms) -> Response:
    """Execute the readRoom operation through the room service boundary."""
    return Response(room=rooms.read(code, credential))
