from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.note import SearchResult
from app.services.search_service import keyword_search, semantic_search

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[SearchResult])
async def search_notes(
    q: str = Query(..., min_length=1),
    mode: str = Query("keyword", pattern="^(keyword|semantic)$"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fn = semantic_search if mode == "semantic" else keyword_search
    results = await fn(q, current_user.id, db, limit)
    return [SearchResult(**r) for r in results]
