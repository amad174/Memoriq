import { apiClient } from "./client";
import { AskResponse, ChatMessage } from "@/types/note";

export async function askAI(question: string): Promise<AskResponse> {
  const res = await apiClient.post<AskResponse>("/ask", { question });
  return res.data;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>("/ask/history");
  return res.data;
}
