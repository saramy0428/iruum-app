import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const ALLOWED_PRODUCT_TYPES = ["name-stamp", "goods-collection"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let email, productType;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    productType = body?.productType;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!ALLOWED_PRODUCT_TYPES.includes(productType)) {
    return NextResponse.json({ error: "Invalid productType" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.error("waitlist: Supabase service client unavailable");
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  // 중복은 조용히 무시 — unique(email, product_type) 충돌은 성공으로 취급
  const { error } = await supabase
    .from("waitlist")
    .upsert(
      { email, product_type: productType },
      { onConflict: "email,product_type", ignoreDuplicates: true }
    );

  if (error) {
    console.error("waitlist: insert failed:", error.message);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
