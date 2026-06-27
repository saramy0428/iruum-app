"use client";

import { NameStampCTA } from "./result_cta";

const CARD = "bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-5";

const ELEMENT_COLORS = {
  Wood:  "#4ade80",
  Fire:  "#f87171",
  Earth: "#fbbf24",
  Metal: "#e2e8f0",
  Water: "#60a5fa",
};

export default function ResultCard({ result, surname, onTryAnother }) {
  const { name, sajuSummary, reason } = result;
  const displaySurname = surname
    ? surname.charAt(0).toUpperCase() + surname.slice(1)
    : "";

  function speakKoreanName() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(name.hangul);
    utterance.lang = "ko-KR";
    utterance.rate = 0.6;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      {/* ── Card 1: The name ─────────────────────────────────────────────── */}
      <section className={CARD}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="eyebrow">Your Korean name</span>
          <button
            onClick={speakKoreanName}
            aria-label="Hear pronunciation"
            className="flex items-center gap-1.5 text-stone hover:text-vermilion transition-colors"
          >
            <SpeakerIcon className="w-4 h-4" />
            <span className="eyebrow">Listen</span>
          </button>
        </div>

        <h1
          className="font-korean text-5xl md:text-7xl leading-none tracking-tight text-ink animate-stamp-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          {name.hanja}
        </h1>

        <div className="mt-3 flex items-baseline gap-x-3 gap-y-1 flex-wrap">
          <h2 className="font-korean text-2xl md:text-3xl text-ink/85">{name.hangul}</h2>
          <span className="font-display italic text-stone">·</span>
          <span className="font-display text-xl md:text-2xl text-ink/80">
            {name.romanized} {displaySurname}
          </span>
        </div>

        <p className="mt-3 font-display italic text-base md:text-lg text-ink/70 leading-relaxed">
          “{name.meaning}”
        </p>
      </section>

      {/* ── Card 2: Five Elements ────────────────────────────────────────── */}
      <section className={CARD}>
        <div className="eyebrow mb-3">오행 · Five Elements</div>
        <ElementBars distribution={sajuSummary.elementalDistribution} />
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-ink/10">
          <Stat label="Dominant" value={sajuSummary.dominantElement} accent />
          <Stat
            label="Lacking"
            value={sajuSummary.lackingElement ?? "Balanced"}
            accent={!!sajuSummary.lackingElement}
          />
          <Stat label="Balance" value={sajuSummary.balanceState} />
        </div>
      </section>

      {/* ── Card 3: Why this name ────────────────────────────────────────── */}
      <section className={CARD}>
        <div className="eyebrow mb-3">Why this name fits you</div>
        <p className="font-serif text-sm md:text-base leading-relaxed text-ink/85">
          {reason}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-ink/10">
          {name.syllables.map((s, i) => (
            <div key={i} className="border-l-2 border-vermilion/40 pl-3 space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-korean text-2xl text-ink">{s.hanja}</span>
                <span className="font-korean text-base text-stone">{s.hangul}</span>
              </div>
              <div className="eyebrow">{s.element}</div>
              <p className="font-serif text-xs md:text-sm text-ink/75 italic">"{s.meaning}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA card (stamp upsell) ──────────────────────────────────────── */}
      <section className={CARD}>
        <NameStampCTA recommendedName={name} />
      </section>

      {/* ── Start over ───────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-6 pb-2">
        <button
          onClick={onTryAnother}
          className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/25 text-ink font-sans text-sm uppercase tracking-widest transition-all"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <polyline points="20,4 4,12 20,20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Start over</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value, accent }) {
  return (
    <div className="space-y-0.5">
      <div className="eyebrow text-[10px]">{label}</div>
      <div className={`font-display text-base md:text-lg leading-tight ${accent ? "text-vermilion" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function ElementBars({ distribution }) {
  const order = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const max = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2">
      {order.map((el) => {
        const pct = distribution[el] ?? 0;
        return (
          <div key={el} className="flex items-center gap-3">
            <span
              className="w-12 eyebrow text-[10px] shrink-0"
              style={{ color: ELEMENT_COLORS[el] }}
            >
              {el}
            </span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${(pct / max) * 100}%`,
                  backgroundColor: ELEMENT_COLORS[el],
                }}
              />
            </div>
            <span className="w-9 font-display text-xs text-stone tabular-nums text-right">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SpeakerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 9a4 4 0 010 6" strokeLinecap="round" />
      <path d="M19 6a8 8 0 010 12" strokeLinecap="round" />
    </svg>
  );
}
