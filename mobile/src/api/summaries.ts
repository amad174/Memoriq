import { apiClient } from "./client";
import { DailySummary } from "@/types/calendar";

export async function getDailySummary(date: string): Promise<DailySummary | null> {
  try {
    const res = await apiClient.get<DailySummary>("/summaries/daily", { params: { date } });
    return res.data;
  } catch {
    return null;
  }
}

export async function generateDailySummary(day_date: string): Promise<DailySummary> {
  const res = await apiClient.post<DailySummary>("/summaries/daily/generate", { day_date });
  return res.data;
}
