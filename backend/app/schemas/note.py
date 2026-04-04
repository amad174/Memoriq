import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class NoteRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    audio_url: str
    transcript: Optional[str]
    title: Optional[str]
    summary: Optional[str]
    tags: Optional[list[str]]
    duration_seconds: Optional[float]
    transcription_status: str
    day_date: date
    recorded_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class NoteListItem(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    summary: Optional[str]
    tags: Optional[list[str]]
    duration_seconds: Optional[float]
    transcription_status: str
    day_date: date
    recorded_at: datetime
    audio_url: str

    model_config = {"from_attributes": True}


class NoteTitleUpdate(BaseModel):
    title: str


class DayEntry(BaseModel):
    date: date
    note_count: int
    preview: Optional[str] = None


class MonthCalendarResponse(BaseModel):
    year: int
    month: int
    days: list[DayEntry]


class DayDetailResponse(BaseModel):
    date: date
    notes: list[NoteRead]
    daily_summary: Optional[str] = None


class SearchResult(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    day_date: date
    recorded_at: datetime
    snippet: str
    score: float = 0.0

    model_config = {"from_attributes": True}
