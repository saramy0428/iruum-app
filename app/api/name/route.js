import { NextResponse } from "next/server";
import { generateDestinyName } from "../../../lib/generateDestinyName.js";
import { getFourPillars } from "../../../lib/saju.js";
import { getSupabaseServiceClient } from "../../../lib/supabase/server.js";

export async function POST(request) {
  try {
    const body = await request.json();

    // Server-side input shape massage
    //   The form sends gender as "Female" | "Male" | "Non-binary".
    //   The engine accepts "female" | "male" | "neutral".
    const genderMap = { female: "female", male: "male", "non-binary": "neutral" };
    const normalizedGender = genderMap[String(body.gender ?? "").toLowerCase()] ?? body.gender;

    const url = new URL(request.url);
    const sessionSeed = url.searchParams.get("seed") ?? null;

    const result = await generateDestinyName(
      { ...body, gender: normalizedGender },
      { sessionSeed, topN: 1 }   // UI shows only one name
    );

    const sajuResultId = await persistSajuResult(result);

    // Strip alternates from API response — keep payload tight for client
    const { alternates, sessionSeed: _, ...lean } = result;

    return NextResponse.json({ ...lean, sajuResultId });
  } catch (error) {
    if (error.code === "INVALID_INPUT") {
      return NextResponse.json(
        { error: "Invalid input", details: error.details },
        { status: 400 }
      );
    }
    console.error("Name generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate name" },
      { status: 500 }
    );
  }
}

// Saves the generator output for later product purchase.
// Returns the new row id, or null if persistence is unavailable —
// generator response stays useful even when Supabase is down or unconfigured.
async function persistSajuResult(result) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  try {
    const { input } = result;
    const [year, month, day] = input.birthDate.split("-").map(Number);
    const [hour, minute] = input.birthTime
      ? input.birthTime.split(":").map(Number)
      : [9, 0];
    const fourPillars = getFourPillars(year, month, day, hour, minute);

    const { data, error } = await supabase
      .from("saju_results")
      .insert({
        session_seed:     result.sessionSeed,
        input:            result.input,
        saju_summary:     result.sajuSummary,
        recommended_name: result.name,
        strategy:         result.strategy,
        reason:           result.reason,
        four_pillars:     fourPillars,
      })
      .select("id")
      .single();

    if (error) {
      console.error("saju_results insert failed:", error);
      return null;
    }
    return data.id;
  } catch (err) {
    console.error("saju_results insert threw:", err);
    return null;
  }
}
