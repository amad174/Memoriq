import { apiClient } from "./client";
import { SearchResult } from "@/types/note";

export async function search(query: string, mode: "keyword" | "semantic" = "keyword"): Promise<SearchResult[]> {
  const res = await apiClient.get<SearchResult[]>("/search", { params: { q: query, mode } });
  return res.data;
}
