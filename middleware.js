import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function normalizeUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env 누락 시 세션 갱신을 건너뛰고 페이지 렌더링은 통과시킴.
  // 인증이 진짜 필요한 흐름은 자기 라우트에서 자체적으로 에러를 표면화함.
  if (!url || !key) {
    console.warn("[middleware] Supabase env missing — skipping session refresh");
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // 세션 토큰 자동 갱신 — 실패해도 페이지는 떠야 하므로 try/catch로 격리
    await supabase.auth.getUser();
  } catch (err) {
    console.error("[middleware] session refresh failed:", err?.message ?? err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 파일·이미지·파비콘 제외, 나머지 모든 경로에 적용
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
