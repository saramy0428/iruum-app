import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 로그인 후 돌아갈 경로. 기본값: 메인 페이지
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // code 없으면 잘못된 링크 — 로그인 페이지로 에러와 함께 돌려보냄
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 세션 생성 성공 — 원래 목적지로 이동
  return NextResponse.redirect(`${origin}${next}`);
}
