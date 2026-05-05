# iRuum — Korean Destiny Name Generator

A web app that gives foreigners a Korean name based on their birth date,
calculated through Saju (사주, Four Pillars) and the Five Elements.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project structure

```
iruum-app/
├── app/
│   ├── page.jsx              ← Single-page app: intro → form → result
│   ├── layout.jsx            ← Root layout, fonts
│   ├── globals.css           ← Tailwind + base styles
│   └── api/name/route.js     ← POST /api/name endpoint
├── components/
│   ├── InputForm.jsx         ← Birth-data form
│   ├── ResultCard.jsx        ← Korean name display + saju snapshot
│   └── Loading.jsx           ← Loading state with vermilion seal pulse
├── lib/                      ← Engine (server-side only)
│   ├── saju.js               ← Four Pillars calculation
│   ├── scoring.js            ← Element analysis
│   └── generateDestinyName.js
├── data/koreanNames.js       ← 54 curated names with hanja
├── tailwind.config.js
└── package.json
```

## API

### `POST /api/name`

```json
// Request
{
  "surname":   "Anderson",
  "birthDate": "1990-05-12",
  "birthTime": "09:30",
  "gender":    "Male"
}

// Response
{
  "name": {
    "hangul":   "태윤",
    "hanja":    "泰潤",
    "romanized": "Taeyun",
    "meaning":  "great peace, deep nourishment",
    "syllables": [...],
    ...
  },
  "sajuSummary":  { ... },
  "strategy":     { ... },
  "reason":       "Your birth chart shows strong Fire energy..."
}
```

Optional query param: `?seed=alt-1` — use a different seed for re-roll.

## Design system

- **Background**: warm cream paper (`#faf8f3`)
- **Text**: ink black (`#1a1a1a`) primary, stone gray secondary
- **Accent**: vermilion (`#c8392b`) — Korean stamp ink, used sparingly
- **Display**: Cormorant Garamond (English), Noto Serif KR (Korean)
- **UI labels**: Inter Tight, small caps, wide tracking

## Deployment

Vercel:
```bash
npx vercel
```

Environment variables: none required for v1.

## Roadmap

- [x] Saju engine + name matching
- [x] Wireframe-faithful UI
- [x] Browser TTS pronunciation (Web Speech API)
- [ ] Higher-quality TTS (Google Cloud TTS)
- [ ] Stamp purchase flow (Stripe + fulfillment partner)
- [ ] Dataset expansion to 500 names (syllable library approach)
