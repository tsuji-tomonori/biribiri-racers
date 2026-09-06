from app.core.models import Connection
from app.integrations.deps import connection


def execute() -> Connection:
    """Execute the getConfig operation through the room service boundary."""
    return connection()
