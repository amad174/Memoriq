import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    notes: Mapped[list["VoiceNote"]] = relationship(
        "VoiceNote", back_populates="user", cascade="all, delete-orphan"
    )
    daily_summaries: Mapped[list["DailySummary"]] = relationship(
        "DailySummary", back_populates="user", cascade="all, delete-orphan"
    )
    chat_messages: Mapped[list["AIChatMessage"]] = relationship(
        "AIChatMessage", back_populates="user", cascade="all, delete-orphan"
    )
