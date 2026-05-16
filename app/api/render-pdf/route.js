import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { InfographicPDF } from "../../../components/InfographicPDF.jsx";
import { getSupabaseServiceClient } from "../../../lib/supabase/server.js";

// @react-pdf/renderer pulls in native-ish deps that the Edge runtime can't load.
export const runtime = "nodejs";
// PDF render takes ~1–3s including the CJK font fetch; default of 10s on
// Vercel Hobby is tight. Bump to 30s.
export const maxDuration = 30;

const BUCKET = "infographics";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

// ─── HANDLERS ────────────────────────────────────────────────────────────────

// GET — anonymous access via session_seed soft token.
// Used by dev tooling and (eventually) any pre-auth share flow.
export async function GET(request) {
  const url = new URL(request.url);
  const sajuResultId = url.searchParams.get("sajuResultId");
  const seed = url.searchParams.get("seed");

  if (!sajuResultId) {
    return badRequest("sajuResultId query param is required");
  }
  return await handleRender({ sajuResultId, seed, authedUserId: null });
}

// POST — authenticated access via Supabase Auth cookie.
// Body: { sajuResultId: string }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON");
  }

  const sajuResultId = body?.sajuResultId;
  if (!sajuResultId || typeof sajuResultId !== "string") {
    return badRequest("sajuResultId is required in the request body");
  }

  // Cookie-based auth check. Without a Supabase session this returns null —
  // we treat that as 401 since this endpoint is gated to signed-in users.
  const authed = await getAuthedUser();
  if (!authed) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401 }
    );
  }

  return await handleRender({
    sajuResultId,
    seed: null,
    authedUserId: authed.id,
  });
}

// ─── CORE RENDER FLOW ────────────────────────────────────────────────────────

async function handleRender({ sajuResultId, seed, authedUserId }) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured on the server" },
      { status: 500 }
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from("saju_results")
    .select(
      "id, user_id, session_seed, input, saju_summary, recommended_name, reason, four_pillars, created_at"
    )
    .eq("id", sajuResultId)
    .maybeSingle();

  if (fetchError) {
    console.error("[render-pdf] saju_results fetch failed:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch saju result", details: fetchError.message },
      { status: 500 }
    );
  }
  if (!row) {
    return NextResponse.json({ error: "Saju result not found" }, { status: 404 });
  }

  // Access guard.
  //   authed path: row must belong to the requesting user.
  //   anon path:   seed must match the row's session_seed (soft token).
  if (authedUserId) {
    if (row.user_id !== authedUserId) {
      return NextResponse.json(
        { error: "You do not have access to this saju result" },
        { status: 403 }
      );
    }
  } else {
    if (!seed || seed !== row.session_seed) {
      return NextResponse.json(
        { error: "Missing or invalid seed for anonymous result" },
        { status: 401 }
      );
    }
  }

  // Render PDF.
  let pdfBuffer;
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(InfographicPDF, {
        surname: row.input?.surname,
        recommendedName: row.recommended_name,
        sajuSummary: row.saju_summary,
        fourPillars: row.four_pillars,
        reason: row.reason,
        generatedAt: row.created_at,
      })
    );
  } catch (err) {
    console.error("[render-pdf] PDF render failed:", err);
    return NextResponse.json(
      { error: "Failed to render PDF", details: err.message },
      { status: 500 }
    );
  }

  // Upload + sign.
  const objectPath = `${row.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[render-pdf] storage upload failed:", uploadError);
    const hint =
      uploadError.message?.toLowerCase().includes("bucket")
        ? "Bucket 'infographics' is missing — run scripts/setup-storage.mjs or apply the storage migration."
        : null;
    return NextResponse.json(
      { error: "Failed to upload PDF", details: uploadError.message, hint },
      { status: 500 }
    );
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    console.error("[render-pdf] signed URL failed:", signError);
    return NextResponse.json(
      { error: "Failed to create signed URL", details: signError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    path: objectPath,
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Reads the Supabase Auth session from cookies set by @supabase/ssr on the
// browser. Returns { id } or null. Uses the anon key — the cookie itself is
// the auth proof, no service-role needed for the user lookup.
async function getAuthedUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  const client = createServerClient(url, key, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      // Route handlers can't set cookies on the response from inside a server
      // client callback in Next 14. Auth session refresh happens in middleware
      // (Week 2 work) — we just read here.
      set() {},
      remove() {},
    },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
