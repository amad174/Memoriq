import { apiClient } from "./client";
import { Note, NoteListItem } from "@/types/note";

export async function uploadNote(
  audioUri: string,
  durationSeconds?: number,
  recordedAt?: Date
): Promise<Note> {
  const formData = new FormData();
  formData.append("audio", { uri: audioUri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
  if (durationSeconds != null) formData.append("duration_seconds", String(durationSeconds));
  if (recordedAt) formData.append("recorded_at", recordedAt.toISOString());

  const res = await apiClient.post<Note>("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getNotes(limit = 50, offset = 0): Promise<NoteListItem[]> {
  const res = await apiClient.get<NoteListItem[]>("/notes", { params: { limit, offset } });
  return res.data;
}

export async function getNoteById(id: string): Promise<Note> {
  const res = await apiClient.get<Note>(`/notes/${id}`);
  return res.data;
}

export async function updateNoteTitle(id: string, title: string): Promise<Note> {
  const res = await apiClient.patch<Note>(`/notes/${id}/title`, { title });
  return res.data;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}
