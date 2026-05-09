# iRuum (이룸) — Project Context for Claude Code

## What this is
A web app + e-commerce shop targeting overseas K-content fans.
Users enter their birth date, the app analyzes their Saju (사주, Four Pillars),
and recommends a Korean name personalized to their Five Elements profile.
The shop will sell custom stamps, digital infographics, and calendars based on
that name and analysis.

## Current status
- **Generator**: ✓ Built and deployed at https://iruum-app.vercel.app
  Form → Saju calc → element analysis → name match → result page.
- **Shop**: ✗ Not built yet. **This is the next phase.**
- **Domain**: Already purchased (separate from vercel subdomain).
- **Business registration**: In progress.

## Tech stack
- **Already in place**: Next.js 14 (App Router), React 18, Tailwind, Vercel
- **To add for shop**:
  - Supabase (Postgres, Auth, Storage)
  - Stripe Checkout (international payments, KR seller compatible)
  - Resend (transactional email)
  - @react-pdf/renderer (digital infographic product)
  - PostHog (funnel analytics)

## Key engine files (already built — do not break)
- `lib/saju.js` — Four Pillars calculation. Validated 24/24 against external 만세력.
- `lib/scoring.js` — Five Elements analysis from saju (analyzeSajuElements).
- `lib/generateDestinyName.js` — name matching engine.
  Deterministic via FNV-1a + Mulberry32. Same input → same name.
- `data/koreanNames.js` — 54 curated names with hanja, syllables, elementStrength, commonality.

## Design system
- Background: `#faf8f3` (paper cream)
- Text: `#1a1a1a` (ink black)
- Accent: `#c8392b` (vermilion — Korean stamp ink, used sparingly)
- Display: Cormorant Garamond (English), Noto Serif KR (Korean)
- Sans: Inter Tight (UI labels)
- Tailwind config has these as named tokens (`bg-paper`, `text-ink`, `text-vermilion`, etc.)

## Roadmap
**Phase 1 (4 weeks) — PDF Infographic launch ← START HERE**
  - Week 1: Supabase setup + DB schema (saju_results, orders, products, etc.)
  - Week 2: User accounts (Supabase Auth, magic link)
  - Week 3: PDF infographic generator (@react-pdf/renderer)
  - Week 4: Stripe Checkout + webhook + Resend email auto-delivery

**Phase 2 (4 weeks) — Add stamp product**
  - Stamp customizer UI (saju data auto-applied)
  - Vendor email automation (vendor partnership handled offline)
  - Order admin dashboard

**Phase 3 — Calendar, daily horoscope, multi-language (EN/JA/KO)**

## Open decisions (defer until needed)
- Whether to drop hanja in favor of pure hangul for foreign UX. Currently kept.
- Dataset expansion to ~500 names via syllable library approach. Currently 54.

## Constraints
- Solo developer. Optimize for low operational burden over flexibility.
- Korean business entity (registering). Stripe must accept KR sellers.
- International shipping primary (US/EU/JP customers).
- Generator UX must stay fast — it's the funnel top.

## Working style preferences
- Build incrementally; ship Phase 1 fully before starting Phase 2.
- Honest tradeoffs over rosy promises.
- For big changes, show me the plan before writing code.
- Use git branches for non-trivial work; merge to main only when working.
- Each meaningful change = one commit with clear message.

## Quick commands
- `npm run dev` — local dev server (port 3000)
- `npm run build` — production build (must pass before pushing to main)
