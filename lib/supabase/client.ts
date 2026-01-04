// Environment variables validated at module load time
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

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
  const url = `${SUPABASE_URL}${endpoint}`;

  // Required headers per Supabase REST API spec
  const requestHeaders: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...headers,
  };

  // Return created/updated object in response (Supabase requirement)
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

    // DELETE returns 204 No Content (no body)
    if (method === "DELETE" && response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    // Detect network failures (offline, CORS, DNS issues)
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

// URL encode email addresses for query parameters (required for special characters)
export function encodeUserId(userId: string): string {
  return encodeURIComponent(userId);
}

