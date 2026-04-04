import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str


class SourceNote(BaseModel):
    note_id: uuid.UUID
    day_date: date
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceNote]
