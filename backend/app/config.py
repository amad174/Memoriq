from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://memoriq:memoriq_secret@localhost:5432/memoriq"
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30
    OPENAI_API_KEY: str = ""
    UPLOAD_DIR: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
