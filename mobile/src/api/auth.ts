import { apiClient } from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

export async function signup(email: string, password: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/signup", { email, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/login", { email, password });
  return res.data;
}
