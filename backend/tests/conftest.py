"""
Shared test fixtures.

Requires a running PostgreSQL instance (the Docker compose db service).
Tests use a dedicated `memoriq_test` database so they never touch production data.

Set TEST_DATABASE_URL in environment to override, e.g. for CI:
  TEST_DATABASE_URL=postgresql+asyncpg://memoriq:memoriq_secret@localhost:5433/memoriq_test
"""
import asyncio
import os
import uuid
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.db.base import Base
from app.deps import get_db, get_current_user
from app.models import User, VoiceNote, DailySummary, AIChatMessage  # noqa: F401
from app.services.auth_service import hash_password, create_access_token

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://memoriq:memoriq_secret@localhost:5433/memoriq_test",
)


def _make_engine():
    return create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)


# ── Session-level table lifecycle (sync wrappers around asyncio.run) ──────────

@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables once per test session using a dedicated engine."""
    async def _setup():
        engine = _make_engine()
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def _teardown():
        engine = _make_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_setup())
    yield
    asyncio.run(_teardown())


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables after each test for isolation."""
    yield

    async def _clean():
        engine = _make_engine()
        async with engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        await engine.dispose()

    asyncio.run(_clean())


# ── Per-test fixtures ─────────────────────────────────────────────────────────

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = _make_engine()
    session_factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX async client wired to the FastAPI app with the test DB session."""
    from app.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    token = create_access_token(test_user.id, test_user.email)
    return {"Authorization": f"Bearer {token}"}
