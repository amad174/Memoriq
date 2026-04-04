from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.note import VoiceNote
from app.models.daily_summary import DailySummary
from app.schemas.daily_summary import DailySummaryRead, DailySummaryGenerateRequest
from app.services.daily_summary_service import generate_daily_summary

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("/daily", response_model=DailySummaryRead | None)
async def get_daily_summary(
    day_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DailySummary).where(
            DailySummary.user_id == current_user.id,
            DailySummary.day_date == day_date,
        )
    )
    return result.scalar_one_or_none()


@router.post("/daily/generate", response_model=DailySummaryRead)
async def generate_summary(
    body: DailySummaryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes_result = await db.execute(
        select(VoiceNote)
        .where(VoiceNote.user_id == current_user.id, VoiceNote.day_date == body.day_date)
        .order_by(VoiceNote.recorded_at)
    )
    notes = notes_result.scalars().all()
    if not notes:
        raise HTTPException(status_code=404, detail="No notes found for this date")

    data = await generate_daily_summary(
        [{"title": n.title, "transcript": n.transcript, "recorded_at": n.recorded_at.isoformat()} for n in notes]
    )

    existing = await db.execute(
        select(DailySummary).where(
            DailySummary.user_id == current_user.id,
            DailySummary.day_date == body.day_date,
        )
    )
    obj = existing.scalar_one_or_none()
    if obj:
        obj.summary = data["summary"]
        obj.key_topics = data["key_topics"]
        obj.action_items = data["action_items"]
        obj.mood = data["mood"]
    else:
        obj = DailySummary(
            user_id=current_user.id,
            day_date=body.day_date,
            **data,
        )
        db.add(obj)

    await db.flush()
    return obj
