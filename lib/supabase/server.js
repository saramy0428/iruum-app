import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only operations (API routes, webhooks).
// Bypasses RLS — never import this from client components.

let _serviceClient;

export function getSupabaseServiceClient() {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}
