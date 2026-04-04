import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, text
from app.models.note import VoiceNote
from app.services.embedding_service import embed_text


async def keyword_search(
    query: str, user_id: uuid.UUID, db: AsyncSession, limit: int = 20
) -> list[dict]:
    result = await db.execute(
        select(VoiceNote)
        .where(
            VoiceNote.user_id == user_id,
            or_(
                VoiceNote.transcript.ilike(f"%{query}%"),
                VoiceNote.title.ilike(f"%{query}%"),
            ),
        )
        .order_by(VoiceNote.recorded_at.desc())
        .limit(limit)
    )
    return [_to_result(n, query, 1.0) for n in result.scalars().all()]


async def semantic_search(
    query: str, user_id: uuid.UUID, db: AsyncSession, limit: int = 20
) -> list[dict]:
    embedding = await embed_text(query)
    if not embedding:
        return await keyword_search(query, user_id, db, limit)

    vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
    stmt = text("""
        SELECT id, title, transcript, day_date, recorded_at,
               1 - (embedding <=> :qvec::vector) AS score
        FROM voice_notes
        WHERE user_id = :uid AND embedding IS NOT NULL
        ORDER BY embedding <=> :qvec::vector
        LIMIT :lim
    """)
    rows = (await db.execute(stmt, {"qvec": vec_str, "uid": str(user_id), "lim": limit})).fetchall()
    return [
        {
            "id": str(row.id),
            "title": row.title or "Untitled",
            "day_date": row.day_date,
            "recorded_at": row.recorded_at,
            "snippet": _snippet(row.transcript or "", query),
            "score": float(row.score),
        }
        for row in rows
    ]


def _to_result(note: VoiceNote, query: str, score: float) -> dict:
    return {
        "id": str(note.id),
        "title": note.title or "Untitled",
        "day_date": note.day_date,
        "recorded_at": note.recorded_at,
        "snippet": _snippet(note.transcript or "", query),
        "score": score,
    }


def _snippet(transcript: str, query: str, ctx: int = 150) -> str:
    idx = transcript.lower().find(query.lower())
    if idx == -1:
        return transcript[:ctx] + ("..." if len(transcript) > ctx else "")
    start = max(0, idx - 40)
    end = min(len(transcript), idx + ctx)
    s = transcript[start:end]
    return ("..." if start > 0 else "") + s + ("..." if end < len(transcript) else "")
