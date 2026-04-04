"""Tests for the notes endpoints and upload pipeline."""
import io
import uuid
from datetime import datetime, timezone, date
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import VoiceNote
from app.services.auth_service import hash_password, create_access_token
from app.models.user import User


async def _make_user(db: AsyncSession, email: str = "notes@example.com") -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=hash_password("pass"),
    )
    db.add(user)
    await db.commit()
    return user


def _headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.email)}"}


def _fake_audio() -> io.BytesIO:
    return io.BytesIO(b"FAKE_AUDIO_CONTENT")


# ── Upload pipeline ────────────────────────────────────────────────────────────

class TestNoteUpload:
    @patch("app.routers.notes.transcribe_audio", new_callable=AsyncMock)
    @patch("app.routers.notes.enrich_transcript", new_callable=AsyncMock)
    @patch("app.routers.notes.embed_text", new_callable=AsyncMock)
    @patch("app.routers.notes.save_audio", new_callable=AsyncMock)
    async def test_upload_returns_201_with_enriched_note(
        self, mock_save, mock_embed, mock_enrich, mock_transcribe, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session)
        mock_save.return_value = ("/audio/u/test.m4a", "/tmp/test.m4a")
        mock_transcribe.return_value = "I had a great meeting today."
        mock_enrich.return_value = {"title": "Great meeting", "summary": "Had a meeting.", "tags": ["work"]}
        mock_embed.return_value = [0.1] * 1536

        resp = await client.post(
            "/notes/upload",
            files={"audio": ("rec.m4a", _fake_audio(), "audio/m4a")},
            headers=_headers(user),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Great meeting"
        assert data["transcription_status"] == "done"
        assert data["transcript"] == "I had a great meeting today."
        assert data["tags"] == ["work"]

    @patch("app.routers.notes.transcribe_audio", new_callable=AsyncMock)
    @patch("app.routers.notes.save_audio", new_callable=AsyncMock)
    async def test_upload_marks_failed_when_transcription_returns_none(
        self, mock_save, mock_transcribe, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "fail@example.com")
        mock_save.return_value = ("/audio/u/test.m4a", "/tmp/test.m4a")
        mock_transcribe.return_value = None

        resp = await client.post(
            "/notes/upload",
            files={"audio": ("rec.m4a", _fake_audio(), "audio/m4a")},
            headers=_headers(user),
        )
        assert resp.status_code == 201
        assert resp.json()["transcription_status"] == "failed"

    async def test_upload_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            "/notes/upload",
            files={"audio": ("rec.m4a", _fake_audio(), "audio/m4a")},
        )
        assert resp.status_code == 403


# ── CRUD operations ────────────────────────────────────────────────────────────

class TestNotesCRUD:
    async def _seed_note(self, db: AsyncSession, user: User) -> VoiceNote:
        note = VoiceNote(
            id=uuid.uuid4(),
            user_id=user.id,
            audio_url="/audio/test.m4a",
            transcript="Hello world",
            title="Test note",
            transcription_status="done",
            day_date=date.today(),
            recorded_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(note)
        await db.commit()
        return note

    async def test_list_notes_returns_only_own_notes(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user1 = await _make_user(db_session, "u1@example.com")
        user2 = await _make_user(db_session, "u2@example.com")
        await self._seed_note(db_session, user1)
        await self._seed_note(db_session, user2)

        resp = await client.get("/notes", headers=_headers(user1))
        assert resp.status_code == 200
        ids = [n["id"] for n in resp.json()]
        assert len(ids) == 1

    async def test_get_note_by_id(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "get@example.com")
        note = await self._seed_note(db_session, user)

        resp = await client.get(f"/notes/{note.id}", headers=_headers(user))
        assert resp.status_code == 200
        assert resp.json()["id"] == str(note.id)

    async def test_get_other_users_note_returns_404(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        owner = await _make_user(db_session, "owner@example.com")
        other = await _make_user(db_session, "other@example.com")
        note = await self._seed_note(db_session, owner)

        resp = await client.get(f"/notes/{note.id}", headers=_headers(other))
        assert resp.status_code == 404

    async def test_update_title(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "title@example.com")
        note = await self._seed_note(db_session, user)

        resp = await client.patch(
            f"/notes/{note.id}/title",
            json={"title": "Updated title"},
            headers=_headers(user),
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated title"

    async def test_delete_note(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "del@example.com")
        note = await self._seed_note(db_session, user)

        resp = await client.delete(f"/notes/{note.id}", headers=_headers(user))
        assert resp.status_code == 204

        resp2 = await client.get(f"/notes/{note.id}", headers=_headers(user))
        assert resp2.status_code == 404

    async def test_delete_other_users_note_returns_404(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        owner = await _make_user(db_session, "delowner@example.com")
        other = await _make_user(db_session, "delother@example.com")
        note = await self._seed_note(db_session, owner)

        resp = await client.delete(f"/notes/{note.id}", headers=_headers(other))
        assert resp.status_code == 404
