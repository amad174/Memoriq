import uuid
from datetime import datetime, date
from sqlalchemy import Text, DateTime, Date, ForeignKey, ARRAY, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class DailySummary(Base):
    __tablename__ = "daily_summaries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_date: Mapped[date] = mapped_column(Date, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_topics: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    action_items: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    mood: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user: Mapped["User"] = relationship("User", back_populates="daily_summaries")
