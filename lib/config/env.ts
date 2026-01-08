
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set in environment variables. Please check your .env.local file.'
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables. Please check your .env.local file.'
    );
  }
  return key;
}

export function getUserId(): string {
  const userId = process.env.NEXT_PUBLIC_USER_ID;
  if (!userId) {
    throw new Error(
      'NEXT_PUBLIC_USER_ID is not set in environment variables. Please check your .env.local file.'
    );
  }
  return userId;
}

export function getNodeEnv(): string {
  return process.env.NODE_ENV || 'development';
}

export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

export function getEnv() {
  return {
    supabaseUrl: getSupabaseUrl(),
    supabaseAnonKey: getSupabaseAnonKey(),
    userId: getUserId(),
    nodeEnv: getNodeEnv(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
  } as const;
}

export type EnvConfig = ReturnType<typeof getEnv>;
