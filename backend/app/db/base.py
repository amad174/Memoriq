from sqlalchemy.orm import DeclarativeBase
from pgvector.sqlalchemy import Vector  # noqa: F401 – registers the Vector type


class Base(DeclarativeBase):
    pass
