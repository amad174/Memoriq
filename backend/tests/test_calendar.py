"""Tests for calendar and daily summary endpoints."""
import uuid
from datetime import datetime, timezone, date
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import VoiceNote
from app.models.daily_summary import DailySummary
from app.models.user import User
from app.services.auth_service import hash_password, create_access_token


async def _make_user(db: AsyncSession, email: str) -> User:
    user = User(id=uuid.uuid4(), email=email, hashed_password=hash_password("pass"))
    db.add(user)
    await db.commit()
    return user


def _headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.email)}"}


async def _seed_note(db: AsyncSession, user: User, day: date, title: str = "Test") -> VoiceNote:
    note = VoiceNote(
        id=uuid.uuid4(),
        user_id=user.id,
        audio_url="/audio/t.m4a",
        transcript="Test transcript",
        title=title,
        transcription_status="done",
        day_date=day,
        recorded_at=datetime(day.year, day.month, day.day, 9, 0, tzinfo=timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(note)
    await db.commit()
    return note


class TestCalendarMonth:
    async def test_returns_days_with_notes(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "cal@example.com")
        await _seed_note(db_session, user, date(2026, 4, 1))
        await _seed_note(db_session, user, date(2026, 4, 1))
        await _seed_note(db_session, user, date(2026, 4, 15))

        resp = await client.get("/calendar/month?year=2026&month=4", headers=_headers(user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["year"] == 2026
        assert data["month"] == 4
        dates = {d["date"]: d["note_count"] for d in data["days"]}
        assert dates.get("2026-04-01") == 2
        assert dates.get("2026-04-15") == 1

    async def test_returns_empty_for_month_with_no_notes(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "empty@example.com")
        resp = await client.get("/calendar/month?year=2025&month=1", headers=_headers(user))
        assert resp.status_code == 200
        assert resp.json()["days"] == []


class TestCalendarDay:
    async def test_returns_notes_for_date(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "day@example.com")
        await _seed_note(db_session, user, date(2026, 4, 10), "Morning note")
        await _seed_note(db_session, user, date(2026, 4, 10), "Afternoon note")

        resp = await client.get("/calendar/day?date=2026-04-10", headers=_headers(user))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["notes"]) == 2
        assert data["daily_summary"] is None

    async def test_includes_cached_summary(self, client: AsyncClient, db_session: AsyncSession):
        user = await _make_user(db_session, "summary@example.com")
        await _seed_note(db_session, user, date(2026, 4, 5))
        summary = DailySummary(
            id=uuid.uuid4(),
            user_id=user.id,
            day_date=date(2026, 4, 5),
            summary="A productive day.",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(summary)
        await db_session.commit()

        resp = await client.get("/calendar/day?date=2026-04-05", headers=_headers(user))
        assert resp.status_code == 200
        assert resp.json()["daily_summary"] == "A productive day."


class TestDailySummaryGenerate:
    @patch("app.routers.summaries.generate_daily_summary", new_callable=AsyncMock)
    async def test_generate_creates_summary(
        self, mock_gen, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "gen@example.com")
        await _seed_note(db_session, user, date(2026, 4, 20))
        mock_gen.return_value = {
            "summary": "Great day!",
            "key_topics": ["work"],
            "action_items": [],
            "mood": "focused",
        }

        resp = await client.post(
            "/summaries/daily/generate",
            json={"day_date": "2026-04-20"},
            headers=_headers(user),
        )
        assert resp.status_code == 200
        assert resp.json()["summary"] == "Great day!"
        assert resp.json()["mood"] == "focused"

    async def test_generate_404_when_no_notes(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await _make_user(db_session, "noday@example.com")
        resp = await client.post(
            "/summaries/daily/generate",
            json={"day_date": "2026-01-01"},
            headers=_headers(user),
        )
        assert resp.status_code == 404
