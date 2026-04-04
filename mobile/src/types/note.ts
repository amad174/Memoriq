export interface Note {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string | null;
  title: string | null;
  summary: string | null;
  tags: string[] | null;
  duration_seconds: number | null;
  transcription_status: "pending" | "processing" | "done" | "failed";
  day_date: string;
  recorded_at: string;
  created_at: string;
}

export interface NoteListItem {
  id: string;
  title: string | null;
  summary: string | null;
  tags: string[] | null;
  duration_seconds: number | null;
  transcription_status: string;
  day_date: string;
  recorded_at: string;
  audio_url: string;
}

export interface SearchResult {
  id: string;
  title: string | null;
  day_date: string;
  recorded_at: string;
  snippet: string;
  score: number;
}

export interface SourceNote {
  note_id: string;
  day_date: string;
  snippet: string;
}

export interface AskResponse {
  answer: string;
  sources: SourceNote[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceNote[];
  created_at: string;
}
