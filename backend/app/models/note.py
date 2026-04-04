import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, DateTime, Date, Float, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.base import Base


class VoiceNote(Base):
    __tablename__ = "voice_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    audio_url: Mapped[str] = mapped_column(String(512), nullable=False)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    # "pending" | "processing" | "done" | "failed"
    transcription_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)
    day_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user: Mapped["User"] = relationship("User", back_populates="notes")
