import { Note } from "./note";

export interface DayEntry {
  date: string;
  note_count: number;
  preview: string | null;
}

export interface MonthCalendarResponse {
  year: number;
  month: number;
  days: DayEntry[];
}

export interface DayDetailResponse {
  date: string;
  notes: Note[];
  daily_summary: string | null;
}

export interface DailySummary {
  id: string;
  user_id: string;
  day_date: string;
  summary: string | null;
  key_topics: string[] | null;
  action_items: string[] | null;
  mood: string | null;
  created_at: string;
}
