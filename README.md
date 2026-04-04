# Memoriq

> **Your voice, remembered.**

Memoriq is a voice-first personal notes app. Record thoughts instantly, browse them on a calendar, and ask AI questions over your own transcripts — privately.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (Expo Router v4) |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 + pgvector |
| Auth | JWT (HS256) |
| File Storage | Local filesystem (swap to S3 easily) |
| AI | OpenAI — Whisper, GPT-4o-mini, text-embedding-3-small |

---

## Features

- **Voice recording** — tap to record, tap to stop. Done.
- **Auto-transcription** — powered by OpenAI Whisper
- **Auto title, summary & tags** — GPT-4o-mini enriches every note
- **Calendar view** — browse notes by month/day
- **Daily summaries** — AI digest of each day's notes
- **Keyword + semantic search** — find anything you've said
- **Ask AI** — RAG-based Q&A strictly over your own notes. No hallucination.

---

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- Expo CLI (`npm install -g expo-cli`)
- OpenAI API key

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/amad174/Memoriq.git
cd Memoriq
```

### 2. Start the database

```bash
cd infra
docker-compose up -d db
```

### 3. Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — add your OPENAI_API_KEY

# Run migrations
alembic upgrade head

# (Optional) seed demo data
python seed.py

# Start the server
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 4. Mobile setup

```bash
cd mobile
npm install

cp .env.example .env
# If testing on a physical device, set EXPO_PUBLIC_API_URL to your LAN IP
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.10:8000

npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android.

---

## Running Tests

### Backend

```bash
cd backend
source .venv/bin/activate
pytest -v
```

> Tests use a separate `memoriq_test` PostgreSQL database. Make sure the DB container is running.

### Mobile

```bash
cd mobile
npm test
```

---

## Project Structure

```
Memoriq/
├── backend/
│   ├── app/
│   │   ├── db/           # SQLAlchemy engine + session
│   │   ├── models/       # ORM models (User, VoiceNote, DailySummary, AIChatMessage)
│   │   ├── routers/      # FastAPI route handlers
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── services/     # Business logic (auth, transcription, embeddings, RAG)
│   ├── alembic/          # Database migrations
│   ├── tests/            # pytest test suite
│   └── seed.py           # Demo data seeder
│
├── mobile/
│   ├── app/              # Expo Router screens
│   │   ├── (auth)/       # Login + Signup
│   │   ├── (app)/        # Tab screens (Home, Calendar, Search, Ask AI, Settings)
│   │   └── note/[id]     # Note detail
│   └── src/
│       ├── api/          # Axios API modules
│       ├── auth/         # AuthContext + hook
│       ├── components/   # Reusable UI components
│       ├── constants/    # Theme (colours, spacing, typography)
│       ├── hooks/        # useVoiceRecorder, etc.
│       ├── types/        # TypeScript interfaces
│       └── utils/        # formatDate, storage helpers
│
└── infra/
    └── docker-compose.yml
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/notes/upload` | Upload audio, triggers full AI pipeline |
| GET | `/notes` | List user's notes |
| GET | `/notes/{id}` | Get a single note |
| PATCH | `/notes/{id}/title` | Update note title |
| DELETE | `/notes/{id}` | Delete a note |
| GET | `/calendar/month?year=&month=` | Notes grouped by day for a month |
| GET | `/calendar/day?date=` | All notes for a specific day |
| GET | `/summaries/daily?date=` | Fetch cached daily summary |
| POST | `/summaries/daily/generate` | Generate (or regenerate) daily AI summary |
| GET | `/search?q=&mode=keyword\|semantic` | Search notes |
| POST | `/ask` | Ask AI a question about your notes |
| GET | `/ask/history` | Retrieve chat history |
| GET | `/health` | Health check |

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql+asyncpg://memoriq:memoriq_secret@localhost:5432/memoriq
SECRET_KEY=your-long-random-secret
OPENAI_API_KEY=sk-...
UPLOAD_DIR=./uploads
ACCESS_TOKEN_EXPIRE_DAYS=30
```

### Mobile (`.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## Licence

MIT
