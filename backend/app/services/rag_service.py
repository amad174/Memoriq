import uuid
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.note import VoiceNote
from app.services.embedding_service import embed_text
from app.config import settings

_SYSTEM_PROMPT = """You are a personal memory assistant. You have access ONLY to the
user's voice note transcripts provided below.

Rules:
- Answer ONLY based on the provided note excerpts
- If the answer cannot be found in the notes, clearly say so
- Do NOT invent or hallucinate information
- Cite specific dates when possible
- Be concise and use a friendly, personal tone"""


async def answer_from_notes(
    question: str, user_id: uuid.UUID, db: AsyncSession, top_k: int = 8
) -> dict:
    """
    RAG pipeline:
    1. Embed the question
    2. Retrieve top-k most similar notes (vector, falling back to keyword)
    3. Build a context string from retrieved transcripts
    4. Ask GPT-4o-mini to answer strictly from context
    Returns {answer, sources: [{note_id, day_date, snippet}]}
    """
    question_embedding = await embed_text(question)
    retrieved = []

    if question_embedding:
        vec_str = "[" + ",".join(str(x) for x in question_embedding) + "]"
        stmt = text("""
            SELECT id, title, transcript, day_date,
                   1 - (embedding <=> :qvec::vector) AS score
            FROM voice_notes
            WHERE user_id = :uid AND embedding IS NOT NULL AND transcript IS NOT NULL
            ORDER BY embedding <=> :qvec::vector
            LIMIT :k
        """)
        rows = (await db.execute(stmt, {"qvec": vec_str, "uid": str(user_id), "k": top_k})).fetchall()
        retrieved = [
            {
                "note_id": str(row.id),
                "title": row.title or "Untitled",
                "transcript": row.transcript,
                "day_date": str(row.day_date),
                "score": float(row.score),
            }
            for row in rows
        ]

    # Keyword fallback
    if not retrieved:
        rows = (
            await db.execute(
                select(VoiceNote)
                .where(
                    VoiceNote.user_id == user_id,
                    VoiceNote.transcript.isnot(None),
                    VoiceNote.transcript.ilike(f"%{question[:50]}%"),
                )
                .order_by(VoiceNote.recorded_at.desc())
                .limit(top_k)
            )
        ).scalars().all()
        retrieved = [
            {
                "note_id": str(n.id),
                "title": n.title or "Untitled",
                "transcript": n.transcript,
                "day_date": str(n.day_date),
                "score": 0.5,
            }
            for n in rows
        ]

    if not retrieved:
        return {
            "answer": "I couldn't find any relevant notes to answer your question.",
            "sources": [],
        }

    context = "\n\n".join(
        f"[Note {i+1} – {r['day_date']} – \"{r['title']}\"]:\n{(r['transcript'] or '')[:500]}"
        for i, r in enumerate(retrieved)
    )

    if not settings.OPENAI_API_KEY:
        return {
            "answer": f"Found {len(retrieved)} relevant note(s). Top result from {retrieved[0]['day_date']}: {(retrieved[0]['transcript'] or '')[:300]}",
            "sources": [{"note_id": r["note_id"], "day_date": r["day_date"], "snippet": (r["transcript"] or "")[:200]} for r in retrieved[:3]],
        }

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": f"Question: {question}\n\nRelevant notes:\n\n{context}"},
            ],
            temperature=0.2,
            max_tokens=600,
        )
        answer = resp.choices[0].message.content or "I was unable to generate an answer."
    except Exception as exc:
        print(f"[rag] LLM error: {exc}")
        answer = "Sorry, I ran into an error generating an answer."

    return {
        "answer": answer,
        "sources": [
            {"note_id": r["note_id"], "day_date": r["day_date"], "snippet": (r["transcript"] or "")[:200]}
            for r in retrieved[:5]
        ],
    }
