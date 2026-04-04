import json
from openai import AsyncOpenAI
from app.config import settings


async def generate_daily_summary(notes_data: list[dict]) -> dict:
    """
    Given a list of {title, transcript, recorded_at} dicts,
    return {summary, key_topics, action_items, mood}.
    """
    if not notes_data:
        return {"summary": None, "key_topics": [], "action_items": [], "mood": None}

    if not settings.OPENAI_API_KEY:
        return {
            "summary": f"You recorded {len(notes_data)} note(s) today.",
            "key_topics": [],
            "action_items": [],
            "mood": None,
        }

    combined = "\n\n".join(
        f"[{n.get('recorded_at', '')}] {n.get('title', 'Note')}: {n.get('transcript', '')}"
        for n in notes_data
    )

    prompt = f"""You are a personal notes assistant. Given these voice notes from today, provide:
1. A 2-3 sentence summary of the day's key thoughts and activities
2. Up to 5 key topics discussed
3. Any action items or tasks mentioned
4. An optional mood (one word, e.g. "focused", "reflective", "stressed")

Respond ONLY with valid JSON:
{{
  "summary": "...",
  "key_topics": ["...", "..."],
  "action_items": ["...", "..."],
  "mood": "..."
}}

Today's notes:
{combined[:5000]}"""

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=400,
        )
        raw = (resp.choices[0].message.content or "{}").strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
        return {
            "summary": data.get("summary"),
            "key_topics": data.get("key_topics", []),
            "action_items": data.get("action_items", []),
            "mood": data.get("mood"),
        }
    except Exception as exc:
        print(f"[daily_summary] error: {exc}")
        return {
            "summary": f"You recorded {len(notes_data)} note(s) today.",
            "key_topics": [],
            "action_items": [],
            "mood": None,
        }
