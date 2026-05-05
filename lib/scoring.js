/**
 * scoring.js — Cross-System Alignment & Scoring Engine v2.2
 *
 * Outputs:  DestinyScoreOutput (schema v2)
 * Maintains: legacy scoreDestinyAlignment() shim until narrative.js is migrated.
 *
 * Replaced scoring_legacy.js (v1) with the following corrections:
 *   - weakestElement removed → lackingElement throughout (단일 정식 이름)
 *   - ELEMENT_AFFINITY.weakens corrected to proper 상극 cycle
 *   - analyzeSajuElements: full 5-element distribution, 5-state balanceState,
 *     dominantPolarity, elementConflict (dominant→lacking direction only)
 *   - scoreSajuInternal: stem×stem + branch×branch + cross stem↔branch pairs
 *     with named weights STEM_WEIGHT / BRANCH_WEIGHT / CROSS_WEIGHT
 *   - Three independent sub-scorers with explicit LAYER_WEIGHTS
 *   - computeTraitFingerprint: Trait objects {id, source, strength},
 *     shadowTraits, archetypeSeeds; Air key removed from ELEMENT_TRAITS
 *   - computeRecommendationSignals: multi-factor balance + talent confidence,
 *     effectiveWeight on all three SignalObjects
 *     balance.element = lackingElement (補), talent.element = dominantElement (才)
 *   - crossSystemHarmony, scoreBreakdown added to public return shape
 *   - Legacy scoreDestinyAlignment() shim preserved for narrative.js compatibility
 */


// ─── ELEMENT VOCABULARY ───────────────────────────────────────────────────────

const ALL_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

// Bridge tables used only in the Saju↔Astrology comparison layer.
// Trait lookup always uses Saju vocabulary directly.
const SAJU_TO_WESTERN = {
  Wood: 'Air', Fire: 'Fire', Earth: 'Earth', Metal: 'Air', Water: 'Water',
};
const WESTERN_TO_SAJU = {
  Fire: 'Fire', Earth: 'Earth', Air: 'Metal', Water: 'Water',
};

export function bridgeElement(sajuEl) {
  return SAJU_TO_WESTERN[sajuEl] ?? sajuEl;
}

// ─── ELEMENT AFFINITY (상생 / 상극 cycles) ────────────────────────────────────
//
// Generating cycle (상생): Wood→Fire→Earth→Metal→Water→Wood
// Overcoming cycle (상극): Wood→Earth→Water→Fire→Metal→Wood
//
// 'weakens' = the element this one actively overcomes:
//   Wood weakens Earth (木克土), Earth weakens Water (土克水),
//   Water weakens Fire (水克火), Fire weakens Metal (火克金),
//   Metal weakens Wood (金克木)

const ELEMENT_AFFINITY = {
  Wood:  { generates: 'Fire',  weakens: 'Earth' },
  Fire:  { generates: 'Earth', weakens: 'Metal' },
  Earth: { generates: 'Metal', weakens: 'Water' },
  Metal: { generates: 'Water', weakens: 'Wood'  },
  Water: { generates: 'Wood',  weakens: 'Fire'  },
};

function sajuElementScore(a, b) {
  if (a === b) return 3;
  if (ELEMENT_AFFINITY[a]?.generates === b || ELEMENT_AFFINITY[b]?.generates === a) return 2;
  if (ELEMENT_AFFINITY[a]?.weakens   === b || ELEMENT_AFFINITY[b]?.weakens   === a) return 0;
  return 1;
}

// ─── GRADE THRESHOLDS ────────────────────────────────────────────────────────

const GRADE_THRESHOLDS = { S: 85, A: 70, B: 55, C: 40, D: 0 };

function toGrade(pct) {
  if (pct >= 85) return 'S';
  if (pct >= 70) return 'A';
  if (pct >= 55) return 'B';
  if (pct >= 40) return 'C';
  return 'D';
}

// ─── LAYER WEIGHTS ────────────────────────────────────────────────────────────

const LAYER_WEIGHTS = { saju: 0.40, astrology: 0.35, numerology: 0.25 };

// ─── 1. ELEMENT ANALYSIS ─────────────────────────────────────────────────────

