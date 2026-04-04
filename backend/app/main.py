import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import auth, notes, calendar, summaries, search, ask


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(title="Memoriq API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(calendar.router)
app.include_router(summaries.router)
app.include_router(search.router)
app.include_router(ask.router)

# Serve uploaded audio files statically
if os.path.isdir(settings.UPLOAD_DIR):
    app.mount("/audio", StaticFiles(directory=settings.UPLOAD_DIR), name="audio")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "memoriq-api"}
