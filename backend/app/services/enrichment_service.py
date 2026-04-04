import json
from openai import AsyncOpenAI
from app.config import settings


async def enrich_transcript(transcript: str) -> dict:
    """
    Generate a title, one-sentence summary, and up to 5 tags from a transcript.
    Falls back to heuristic defaults when OpenAI is unavailable.
    """
    if not settings.OPENAI_API_KEY or not transcript.strip():
        words = transcript.split()[:6] if transcript.strip() else ["Voice", "note"]
        return {
            "title": " ".join(words).capitalize(),
            "summary": transcript[:200] if transcript else "",
            "tags": [],
        }

    prompt = f"""You are a personal notes assistant. Given the voice note transcript below, extract:

1. A short descriptive title (max 8 words, no quotes)
2. A one-sentence summary
3. Up to 5 tags (single words or short phrases)

Respond ONLY with valid JSON in this exact format:
{{
  "title": "...",
  "summary": "...",
  "tags": ["...", "..."]
}}

Transcript:
{transcript[:3000]}"""

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )
        raw = (resp.choices[0].message.content or "{}").strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
        return {
            "title": data.get("title", "Voice note"),
            "summary": data.get("summary", ""),
            "tags": data.get("tags", []),
        }
    except Exception as exc:
        print(f"[enrichment] error: {exc}")
        words = transcript.split()[:6]
        return {"title": " ".join(words).capitalize() or "Voice note", "summary": "", "tags": []}
