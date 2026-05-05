import { NextResponse } from "next/server";
import { generateDestinyName } from "../../../lib/generateDestinyName.js";

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

    // Strip alternates from API response — keep payload tight for client
    const { alternates, sessionSeed: _, ...lean } = result;

    return NextResponse.json(lean);
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
