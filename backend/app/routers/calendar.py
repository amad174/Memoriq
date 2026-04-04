from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.note import VoiceNote
from app.models.daily_summary import DailySummary
from app.schemas.note import MonthCalendarResponse, DayEntry, DayDetailResponse

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/month", response_model=MonthCalendarResponse)
async def get_month(
    year: int = Query(...),
    month: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceNote.day_date, func.count(VoiceNote.id).label("note_count"))
        .where(
            VoiceNote.user_id == current_user.id,
            extract("year", VoiceNote.day_date) == year,
            extract("month", VoiceNote.day_date) == month,
        )
        .group_by(VoiceNote.day_date)
        .order_by(VoiceNote.day_date)
    )
    rows = result.all()

    days: list[DayEntry] = []
    for row in rows:
        first = await db.execute(
            select(VoiceNote)
            .where(VoiceNote.user_id == current_user.id, VoiceNote.day_date == row.day_date)
            .order_by(VoiceNote.recorded_at)
            .limit(1)
        )
        note = first.scalar_one_or_none()
        preview = (note.summary or note.transcript or "")[:80] if note else None
        days.append(DayEntry(date=row.day_date, note_count=row.note_count, preview=preview))

    return MonthCalendarResponse(year=year, month=month, days=days)


@router.get("/day", response_model=DayDetailResponse)
async def get_day(
    day_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes_result = await db.execute(
        select(VoiceNote)
        .where(VoiceNote.user_id == current_user.id, VoiceNote.day_date == day_date)
        .order_by(VoiceNote.recorded_at)
    )
    notes = notes_result.scalars().all()

    summary_result = await db.execute(
        select(DailySummary).where(
            DailySummary.user_id == current_user.id,
            DailySummary.day_date == day_date,
        )
    )
    summary_obj = summary_result.scalar_one_or_none()

    return DayDetailResponse(
        date=day_date,
        notes=list(notes),
        daily_summary=summary_obj.summary if summary_obj else None,
    )