export function analyzeSajuElements(fourPillars) {
  const raw = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  for (const pillar of Object.values(fourPillars)) {
    const s = pillar.heavenlyStem?.element;
    const b = pillar.earthlyBranch?.element;
    if (s && raw[s] !== undefined) raw[s]++;
    if (b && raw[b] !== undefined) raw[b]++;
  }

  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const dist  = {};
  for (const el of ALL_ELEMENTS) dist[el] = Math.round((raw[el] / total) * 100);

  const sorted = ALL_ELEMENTS
    .map(el => ({ element: el, count: raw[el], pct: dist[el] }))
    .sort((a, b) => b.count - a.count);

  const dominant = sorted[0].element;
  const weakest  = sorted[sorted.length - 1];
  const lacking  = weakest.pct < 10 ? weakest.element : null;

  const maxPct = sorted[0].pct;
  const minPct = weakest.pct;
  const balanceState =
    maxPct > 40 && minPct < 5 ? 'polarized'  :
    maxPct > 40               ? 'dominant'   :
    minPct < 5                ? 'deficient'  :
    maxPct < 25               ? 'scattered'  : 'harmonious';

  const pillarsArr       = Object.values(fourPillars);
  const yangCount        = pillarsArr.filter(p => p.heavenlyStem?.yinYang === 'Yang').length;
  const dominantPolarity = yangCount >= Math.ceil(pillarsArr.length / 2) ? 'yang' : 'yin';

  // elementConflict: dominant actively suppresses lacking (상극, dominant→lacking only).
  // The reverse (lacking→dominant) is a latent tension, not an active conflict.
  const elementConflict =
    lacking !== null &&
    ELEMENT_AFFINITY[dominant]?.weakens === lacking;

  return {
    dominantElement:       dominant,
    lackingElement:        lacking,
    balanceState,
    elementalDistribution: dist,
    dominantPolarity,
    elementConflict,
    _sorted: sorted,  // internal — stripped before public output
  };
}

// ─── 2. CROSS-SYSTEM HARMONY — three independent sub-scorers ─────────────────

// scoreSajuInternal weighting model:
// Per pair (i,j): stem×stem at STEM_WEIGHT, branch×branch at BRANCH_WEIGHT,
// stem[i]↔branch[j] and stem[j]↔branch[i] at CROSS_WEIGHT each.
// Hierarchy: STEM > BRANCH > CROSS so heavenly stems remain primary.
// Max per pair = 3 × (1.0 + 0.5 + 0.25 + 0.25) = 6.0

const STEM_WEIGHT   = 1.00;
const BRANCH_WEIGHT = 0.50;
const CROSS_WEIGHT  = 0.25;

function scoreSajuInternal(fourPillars) {
  const pillars = Object.values(fourPillars);
  let total = 0, max = 0;

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const sa = pillars[i].heavenlyStem?.element;
      const sb = pillars[j].heavenlyStem?.element;
      const ba = pillars[i].earthlyBranch?.element;
      const bb = pillars[j].earthlyBranch?.element;

      if (sa && sb) { total += sajuElementScore(sa, sb) * STEM_WEIGHT;   max += 3 * STEM_WEIGHT;   }
      if (ba && bb) { total += sajuElementScore(ba, bb) * BRANCH_WEIGHT; max += 3 * BRANCH_WEIGHT; }
      if (sa && bb) { total += sajuElementScore(sa, bb) * CROSS_WEIGHT;  max += 3 * CROSS_WEIGHT;  }
      if (sb && ba) { total += sajuElementScore(sb, ba) * CROSS_WEIGHT;  max += 3 * CROSS_WEIGHT;  }
    }
  }

  return max > 0 ? Math.round((total / max) * 100) : 50;
}

function scoreSajuAstrology(sajuAnalysis, astrologyProfile, fourPillars) {
  const dom = sajuAnalysis.dominantElement;
  let total = 0, max = 0;

  if (astrologyProfile?.sun?.element) {
    const sunEl   = astrologyProfile.sun.element;
    const bridged = bridgeElement(dom);
    const s = sunEl === bridged ? 3
      : ELEMENT_AFFINITY[dom]?.generates === (WESTERN_TO_SAJU[sunEl] ?? sunEl) ? 2
      : 1;
    total += s; max += 3;
  }

  if (astrologyProfile?.moon?.element) {
    total += astrologyProfile.moon.element === bridgeElement(dom) ? 3 : 1;
    max   += 3;
  }

  if (astrologyProfile?.sun?.modality) {
    const modality  = astrologyProfile.sun.modality;
    const pillars   = Object.values(fourPillars);
    const yangCount = pillars.filter(p => p.heavenlyStem?.yinYang === 'Yang').length;
    const expected  = { Cardinal: 2, Fixed: 3, Mutable: 2 }[modality] ?? 2;
    total += Math.abs(yangCount - expected) <= 1 ? 2 : 0;
    max   += 2;
  }

  return max > 0 ? Math.round((total / max) * 100) : 50;
}

