import Link from "next/link";

export const metadata = {
  title: "Order your Korean name stamp — iRuum",
  description:
    "A traditional Korean seal carved with your personalized Korean name. Hand-finished, made to order, ships worldwide.",
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
// Edit here. `display` is what we render; `cents` is what the checkout will use.
const PRICE = {
  currency: "USD",
  cents: 4900,
  display: "$49",
};

// ─── Shipping copy (placeholder until vendor partnership locked) ──────────────
const PRODUCTION_TIME = "7–10 business days";
const SHIPPING_TIME   = "5–14 business days (international)";

export default function StampPage({ searchParams }) {
  const personalized = readPersonalization(searchParams);

  return (
    <main className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="seal-mark transition-transform group-hover:rotate-12" />
            <span className="font-display text-xl tracking-tight">iRuum</span>
          </Link>
          <span className="eyebrow hidden sm:block">이룸 — your name in Korean</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-16 animate-fade-up">
        {/* ── Personalization banner (only when query params present) ──────── */}
        {personalized && (
          <div className="border border-vermilion/30 bg-vermilion/[0.04] px-6 py-5 flex items-center gap-4 flex-wrap">
            <span className="seal-mark" />
            <div className="space-y-1">
              <div className="eyebrow text-vermilion">Your stamp will feature</div>
              <div className="font-korean text-2xl text-ink leading-tight">
                {personalized.hangul}
                {personalized.hanja && (
                  <span className="text-ink/60"> ({personalized.hanja})</span>
                )}
                {personalized.romanized && (
                  <>
                    <span className="font-display italic text-stone"> · </span>
                    <span className="font-display text-2xl text-ink/80">
                      {personalized.romanized}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="seal-mark" />
            <span className="eyebrow">The Korean name stamp</span>
          </div>

          <h1 className="font-display font-light text-5xl md:text-6xl leading-[1.05] text-ink tracking-tight">
            A name carved in stone,<br />
            <span className="italic text-vermilion">stamped in vermilion ink.</span>
          </h1>

          <div className="space-y-5 max-w-2xl">
            <p className="font-serif text-xl leading-relaxed text-ink/80">
              In Korea, a personal seal — <em>dojang</em> (도장) — is more than a signature.
              It's a small object you carry through life: pressed onto contracts, gift letters,
              family records, and the back of paintings. Each one is unique.
            </p>
            <p className="font-display italic text-xl text-stone">
              A keepsake, a talisman, a gift you can press into the page.
            </p>
          </div>
        </section>

        <div className="hairline" />

        {/* ── What's included ──────────────────────────────────────────────── */}
        <Section eyebrow="What's included">
          <ul className="space-y-5 max-w-2xl">
            <Item
              title="Custom Korean name stamp"
              sub="Hand-finished seal carved with your Korean name in hanja or hangul."
            />
            <Item
              title="Name card · certificate"
              sub="A small printed card explaining the meaning of your name and the elements it carries."
            />
            <Item
              title="Protective packaging"
              sub="A simple, gift-ready box with a cloth wrap and a vial of vermilion ink paste."
            />
          </ul>
        </Section>

        <div className="hairline" />

        {/* ── Price ────────────────────────────────────────────────────────── */}
        <Section eyebrow="Price">
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="font-display text-6xl text-ink leading-none">
              {PRICE.display}
            </span>
            <span className="eyebrow">{PRICE.currency} · one-time</span>
          </div>
          <p className="font-serif text-base text-stone max-w-xl">
            Final price at checkout. International shipping is calculated based on your address.
          </p>
        </Section>

        <div className="hairline" />

        {/* ── Shipping ─────────────────────────────────────────────────────── */}
        <Section eyebrow="Made to order">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 max-w-2xl pt-1">
            <Stat label="Production" value={PRODUCTION_TIME} />
            <Stat label="Shipping"   value={SHIPPING_TIME} />
          </div>
          <p className="font-serif text-base text-ink/70 max-w-2xl leading-relaxed">
            Each stamp is carved after the order is placed. We ship worldwide from Seoul.
            Production and shipping times are estimates — you'll receive tracking once it leaves the workshop.
          </p>
        </Section>

        <div className="hairline" />

        {/* ── Payment CTA (Stripe wiring deferred) ─────────────────────────── */}
        <Section eyebrow="Checkout">
          <div className="space-y-4">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="group inline-flex items-center gap-4 px-8 py-4 bg-ink/30 text-paper cursor-not-allowed"
            >
              <span className="font-sans text-sm uppercase tracking-widest">
                Proceed to payment
              </span>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
                <polyline points="14,6 20,12 14,18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="eyebrow">Checkout opens soon — Stripe integration in progress</p>
          </div>
        </Section>

        {/* ── Back link ────────────────────────────────────────────────────── */}
        <div className="pt-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-stone hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20,4 4,12 20,20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="eyebrow">Back to your name</span>
          </Link>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 mt-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 flex items-center justify-between text-stone">
          <span className="font-serif text-sm">© iRuum · Made in Seoul</span>
          <span className="eyebrow">사주 × 오행 × your story</span>
        </div>
      </footer>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readPersonalization(searchParams) {
  const hangul    = pickString(searchParams?.name);
  const hanja     = pickString(searchParams?.hanja);
  const romanized = pickString(searchParams?.romanized);
  if (!hangul && !hanja && !romanized) return null;
  return { hangul, hanja, romanized };
}

function pickString(value) {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) return pickString(value[0]);
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ eyebrow, children }) {
  return (
    <section className="space-y-6">
      <div className="eyebrow">{eyebrow}</div>
      {children}
    </section>
  );
}

function Item({ title, sub }) {
  return (
    <li className="border-l border-ink/20 pl-5 space-y-1">
      <div className="font-display text-2xl text-ink leading-tight">{title}</div>
      <p className="font-serif text-base text-ink/70">{sub}</p>
    </li>
  );
}

function Stat({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-xl text-ink">{value}</div>
    </div>
  );
}
