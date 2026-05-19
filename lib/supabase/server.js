import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only operations (API routes, webhooks).
// Bypasses RLS — never import this from client components.

let _serviceClient;

// Strip trailing slashes and any path. supabase-js appends /rest/v1/... itself,
// so a URL like "https://xxx.supabase.co/" would yield "//rest/v1/..." → PGRST125.
function normalizeUrl(raw) {
  if (!raw) return raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    console.error("[supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL:", raw);
    return null;
  }
  if (url.pathname && url.pathname !== "/") {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL contains a path; stripping. Got:",
      raw, "→ using:", `${url.protocol}//${url.host}`
    );
  }
  return `${url.protocol}//${url.host}`;
}

export function getSupabaseServiceClient() {
  if (_serviceClient) return _serviceClient;

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      "[supabase] service client unavailable. URL set:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      "service key set:",
      !!key
    );
    return null;
  }

  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}
