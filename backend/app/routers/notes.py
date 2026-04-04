import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.note import VoiceNote
from app.schemas.note import NoteRead, NoteListItem, NoteTitleUpdate
from app.services.audio_service import save_audio, resolve_audio_path
from app.services.transcription_service import transcribe_audio
from app.services.enrichment_service import enrich_transcript
from app.services.embedding_service import embed_text

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/upload", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def upload_note(
    audio: UploadFile = File(...),
    duration_seconds: Optional[float] = Form(None),
    recorded_at: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_url, abs_path = await save_audio(audio, current_user.id)

    if recorded_at:
        try:
            ts = datetime.fromisoformat(recorded_at)
        except ValueError:
            ts = datetime.now(timezone.utc)
    else:
        ts = datetime.now(timezone.utc)

    note = VoiceNote(
        user_id=current_user.id,
        audio_url=audio_url,
        duration_seconds=duration_seconds,
        recorded_at=ts,
        day_date=ts.date(),
        transcription_status="processing",
    )
    db.add(note)
    await db.flush()

    transcript = await transcribe_audio(abs_path)
    if transcript:
        enrichment = await enrich_transcript(transcript)
        embedding = await embed_text(transcript)
        note.transcript = transcript
        note.title = enrichment["title"]
        note.summary = enrichment["summary"]
        note.tags = enrichment["tags"]
        note.embedding = embedding
        note.transcription_status = "done"
    else:
        note.transcription_status = "failed"

    return note


@router.get("", response_model=list[NoteListItem])
async def list_notes(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceNote)
        .where(VoiceNote.user_id == current_user.id)
        .order_by(VoiceNote.recorded_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceNote).where(
            VoiceNote.id == note_id, VoiceNote.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}/title", response_model=NoteRead)
async def update_title(
    note_id: uuid.UUID,
    body: NoteTitleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceNote).where(
            VoiceNote.id == note_id, VoiceNote.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.title = body.title
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceNote).where(
            VoiceNote.id == note_id, VoiceNote.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)


@router.get("/audio/{user_id}/{filename}")
async def serve_audio(
    user_id: str,
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Serve audio files to the owning user only."""
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    path = resolve_audio_path(f"/audio/{user_id}/{filename}")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/mpeg")
