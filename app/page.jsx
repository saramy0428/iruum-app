"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import InputForm from "../components/InputForm";
import ResultCard from "../components/ResultCard";
import Loading from "../components/Loading";

export default function Page() {
  const [phase, setPhase] = useState("intro"); // 'intro' | 'loading' | 'result' | 'error'
  const [result, setResult] = useState(null);
  const [surname, setSurname] = useState("");
  const [error,  setError]  = useState(null);

  // 로그인 후 돌아왔을 때 익명 결과를 계정에 연결
  useEffect(() => {
    async function claimIfNeeded() {
      const seed = localStorage.getItem("iruum_session_seed");
      if (!seed) return;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // 비로그인 상태면 skip

      const res = await fetch("/api/claim-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionSeed: seed }),
      });

      if (res.ok) {
        localStorage.removeItem("iruum_session_seed");
      }
    }

    claimIfNeeded();
  }, []);

  async function handleSubmit(payload) {
    setSurname(payload.surname);
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to generate name");
      }

      const data = await res.json();
      setResult(data);
      setPhase("result");

      // sessionSeed 저장 — 로그인 후 claim-result에서 사용
      if (data.sessionSeed) {
        try {
          localStorage.setItem("iruum_session_seed", data.sessionSeed);
        } catch {
          // localStorage 접근 불가 환경에서는 무시
        }
      }

      // Scroll to top so the user sees the name first
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  function reset() {
    setPhase("intro");
    setResult(null);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-3 group">
            <span className="seal-mark transition-transform group-hover:rotate-12" />
            <span className="font-display text-xl tracking-tight">iRuum</span>
          </button>
          <span className="eyebrow hidden sm:block">이룸 — your name in Korean</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
        {phase === "intro"   && <Intro   onContinue={() => setPhase("form")} />}
        {phase === "form"    && <FormSection onSubmit={handleSubmit} isLoading={false} />}
        {phase === "loading" && <Loading />}
        {phase === "result"  && (
          <ResultCard result={result} surname={surname} onTryAnother={reset} />
        )}
        {phase === "error"   && <ErrorView message={error} onRetry={() => setPhase("form")} />}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 mt-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 flex items-center justify-between text-stone">
          <span className="font-serif text-sm">© iRuum · Made in Seoul</span>
          <span className="eyebrow">사주 × 오행 × your story</span>
        </div>
      </footer>
    </main>
  );
}

// ─── Sub-views ─────────────────────────────────────────────────────────────────

function Intro({ onContinue }) {
  return (
    <div className="space-y-12 animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="seal-mark" />
        <span className="eyebrow">Iruum (이룸) means "name" in Korean</span>
      </div>

      <h1 className="font-display font-light text-5xl md:text-7xl leading-[1.05] text-ink tracking-tight">
        The Korean name<br/>
        <span className="italic text-vermilion">your birth chart</span><br/>
        calls for.
      </h1>

      <div className="space-y-6 max-w-2xl">
        <p className="font-serif text-xl leading-relaxed text-ink/80">
          For centuries, Koreans have asked naming experts to choose a baby's name based on their
          birth time, date, and place. The experts use the Five Elements — Wood, Fire, Earth, Metal, Water —
          to balance what's missing and create a name that brings good fortune.
        </p>
        <p className="font-display italic text-xl text-stone">
          For Koreans, a name is like a talisman.
        </p>
      </div>

      <div className="hairline" />

      <button
        onClick={onContinue}
        className="group inline-flex items-center gap-4 px-10 py-5 bg-ink text-paper hover:bg-vermilion transition-colors"
      >
        <span className="font-sans text-sm uppercase tracking-widest">Find my name</span>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
          <polyline points="14,6 20,12 14,18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function FormSection({ onSubmit, isLoading }) {
  return (
    <div className="space-y-12">
      <div className="space-y-4 animate-fade-up">
        <div className="eyebrow">Enter your details</div>
        <h2 className="font-display font-light text-4xl md:text-5xl leading-tight tracking-tight">
          Tell us when and where<br />
          you began.
        </h2>
        <p className="font-serif text-lg text-stone max-w-xl">
          The more accurate the time and place, the more personal your name will be.
          If you don't know, that's fine — choose "I don't know" and we'll work with what we have.
        </p>
      </div>

      <div className="hairline" />

      <InputForm onSubmit={onSubmit} isLoading={isLoading} />
    </div>
  );
}

function ErrorView({ message, onRetry }) {
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="seal-mark" />
        <span className="eyebrow">Something went wrong</span>
      </div>
      <p className="font-display italic text-2xl text-ink/70">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-3 text-stone hover:text-ink transition-colors"
      >
        <span className="eyebrow">Try again</span>
      </button>
    </div>
  );
}
