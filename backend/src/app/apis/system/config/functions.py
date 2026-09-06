from app.core.models import Connection


def execute(config: Connection) -> Connection:
    """Return the injected environment-specific connection configuration."""
    return config
