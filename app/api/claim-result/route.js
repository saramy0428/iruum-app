import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request) {
  // 1. 요청 바디에서 sessionSeed 추출
  let sessionSeed;
  try {
    const body = await request.json();
    sessionSeed = body?.sessionSeed;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!sessionSeed || typeof sessionSeed !== "string") {
    return NextResponse.json({ error: "sessionSeed required" }, { status: 400 });
  }

  // 2. 현재 로그인한 사용자 확인 (anon 키 + 쿠키 기반)
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. service-role 클라이언트로 익명 row를 현재 사용자에게 매핑
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.error("claim-result: Supabase service client unavailable");
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  // session_seed 일치 + user_id가 아직 NULL인 row만 UPDATE
  const { data, error } = await supabase
    .from("saju_results")
    .update({ user_id: user.id })
    .match({ session_seed: sessionSeed })
    .is("user_id", null)
    .select("id")
    .single();

  if (error) {
    // PGRST116: 매칭되는 row 없음 (이미 연결됐거나 seed 불일치)
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { claimed: false, reason: "not_found_or_already_claimed" },
        { status: 200 }
      );
    }
    console.error("claim-result: update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ claimed: true, sajuResultId: data.id });
}
