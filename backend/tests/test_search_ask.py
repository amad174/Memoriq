"""Tests for search and ask AI endpoints."""
import uuid
from datetime import datetime, timezone, date
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import VoiceNote
from app.models.user import User
from app.services.auth_service import hash_password, create_access_token


async def _make_user(db: AsyncSession, email: str) -> User:
    user = User(id=uuid.uuid4(), email=email, hashed_password=hash_password("pass"))
    db.add(user)
    await db.commit()
    return user


def _headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.email)}"}


async def _seed_note(
    db: AsyncSession, user: User, transcript: str, title: str = "Note"
) -> VoiceNote:
    note = VoiceNote(
        id=uuid.uuid4(),
        user_id=user.id,
        audio_url="/audio/t.m4a",
        transcript=transcript,
        title=title,
        transcription_status="done",
        day_date=date.today(),
        recorded_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(note)
    await db.commit()
    return note


# ── Search ─────────────────────────────────────────────────────────────────────

class TestSearch:
    async def test_keyword_search_finds_matching_note(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "search@example.com")
        await _seed_note(db_session, user, "I went to the gym today and felt great.")
        await _seed_note(db_session, user, "Had a productive meeting at work.")

        resp = await client.get("/search?q=gym", headers=_headers(user))
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert "gym" in results[0]["snippet"].lower()

    async def test_search_returns_empty_for_no_match(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "nomatch@example.com")
        await _seed_note(db_session, user, "Talking about the weather today.")

        resp = await client.get("/search?q=unicorn", headers=_headers(user))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_search_isolates_per_user(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user1 = await _make_user(db_session, "s1@example.com")
        user2 = await _make_user(db_session, "s2@example.com")
        await _seed_note(db_session, user2, "This note belongs to user2 about cooking.")

        resp = await client.get("/search?q=cooking", headers=_headers(user1))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_search_requires_query_param(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "noparam@example.com")
        resp = await client.get("/search", headers=_headers(user))
        assert resp.status_code == 422

    async def test_invalid_mode_returns_422(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "mode@example.com")
        resp = await client.get("/search?q=test&mode=invalid", headers=_headers(user))
        assert resp.status_code == 422


# ── Ask AI ─────────────────────────────────────────────────────────────────────

class TestAskAI:
    @patch("app.routers.ask.answer_from_notes", new_callable=AsyncMock)
    async def test_ask_returns_answer_and_sources(
        self, mock_rag, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "ask@example.com")
        mock_rag.return_value = {
            "answer": "You mentioned wanting to quit on March 12.",
            "sources": [
                {"note_id": str(uuid.uuid4()), "day_date": "2026-03-12", "snippet": "I want to quit my job."}
            ],
        }

        resp = await client.post(
            "/ask",
            json={"question": "When did I mention quitting my job?"},
            headers=_headers(user),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "March 12" in data["answer"]
        assert len(data["sources"]) == 1
        assert data["sources"][0]["day_date"] == "2026-03-12"

    @patch("app.routers.ask.answer_from_notes", new_callable=AsyncMock)
    async def test_ask_persists_chat_history(
        self, mock_rag, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "history@example.com")
        mock_rag.return_value = {"answer": "No notes found.", "sources": []}

        await client.post("/ask", json={"question": "First question"}, headers=_headers(user))
        await client.post("/ask", json={"question": "Second question"}, headers=_headers(user))

        resp = await client.get("/ask/history", headers=_headers(user))
        assert resp.status_code == 200
        messages = resp.json()
        roles = [m["role"] for m in messages]
        assert roles.count("user") == 2
        assert roles.count("assistant") == 2

    async def test_ask_requires_auth(self, client: AsyncClient):
        resp = await client.post("/ask", json={"question": "test"})
        assert resp.status_code == 403