function scoreNumerologyLayer(sajuAnalysis, lifePathNumber) {
  // Pass raw Saju elements — scoreNumerologyAlignment uses Saju vocab
  const sajuElements = sajuAnalysis._sorted.map(e => e.element);
  return scoreNumerologyAlignment(lifePathNumber, sajuElements).score;
}

function buildCrossSystemHarmony(sajuRaw, astRaw, numRaw) {
  const overall = Math.round(
    sajuRaw * LAYER_WEIGHTS.saju +
    astRaw  * LAYER_WEIGHTS.astrology +
    numRaw  * LAYER_WEIGHTS.numerology
  );
  return {
    sajuInternal:        { raw: sajuRaw, weighted: Math.round(sajuRaw * LAYER_WEIGHTS.saju)       },
    sajuAstrology:       { raw: astRaw,  weighted: Math.round(astRaw  * LAYER_WEIGHTS.astrology)  },
    numerologyAlignment: { raw: numRaw,  weighted: Math.round(numRaw  * LAYER_WEIGHTS.numerology) },
    overall,
  };
}

// ─── 3. PERSONALITY FINGERPRINT ──────────────────────────────────────────────
// Air key removed — all trait lookup uses Saju vocabulary.
// Astrology elements bridge to Saju before lookup.
// Returns Trait[] { id, source, strength } — not bare strings.

const ELEMENT_TRAITS = {
  Wood:  ['growth', 'creativity', 'flexibility', 'ambition', 'compassion'],
  Fire:  ['passion', 'enthusiasm', 'charisma', 'leadership', 'intuition'],
  Earth: ['stability', 'practicality', 'loyalty', 'patience', 'groundedness'],
  Metal: ['precision', 'discipline', 'justice', 'clarity', 'determination'],
  Water: ['wisdom', 'adaptability', 'depth', 'empathy', 'mystery'],
};

export function computeTraitFingerprint(fourPillars, astrologyProfile, lifePathTraits, sajuAnalysis) {
  const scores  = {};
  const sources = {};

  function add(id, weight, src) {
    scores[id]  = (scores[id]  || 0) + weight;
    const prev  = sources[id];
    sources[id] = !prev ? src : prev === src ? prev : 'combined';
  }

  for (const pillar of Object.values(fourPillars)) {
    for (const el of [pillar.heavenlyStem?.element, pillar.earthlyBranch?.element]) {
      if (el && ELEMENT_TRAITS[el]) {
        for (const t of ELEMENT_TRAITS[el]) add(t, 1, 'saju');
      }
    }
  }

  for (const src of [astrologyProfile?.sun, astrologyProfile?.moon]) {
    if (!src?.element) continue;
    const sajuEl = WESTERN_TO_SAJU[src.element] ?? src.element;
    if (ELEMENT_TRAITS[sajuEl]) {
      for (const t of ELEMENT_TRAITS[sajuEl]) add(t, 0.5, 'astrology');
    }
  }

  for (const t of lifePathTraits ?? []) add(t, 1.5, 'numerology');

  const maxScore  = Math.max(...Object.values(scores), 1);
  const allTraits = Object.entries(scores)
    .map(([id, score]) => ({
      id,
      source:   sources[id] || 'combined',
      strength: parseFloat((score / maxScore).toFixed(3)),
    }))
    .sort((a, b) => b.strength - a.strength);

  // Shadow traits: top 2 traits of the lacking/weakest element.
  // Required for tarot major arcana selection downstream.
  const shadowEl = sajuAnalysis?.lackingElement
    ?? sajuAnalysis?._sorted?.[sajuAnalysis._sorted.length - 1]?.element;
  const shadowStrength = shadowEl
    ? parseFloat(((sajuAnalysis?.elementalDistribution?.[shadowEl] ?? 5) / 100).toFixed(3))
    : 0;
  const shadowTraits = shadowEl && ELEMENT_TRAITS[shadowEl]
    ? ELEMENT_TRAITS[shadowEl].slice(0, 2).map(id => ({
        id, source: 'saju', strength: shadowStrength,
      }))
    : [];

  return {
    coreTraits:      allTraits.slice(0, 3),
    secondaryTraits: allTraits.slice(3, 7),
    latentTraits:    allTraits.slice(7, 10),
    shadowTraits,
    archetypeSeeds:  [],  // populated by buildDestinyScoreOutput
  };
}

