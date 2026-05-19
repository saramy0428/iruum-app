"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // 콜백 후 돌아갈 경로를 redirectTo에 포함
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error("magic link error:", error.message);
      setErrorMsg("링크 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  // URL 에러 파라미터 → 한국어 메시지 변환
  const urlErrorMsg =
    urlError === "missing_code"
      ? "유효하지 않은 링크입니다. 다시 시도해 주세요."
      : urlError === "auth_failed"
      ? "인증에 실패했습니다. 링크가 만료됐을 수 있습니다."
      : null;

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 / 타이틀 */}
        <div className="text-center mb-10">
          <p className="font-sans text-xs tracking-[0.25em] uppercase text-ink/40 mb-3">
            이룸 · iRuum
          </p>
          <h1 className="font-display text-3xl text-ink leading-tight">
            내 사주 결과
            <br />
            <span className="text-vermilion">저장하기</span>
          </h1>
          <p className="mt-4 font-sans text-sm text-ink/60 leading-relaxed">
            이메일로 로그인 링크를 보내드립니다.
            <br />
            비밀번호가 필요 없습니다.
          </p>
        </div>

        {/* URL 에러 배너 */}
        {urlErrorMsg && (
          <div className="mb-6 px-4 py-3 border border-vermilion/30 bg-vermilion/5 rounded text-sm text-vermilion font-sans">
            {urlErrorMsg}
          </div>
        )}

        {status === "sent" ? (
          /* 발송 완료 상태 */
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✉️</div>
            <p className="font-display text-xl text-ink mb-2">
              이메일을 확인해 주세요
            </p>
            <p className="font-sans text-sm text-ink/60 leading-relaxed">
              <strong className="text-ink">{email}</strong> 로
              <br />
              로그인 링크를 보냈습니다.
              <br />
              링크는 1시간 동안 유효합니다.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 font-sans text-xs text-ink/40 underline underline-offset-2 hover:text-ink transition-colors"
            >
              다른 이메일로 다시 시도
            </button>
          </div>
        ) : (
          /* 이메일 입력 폼 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-sans text-xs tracking-wider uppercase text-ink/50 mb-2"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className="w-full px-4 py-3 bg-white border border-ink/15 rounded
                           font-sans text-sm text-ink placeholder-ink/30
                           focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20
                           disabled:opacity-50 transition-colors"
              />
            </div>

            {status === "error" && (
              <p className="font-sans text-xs text-vermilion">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="w-full py-3 bg-ink text-paper font-sans text-sm tracking-wider
                         hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors rounded"
            >
              {status === "loading" ? "발송 중…" : "로그인 링크 받기"}
            </button>
          </form>
        )}

        {/* 하단 설명 */}
        <p className="mt-8 text-center font-sans text-xs text-ink/30 leading-relaxed">
          로그인하면 사주 분석 결과가
          <br />내 계정에 영구 저장됩니다.
        </p>
      </div>
    </main>
  );
}

// useSearchParams는 Suspense 안에서 써야 함
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
