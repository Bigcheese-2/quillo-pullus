import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/config/env';

type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function supabaseRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  const url = `${supabaseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...headers,
  };

  if (method === "POST" || method === "PATCH") {
    requestHeaders.Prefer = "return=representation";
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === "POST" || method === "PATCH")) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      const error = new Error(
        errorText || `Request failed with status ${response.status}`
      );
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    if (method === "DELETE" && response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const networkError = new Error(
        "Network error: Unable to connect to the server. Please check your internet connection."
      );
      (networkError as Error & { status: number }).status = 0;
      throw networkError;
    }

    throw error;
  }
}

export function encodeUserId(userId: string): string {
  return encodeURIComponent(userId);
}

