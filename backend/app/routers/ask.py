import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.ai_chat import AIChatMessage
from app.schemas.ask import AskRequest, AskResponse, SourceNote
from app.services.rag_service import answer_from_notes

router = APIRouter(prefix="/ask", tags=["ask"])


@router.post("", response_model=AskResponse)
async def ask_ai(
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await answer_from_notes(body.question, current_user.id, db)

    db.add(AIChatMessage(user_id=current_user.id, role="user", content=body.question))
    db.add(
        AIChatMessage(
            user_id=current_user.id,
            role="assistant",
            content=result["answer"],
            sources=result["sources"],
        )
    )

    sources = [
        SourceNote(note_id=uuid.UUID(s["note_id"]), day_date=s["day_date"], snippet=s["snippet"])
        for s in result["sources"]
    ]
    return AskResponse(answer=result["answer"], sources=sources)


@router.get("/history", response_model=list[dict])
async def get_history(
    limit: int = 40,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AIChatMessage)
        .where(AIChatMessage.user_id == current_user.id)
        .order_by(AIChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.scalars().all()))
    return [
        {"id": str(m.id), "role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at.isoformat()}
        for m in messages
    ]
