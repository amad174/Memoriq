import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.config import settings

ALLOWED_EXTENSIONS = {".m4a", ".mp3", ".wav", ".webm", ".ogg", ".aac"}


async def save_audio(file: UploadFile, user_id: uuid.UUID) -> tuple[str, str]:
    """
    Save an uploaded audio file under uploads/{user_id}/.
    Returns (relative_url, absolute_path).
    """
    ext = os.path.splitext(file.filename or "audio.m4a")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".m4a"

    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    filename = f"{uuid.uuid4()}{ext}"
    abs_path = os.path.join(user_dir, filename)

    async with aiofiles.open(abs_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return f"/audio/{user_id}/{filename}", abs_path


def resolve_audio_path(audio_url: str) -> str:
    """Convert a stored relative URL back to an absolute filesystem path."""
    # /audio/{user_id}/{filename}  →  uploads/{user_id}/{filename}
    parts = audio_url.lstrip("/").split("/", 1)
    if len(parts) == 2:
        return os.path.join(settings.UPLOAD_DIR, parts[1])
    return os.path.join(settings.UPLOAD_DIR, audio_url.lstrip("/"))
