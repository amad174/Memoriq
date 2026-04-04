from openai import AsyncOpenAI
from app.config import settings


async def transcribe_audio(file_path: str) -> str | None:
    """
    Transcribe an audio file using OpenAI Whisper-1.
    Returns the transcript string, or None if unavailable / on error.
    """
    if not settings.OPENAI_API_KEY:
        return None

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        with open(file_path, "rb") as audio_file:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
            )
        return response.strip() if response else None
    except Exception as exc:
        print(f"[transcription] error: {exc}")
        return None
