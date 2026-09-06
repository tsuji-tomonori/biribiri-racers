from app.core.models import Command, Response
from app.core.rooms import Rooms


def execute(code: str, body: Command, credential: str, rooms: Rooms) -> Response:
    """Execute the roomCommand operation through the room service boundary."""
    return Response(room=rooms.command(code, credential, body))
