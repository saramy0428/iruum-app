"use client";

import { NameStampCTA } from "./result_cta";

export default function ResultCard({ result, surname, onTryAnother }) {
  const { name, sajuSummary, strategy, reason, sajuResultId } = result;

  function speakKoreanName() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(name.hangul);
    utterance.lang = "ko-KR";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-16 animate-fade-up">
      {/* ── Eyebrow ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="seal-mark" />
        <span className="eyebrow">Your Korean name</span>
      </div>

      {/* ── Centerpiece: the name itself ───────────────────────────────────── */}
      <div className="space-y-8">
        {/* Hanja — large, ceremonial, "stamped in" */}
        <div className="flex items-end gap-6 flex-wrap">
          <h1
            className="font-korean text-[6.5rem] leading-none tracking-tight text-ink animate-stamp-in"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            {name.hanja}
          </h1>
          <button
            onClick={speakKoreanName}
            aria-label="Hear pronunciation"
            className="mb-6 group flex items-center gap-2 text-stone hover:text-vermilion transition-colors"
          >
            <SpeakerIcon className="w-6 h-6" />
            <span className="eyebrow group-hover:text-vermilion transition-colors">Listen</span>
          </button>
        </div>

        {/* Hangul + Romanization line */}
        <div className="flex items-baseline gap-x-6 gap-y-2 flex-wrap">
          <h2 className="font-korean text-4xl text-ink/80">{name.hangul}</h2>
          <span className="font-display text-3xl italic text-stone">·</span>
          <span className="font-display text-3xl text-ink/80">
            {name.romanized} {surname}
          </span>
        </div>

        {/* Meaning */}
        <p className="font-display text-2xl italic text-ink/70 max-w-2xl leading-relaxed">
          “{name.meaning}”
        </p>
      </div>

      <div className="hairline" />

      {/* ── Saju Snapshot ──────────────────────────────────────────────────── */}
      <Section eyebrow="Your birth chart">
        <ElementBars distribution={sajuSummary.elementalDistribution} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-3 pt-2 font-serif text-base">
          <Stat label="Dominant element" value={sajuSummary.dominantElement} accent />
          <Stat
            label="Lacking element"
            value={sajuSummary.lackingElement ?? "Balanced"}
            accent={!!sajuSummary.lackingElement}
          />
          <Stat label="Balance state" value={sajuSummary.balanceState} />
        </div>
      </Section>

      {/* ── Why this name ──────────────────────────────────────────────────── */}
      <Section eyebrow="Why this name fits you">
        <p className="font-serif text-lg leading-relaxed text-ink/85 max-w-3xl">
          {reason}
        </p>

        {/* Syllable breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          {name.syllables.map((s, i) => (
            <div key={i} className="border-l border-ink/20 pl-5 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-korean text-3xl">{s.hanja}</span>
                <span className="font-korean text-xl text-stone">{s.hangul}</span>
              </div>
              <div className="eyebrow">{s.element}</div>
              <p className="font-serif text-base text-ink/75 italic">"{s.meaning}"</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <NameStampCTA recommendedName={name} />

      {/* ── Try another ────────────────────────────────────────────────────── */}
      <div className="pt-8 flex items-center gap-6">
        <button
          onClick={onTryAnother}
          className="group inline-flex items-center gap-3 text-stone hover:text-ink transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="20,4 4,12 20,20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="eyebrow">Start over</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ eyebrow, children }) {
  return (
    <section className="space-y-6 animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
      <div className="eyebrow">{eyebrow}</div>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="space-y-1">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-2xl ${accent ? "text-vermilion" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function ElementBars({ distribution }) {
  const order = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const max   = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2 max-w-2xl">
      {order.map((el) => {
        const pct = distribution[el] ?? 0;
        return (
          <div key={el} className="flex items-center gap-4">
            <span className="w-14 eyebrow shrink-0">{el}</span>
            <div className="flex-1 h-px relative">
              <div className="absolute inset-y-0 left-0 bg-ink/10 right-0" />
              <div
                className="absolute inset-y-[-3px] left-0 bg-ink"
                style={{ width: `${(pct / max) * 100}%` }}
              />
            </div>
            <span className="w-10 font-display text-sm text-stone tabular-nums text-right">
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
