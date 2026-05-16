// One-off setup for Supabase Storage buckets used by the app.
// Idempotent — safe to re-run.
//
// Usage (PowerShell):
//   Get-Content .env.local | ForEach-Object {
//     if ($_ -match '^([^=]+)=(.*)$') { Set-Item "env:$($matches[1])" $matches[2] }
//   }
//   node scripts/setup-storage.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing env. Load .env.local into the shell before running this script."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKETS = [
  { id: "infographics", public: false },
];

for (const b of BUCKETS) {
  const { data, error } = await supabase.storage.createBucket(b.id, {
    public: b.public,
  });

  if (error) {
    const exists =
      error.message?.toLowerCase().includes("already exists") ||
      error.statusCode === "409";
    if (exists) {
      console.log(`✓ bucket "${b.id}" already exists`);
      continue;
    }
    console.error(`✗ bucket "${b.id}" failed:`, error);
    process.exit(1);
  }
  console.log(`✓ bucket "${b.id}" created`, data);
}

console.log("Storage setup complete.");
