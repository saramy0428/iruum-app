import { createBrowserClient } from "@supabase/ssr";

let _client;

// Match server.js — strip path/trailing slash so REST URL composition stays clean.
function normalizeUrl(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return raw;
  }
}

export function getSupabaseBrowserClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return _client;
}
