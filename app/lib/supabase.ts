import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export const AUTH_ACCESS_COOKIE_NAME = "piggy-crm-access-token";
export const AUTH_REFRESH_COOKIE_NAME = "piggy-crm-refresh-token";

type JsonRecord = Record<string, unknown>;

function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!value) {
    throw new Error("Missing Supabase URL. Configure NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.");
  }

  return value;
}

function getSupabasePublishableKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_KEY;

  if (!value) {
    throw new Error(
      "Missing Supabase key. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY."
    );
  }

  return value;
}

function getMetadataBoolean(record: JsonRecord, key: string): boolean {
  const value = record[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return false;
}

export function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  const authorizationHeaders = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined;

  return createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: authorizationHeaders
      ? {
          headers: authorizationHeaders,
        }
      : undefined,
  });
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const appMetadata =
    typeof user.app_metadata === "object" && user.app_metadata !== null
      ? (user.app_metadata as JsonRecord)
      : null;

  if (!appMetadata) {
    return false;
  }

  return getMetadataBoolean(appMetadata, "is_admin") || appMetadata.role === "admin";
}
