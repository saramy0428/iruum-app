"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import ResultCard from "../components/ResultCard";
import Loading from "../components/Loading";
import { COUNTRY_OPTIONS } from "../lib/longitudeCorrection.js";

export default function Page() {
  const [phase, setPhase] = useState("form"); // 'form' | 'loading' | 'result' | 'error'
  const [result, setResult] = useState(null);
  const [surname, setSurname] = useState("");
  const [error, setError] = useState(null);

  const resultRef = useRef(null);

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
      if (!user) return;

      const res = await fetch("/api/claim-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionSeed: seed }),
      });

      if (res.ok) localStorage.removeItem("iruum_session_seed");
    }
    claimIfNeeded();
  }, []);

  // Scroll to results when they appear
  useEffect(() => {
    if (phase === "result" || phase === "loading") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

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

      if (data.sessionSeed) {
        try { localStorage.setItem("iruum_session_seed", data.sessionSeed); }
        catch { /* localStorage 불가 */ }
      }
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  function reset() {
    setPhase("form");
    setResult(null);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-ink/10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 group">
            <span className="seal-mark transition-transform group-hover:rotate-12" />
            <span className="font-display text-lg tracking-tight">iRuum</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        <Hero />

        <CompactForm onSubmit={handleSubmit} isLoading={phase === "loading"} />

        <div ref={resultRef}>
          {phase === "loading" && (
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <Loading />
            </div>
          )}
          {phase === "result" && (
            <ResultCard result={result} surname={surname} onTryAnother={reset} />
          )}
          {phase === "error" && <ErrorView message={error} onRetry={reset} />}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 mt-12">
        <div className="max-w-md mx-auto px-4 py-6 flex items-center justify-between text-stone text-xs">
          <span className="font-serif">© iRuum · Made in Seoul</span>
          <span className="eyebrow">사주 × 오행</span>
        </div>
      </footer>
    </main>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <span className="seal-mark" />
        <span className="eyebrow">Find your Korean name through Saju</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight text-ink">
        The Korean name <span className="italic text-vermilion">your birth chart</span> calls for.
      </h1>
    </div>
  );
}

// ─── Compact Form ─────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1930 + 1 }, (_, i) => CURRENT_YEAR - i);
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_10 = [0, 10, 20, 30, 40, 50];

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
}

function CompactForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    surname:      "",
    birthYear:    "",
    birthMonth:   "",
    birthDay:     "",
    birthHour:    "",
    birthMinute:  "",
    timeUnknown:  false,
    birthCountry: "",
    gender:       "",
    consent:      false,
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Y/M 변경 시 day가 해당 월의 최대일을 초과하면 클램프 (Feb 30 → Feb 28 등)
  const updateDatePart = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      const max = daysInMonth(next.birthYear, next.birthMonth);
      if (next.birthDay && parseInt(next.birthDay, 10) > max) {
        next.birthDay = String(max);
      }
      return next;
    });
  };

  const dateComplete = form.birthYear && form.birthMonth && form.birthDay;
  const timeComplete = form.birthHour !== "" && form.birthMinute !== "";

  const canSubmit =
    form.surname.trim() &&
    dateComplete &&
    (form.timeUnknown || timeComplete) &&
    form.gender &&
    form.consent &&
    !isLoading;

  function combineDate() {
    const m = String(form.birthMonth).padStart(2, "0");
    const d = String(form.birthDay).padStart(2, "0");
    return `${form.birthYear}-${m}-${d}`;
  }

  function combineTime() {
    if (form.timeUnknown) return null;
    const h = String(form.birthHour).padStart(2, "0");
    const m = String(form.birthMinute).padStart(2, "0");
    return `${h}:${m}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      surname:      form.surname.trim(),
      birthDate:    combineDate(),
      birthTime:    combineTime(),
      birthCountry: form.birthCountry || null,
      gender:       form.gender,
    });
  }

  const inputBase =
    "w-full bg-rice/40 border border-ink/15 rounded-lg px-3 py-2.5 " +
    "text-ink text-base placeholder:text-stone/60 " +
    "focus:outline-none focus:border-vermilion/60 focus:ring-1 focus:ring-vermilion/30 transition";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Surname */}
      <label className="block space-y-1.5">
        <span className="eyebrow">Last name (for display only)</span>
        <input
          type="text"
          autoComplete="family-name"
          placeholder="e.g. Anderson"
          value={form.surname}
          onChange={(e) => update("surname", e.target.value)}
          className={inputBase}
          required
        />
      </label>

      {/* Date — 3 selects: Year / Month / Day */}
      <div className="space-y-1.5">
        <span className="eyebrow">Birth date</span>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={form.birthYear}
            onChange={(e) => updateDatePart("birthYear", e.target.value)}
            className={inputBase}
            aria-label="Birth year"
            required
          >
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={form.birthMonth}
            onChange={(e) => updateDatePart("birthMonth", e.target.value)}
            className={inputBase}
            aria-label="Birth month"
            required
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={form.birthDay}
            onChange={(e) => updateDatePart("birthDay", e.target.value)}
            className={inputBase}
            aria-label="Birth day"
            required
          >
            <option value="">Day</option>
            {Array.from(
              { length: daysInMonth(form.birthYear, form.birthMonth) },
              (_, i) => i + 1
            ).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Time — 2 selects: Hour (24h) / Minute (10-min steps) */}
      <div className="space-y-1.5">
        <span className="eyebrow flex items-center justify-between">
          <span>Birth time</span>
          <button
            type="button"
            onClick={() => update("timeUnknown", !form.timeUnknown)}
            className={`text-[10px] tracking-wider transition-colors ${
              form.timeUnknown ? "text-vermilion" : "text-stone hover:text-ink"
            }`}
          >
            {form.timeUnknown ? "✓ unknown" : "unknown?"}
          </button>
        </span>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.birthHour}
            onChange={(e) => update("birthHour", e.target.value)}
            disabled={form.timeUnknown}
            className={`${inputBase} disabled:opacity-40`}
            aria-label="Birth hour"
            required={!form.timeUnknown}
          >
            <option value="">Hour</option>
            {HOURS_24.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
            ))}
          </select>
          <select
            value={form.birthMinute}
            onChange={(e) => update("birthMinute", e.target.value)}
            disabled={form.timeUnknown}
            className={`${inputBase} disabled:opacity-40`}
            aria-label="Birth minute"
            required={!form.timeUnknown}
          >
            <option value="">Minute</option>
            {MINUTES_10.map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Birth country — for longitude / true solar time correction */}
      <label className="block space-y-1.5">
        <span className="eyebrow flex items-center justify-between">
          <span>Birth country</span>
          <span className="text-[10px] tracking-wider text-stone">optional</span>
        </span>
        <select
          value={form.birthCountry}
          onChange={(e) => update("birthCountry", e.target.value)}
          className={inputBase}
          aria-label="Country of birth"
        >
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
          <option value="other">Other</option>
        </select>
      </label>

      {/* Gender — row of pills */}
      <div className="space-y-1.5">
        <span className="eyebrow">Gender</span>
        <div className="grid grid-cols-3 gap-2">
          {["Female", "Male", "Non-binary"].map((g) => {
            const active = form.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => update("gender", g)}
                className={`px-2 py-2 rounded-lg text-sm border transition-colors ${
                  active
                    ? "bg-vermilion/20 border-vermilion text-ink"
                    : "bg-rice/30 border-ink/15 text-stone hover:text-ink hover:border-ink/40"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consent */}
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="sr-only"
        />
        <span
          className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border transition-colors flex items-center justify-center ${
            form.consent
              ? "bg-vermilion border-vermilion"
              : "border-ink/40 group-hover:border-ink"
          }`}
        >
          {form.consent && (
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-paper" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="2.5,6 5,8.5 9.5,3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-xs text-stone leading-snug">
          I consent to my birth info being used only to generate my Korean name.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-3 rounded-lg font-sans text-sm uppercase tracking-widest transition-colors ${
          canSubmit
            ? "bg-vermilion text-paper hover:bg-vermilion/85"
            : "bg-ink/15 text-ink/40 cursor-not-allowed"
        }`}
      >
        {isLoading ? "Calculating…" : "Find my Korean name"}
      </button>
    </form>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorView({ message, onRetry }) {
  return (
    <div className="bg-white/[0.07] backdrop-blur-md border border-vermilion/30 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="seal-mark" />
        <span className="eyebrow text-vermilion">Something went wrong</span>
      </div>
      <p className="font-display italic text-base text-ink/80">{message}</p>
      <button
        onClick={onRetry}
        className="eyebrow text-stone hover:text-ink transition-colors"
      >
        Try again →
      </button>
    </div>
  );
}
