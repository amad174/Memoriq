from openai import AsyncOpenAI
from app.config import settings

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


async def embed_text(text: str) -> list[float] | None:
    """
    Produce a 1536-dimension embedding for the given text.
    Returns None if OpenAI is unavailable or input is empty.
    """
    if not settings.OPENAI_API_KEY or not text.strip():
        return None

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text[:8000],
        )
        return resp.data[0].embedding
    except Exception as exc:
        print(f"[embedding] error: {exc}")
        return None