// ─── 4. RECOMMENDATION SIGNALS ───────────────────────────────────────────────
//
// Each SignalObject:
//   weight          — base priority in name selection (0–1)
//   confidence      — how strongly the chart supports this signal (0–1)
//   effectiveWeight — weight × confidence (downstream must use this for ranking)
//
// balance  = supplementation urgency (how badly does the chart need filling?)
// talent   = expressive strength (how reliably can this element be expressed?)
// These are intentionally asymmetric — they must not collapse into one signal.

// ── Balance confidence factors ────────────────────────────────────────────────

const ABSENCE_CEIL = 15;

const BALANCE_STATE_WEIGHT = {
  polarized:  1.00,
  dominant:   0.80,
  deficient:  0.70,
  harmonious: 0.40,
  scattered:  0.25,
};

const GAP_FULL_CONF           = 40;
const BALANCE_CONFLICT_BOOST  = 0.10;
const ABSENCE_W = 0.35;
const STATE_W   = 0.40;
const GAP_W     = 0.25;

function balanceSignalConfidence(sajuAnalysis) {
  const { dominantElement, lackingElement, balanceState,
          elementalDistribution: dist, elementConflict } = sajuAnalysis;
  const lackPct = dist[lackingElement ?? dominantElement] ?? 0;
  const domPct  = dist[dominantElement] ?? 0;

  const absenceFactor = Math.max(0, 1 - lackPct / ABSENCE_CEIL);
  const stateFactor   = BALANCE_STATE_WEIGHT[balanceState] ?? 0.50;
  const gapFactor     = Math.min(1, Math.max(0, (domPct - lackPct) / GAP_FULL_CONF));
  const conflictBoost = elementConflict ? BALANCE_CONFLICT_BOOST : 0;

  return parseFloat(Math.min(1,
    ABSENCE_W * absenceFactor +
    STATE_W   * stateFactor   +
    GAP_W     * gapFactor     +
    conflictBoost
  ).toFixed(2));
}

// ── Talent confidence factors ─────────────────────────────────────────────────

const TALENT_STATE_WEIGHT = {
  polarized:  0.80,
  dominant:   0.95,
  deficient:  0.65,
  harmonious: 0.55,
  scattered:  0.20,
};

const ASTRO_SUN_REINFORCE    = 0.20;
const ASTRO_MOON_REINFORCE   = 0.10;
const NUM_EXACT_REINFORCE    = 0.10;
const NUM_CYCLE_REINFORCE    = 0.05;
const TALENT_CONFLICT_PENALTY = -0.10;
const TALENT_STATE_W          = 0.60;

function talentSignalConfidence(sajuAnalysis, astroSun, astroMoon, numEl) {
  const { dominantElement: dom, balanceState, elementConflict } = sajuAnalysis;

  const stateFactor  = TALENT_STATE_WEIGHT[balanceState] ?? 0.50;
  const astroFactor  = Math.min(0.30,
    (astroSun  === dom ? ASTRO_SUN_REINFORCE  : 0) +
    (astroMoon === dom ? ASTRO_MOON_REINFORCE : 0)
  );
  const numFactor    =
    numEl === dom                                                             ? NUM_EXACT_REINFORCE  :
    ELEMENT_AFFINITY[numEl]?.generates === dom ||
    ELEMENT_AFFINITY[dom]?.generates   === numEl                             ? NUM_CYCLE_REINFORCE  :
    0;
  const conflictPenalty = elementConflict ? TALENT_CONFLICT_PENALTY : 0;

  return parseFloat(Math.min(1, Math.max(0,
    TALENT_STATE_W * stateFactor + astroFactor + numFactor + conflictPenalty
  )).toFixed(2));
}

