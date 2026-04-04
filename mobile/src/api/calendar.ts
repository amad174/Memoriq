import { apiClient } from "./client";
import { MonthCalendarResponse, DayDetailResponse } from "@/types/calendar";

export async function getMonth(year: number, month: number): Promise<MonthCalendarResponse> {
  const res = await apiClient.get<MonthCalendarResponse>("/calendar/month", { params: { year, month } });
  return res.data;
}

export async function getDayDetail(date: string): Promise<DayDetailResponse> {
  const res = await apiClient.get<DayDetailResponse>("/calendar/day", { params: { date } });
  return res.data;
}
