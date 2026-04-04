"""Initial schema with pgvector

Revision ID: 001
Revises:
Create Date: 2026-04-04
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Must be first — all vector columns depend on this extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "voice_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("audio_url", sa.String(512), nullable=False),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column(
            "transcription_status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("day_date", sa.Date(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    # Add vector column separately (pgvector type not available in raw SQLAlchemy DDL)
    op.execute("ALTER TABLE voice_notes ADD COLUMN embedding vector(1536)")
    # HNSW index for cosine-distance approximate nearest-neighbour
    op.execute(
        "CREATE INDEX ON voice_notes USING hnsw (embedding vector_cosine_ops)"
    )
    op.create_index("ix_voice_notes_user_id", "voice_notes", ["user_id"])
    op.create_index("ix_voice_notes_day_date", "voice_notes", ["day_date"])

    op.create_table(
        "daily_summaries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day_date", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_topics", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("action_items", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("mood", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_unique_constraint(
        "uq_daily_summary_user_date", "daily_summaries", ["user_id", "day_date"]
    )

    op.create_table(
        "ai_chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_ai_chat_messages_user_id", "ai_chat_messages", ["user_id"]
    )


def downgrade() -> None:
    op.drop_table("ai_chat_messages")
    op.drop_table("daily_summaries")
    op.drop_table("voice_notes")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS vector")