function computeRecommendationSignals(sajuAnalysis, lifePathNumber, astrologyProfile) {
  const dist    = sajuAnalysis.elementalDistribution;
  const dom     = sajuAnalysis.dominantElement;
  const lacking = sajuAnalysis.lackingElement
    ?? sajuAnalysis._sorted[sajuAnalysis._sorted.length - 1].element;
  const numEl   = numerologyElement(lifePathNumber);

  const astroSun  = WESTERN_TO_SAJU[astrologyProfile?.sun?.element]  ?? null;
  const astroMoon = WESTERN_TO_SAJU[astrologyProfile?.moon?.element] ?? null;

  // ── Balance ──
  const lackPct  = dist[lacking] ?? 0;
  const balWt    = parseFloat(Math.min(1, Math.max(0, 1 - lackPct / 20)).toFixed(2));
  const balConf  = balanceSignalConfidence(sajuAnalysis);
  const balance  = {
    element:         lacking,
    weight:          balWt,
    confidence:      balConf,
    effectiveWeight: parseFloat((balWt * balConf).toFixed(2)),
  };

  // ── Talent ──
  const domPct   = dist[dom] ?? 0;
  const talWt    = parseFloat(Math.min(1, domPct / 30).toFixed(2));
  const talConf  = talentSignalConfidence(sajuAnalysis, astroSun, astroMoon, numEl);
  const talent   = {
    element:         dom,
    weight:          talWt,
    confidence:      talConf,
    effectiveWeight: parseFloat((talWt * talConf).toFixed(2)),
  };

  // ── Destiny ──
  // weight is constant — life path direction doesn't change with chart agreement.
  // effectiveWeight is what downstream must use for ranking strength.
  let agreements = 0;
  if (numEl === dom) agreements += 2;
  else if (
    ELEMENT_AFFINITY[numEl]?.generates === dom ||
    ELEMENT_AFFINITY[dom]?.generates   === numEl
  ) agreements += 1;
  if (astroSun  === numEl) agreements += 1;
  if (astroMoon === numEl) agreements += 1;

  const destWt   = 0.60;
  const destConf = parseFloat(Math.min(1, 0.30 + agreements * 0.15).toFixed(2));
  const destiny  = {
    element:         numEl,
    weight:          destWt,
    confidence:      destConf,
    effectiveWeight: parseFloat((destWt * destConf).toFixed(2)),
  };

  return { balance, talent, destiny, strokeEnergyTarget: null };
}

// ─── ROOT ASSEMBLER ──────────────────────────────────────────────────────────

export function buildDestinyScoreOutput(fourPillars, astrologyProfile, lifePathProfile) {
  const { number: lifePathNumber, traits: lifePathTraits, keyword } = lifePathProfile;

  const ea      = analyzeSajuElements(fourPillars);
  const sajuRaw = scoreSajuInternal(fourPillars);
  const astRaw  = scoreSajuAstrology(ea, astrologyProfile, fourPillars);
  const numRaw  = scoreNumerologyLayer(ea, lifePathNumber);
  const crossSystemHarmony = buildCrossSystemHarmony(sajuRaw, astRaw, numRaw);
  const overall = crossSystemHarmony.overall;
  const grade   = toGrade(overall);

  const fingerprint = computeTraitFingerprint(
    fourPillars, astrologyProfile, lifePathTraits, ea
  );
  fingerprint.archetypeSeeds = [
    ea.dominantElement,
    fingerprint.coreTraits[0]?.id ?? null,
    keyword?.toLowerCase()         ?? null,
  ].filter(Boolean).slice(0, 3);

  const recommendationSignals = computeRecommendationSignals(ea, lifePathNumber, astrologyProfile);

  const scoreBreakdown = {
    layerScores: { saju: sajuRaw, astrology: astRaw, numerology: numRaw },
    grade,
    gradeThreshold: GRADE_THRESHOLDS[grade] ?? 0,
    debugProfile: {
      sajuElements:    ea.elementalDistribution,
      sunSign:         astrologyProfile?.sun?.sign  ?? null,
      moonSign:        astrologyProfile?.moon?.sign ?? null,
      lifePathNumber,
      modalityProfile: astrologyProfile?.sun?.modality ?? 'Mixed',
    },
  };

  const { _sorted: _, ...publicElementAnalysis } = ea;

  return {
    harmonyScore: overall,
    grade,
    elementAnalysis:        publicElementAnalysis,
    crossSystemHarmony,
    personalityFingerprint: fingerprint,
    recommendationSignals,
    scoreBreakdown,
  };
}

// ─── LEGACY SHIMS ────────────────────────────────────────────────────────────
// These maintain the original return shapes consumed by narrative.js and test.js.
// Remove after narrative.js is migrated to DestinyScoreOutput paths.

export function scoreDestinyAlignment(fourPillars, astrologyProfile, lifePathNumber) {
  const ea  = analyzeSajuElements(fourPillars);
  const pct = buildCrossSystemHarmony(
    scoreSajuInternal(fourPillars),
    scoreSajuAstrology(ea, astrologyProfile, fourPillars),
    scoreNumerologyLayer(ea, lifePathNumber),
  ).overall;
  return {
    pct,
    grade: toGrade(pct),
    sajuAnalysis: { ...ea, lacking: ea.lackingElement },
    dominant: {
      element:    ea.dominantElement,
      westernEl:  bridgeElement(ea.dominantElement),
      numElement: numerologyElement(lifePathNumber),
      sunElement: astrologyProfile?.sun?.element  ?? null,
      moonElement:astrologyProfile?.moon?.element ?? null,
    },
  };
}
