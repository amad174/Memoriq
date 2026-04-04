import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class DailySummaryRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    day_date: date
    summary: Optional[str]
    key_topics: Optional[list[str]]
    action_items: Optional[list[str]]
    mood: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class DailySummaryGenerateRequest(BaseModel):
    day_date: date
