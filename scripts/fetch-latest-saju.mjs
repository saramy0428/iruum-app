// Dev helper: print id + session_seed of the most recent saju_results row.
// Used to construct test URLs for /api/render-pdf without touching the UI.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("saju_results")
  .select("id, session_seed, user_id, created_at, input")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (error) {
  console.error("Query failed:", error);
  process.exit(1);
}
if (!data) {
  console.log("No saju_results rows yet. Submit the form on / to create one.");
  process.exit(0);
}

console.log(JSON.stringify(data, null, 2));
