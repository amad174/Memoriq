"""
Seed demo data for manual testing.
Run: python seed.py
Requires the database to be running and migrations applied.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.note import VoiceNote
from app.models.daily_summary import DailySummary
from app.services.auth_service import hash_password

DEMO_NOTES = [
    {
        "delta_days": 0,
        "title": "Morning thoughts on the new project",
        "transcript": "So I was thinking this morning about the new project we're kicking off at work. I feel really excited but also a bit nervous. There's a lot riding on this and the deadline is tight. I need to make sure I talk to Sarah about the design requirements before Thursday.",
        "summary": "Excited but nervous about new work project. Need to talk to Sarah before Thursday.",
        "tags": ["work", "project", "planning"],
    },
    {
        "delta_days": 0,
        "title": "Gym session ideas",
        "transcript": "Just finished a run and I'm thinking I should add more strength training — maybe three days a week. I've been feeling sluggish in the afternoons. Want to try that new gym near the office. Need to cancel the current membership first.",
        "summary": "Planning to add strength training. Want to try new gym near office.",
        "tags": ["gym", "health", "fitness"],
    },
    {
        "delta_days": 1,
        "title": "App idea after reading that article",
        "transcript": "I just read this article about habit tracking and it gave me an idea for an app. What if there was something that let you track habits through voice notes instead of tapping buttons. I think there's a real gap in the market here.",
        "summary": "Idea for a voice-based habit tracking app.",
        "tags": ["app idea", "habits", "startup"],
    },
    {
        "delta_days": 3,
        "title": "Feeling stressed about job situation",
        "transcript": "I need to be honest with myself. I'm not happy in my current job. It's been six months and I still don't feel like I belong there. I think I need to start properly looking. Maybe start updating my CV this weekend.",
        "summary": "Unhappy at work after 6 months. Planning to update CV.",
        "tags": ["work", "career", "stress"],
    },
    {
        "delta_days": 5,
        "title": "Meeting notes with the design team",
        "transcript": "Good meeting today with the design team. We agreed on the new component library approach. Tom suggested using Radix UI which I think is a solid choice. Action: set up a shared Figma workspace and invite everyone by Friday.",
        "summary": "Design team agreed on Radix UI. Action: Figma workspace by Friday.",
        "tags": ["work", "design", "meeting"],
    },
    {
        "delta_days": 7,
        "title": "Thoughts on the money situation",
        "transcript": "Need to sort out my finances properly. I've been putting this off. I want to set a budget properly — maybe try the 50/30/20 rule. First step: look at my last three months of spending.",
        "summary": "Wants to improve finances. Planning to implement 50/30/20 budget rule.",
        "tags": ["money", "budgeting", "personal finance"],
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        user = User(
            id=uuid.uuid4(),
            email="demo@memoriq.app",
            hashed_password=hash_password("demo1234"),
        )
        db.add(user)
        await db.flush()

        now = datetime.now(timezone.utc)
        notes_by_day: dict = {}

        for n in DEMO_NOTES:
            recorded_at = now - timedelta(days=n["delta_days"], hours=9)
            day = recorded_at.date()
            note = VoiceNote(
                id=uuid.uuid4(),
                user_id=user.id,
                audio_url=f"/audio/{user.id}/demo_{uuid.uuid4()}.m4a",
                transcript=n["transcript"],
                title=n["title"],
                summary=n["summary"],
                tags=n["tags"],
                duration_seconds=round(len(n["transcript"].split()) * 0.4, 1),
                transcription_status="done",
                day_date=day,
                recorded_at=recorded_at,
                created_at=recorded_at,
                updated_at=recorded_at,
            )
            db.add(note)
            notes_by_day.setdefault(day, []).append(n)

        for day, day_notes in notes_by_day.items():
            if len(day_notes) >= 2:
                topics = list({t for n in day_notes for t in n["tags"][:2]})
                db.add(DailySummary(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    day_date=day,
                    summary=f"You recorded {len(day_notes)} notes covering {', '.join(topics[:3])}.",
                    key_topics=topics[:5],
                    action_items=[],
                    mood="reflective",
                    created_at=now,
                    updated_at=now,
                ))

        await db.commit()
        print("Seeded demo@memoriq.app / demo1234")
        print(f"Created {len(DEMO_NOTES)} demo notes")


if __name__ == "__main__":
    asyncio.run(seed())
