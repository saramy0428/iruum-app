/**
 * generateDestinyName.js — Korean Destiny Name Engine v2.0
 *
 * Pipeline:
 *   birthData → getFourPillars → analyzeSajuElements
 *   → decideStrategy (lacking-boost OR dominant-reinforce)
 *   → scoreName per candidate (base + element fit + 상극 penalty)
 *   → seeded jitter for variation across users
 *   → top-N ranked output
 *
 * Determinism contract:
 *   Same input (surname + birthDate + birthTime + gender) → same recommendation.
 *   Pass options.sessionSeed to override (e.g., user clicked "try another").
 *
 * Strategy logic:
 *   • lackingElement present → boost it, support with its generator,
 *     penalize names containing the controller (상극)
 *   • lackingElement null (balanced chart) → reinforce dominant element
 *
 * Output shape:
 *   { name, alternates, sajuSummary, strategy, reason, sessionSeed, ... }
 *   `name` is the single recommendation. `alternates` are 2 backups for re-roll UX.
 */

import { koreanNamePool } from "../data/koreanNames.js";
import { getFourPillars } from "./saju.js";
import { analyzeSajuElements } from "./scoring.js";

// ─── FIVE-ELEMENT RELATIONSHIPS ──────────────────────────────────────────────

// 상생 (X generates Y): Wood→Fire→Earth→Metal→Water→Wood
const GENERATES = {
  Wood:  "Fire",
  Fire:  "Earth",
  Earth: "Metal",
  Metal: "Water",
  Water: "Wood",
};

// 상생 reverse: what element generates X (i.e., supports X)
const GENERATED_BY = {
  Fire:  "Wood",
  Earth: "Fire",
  Metal: "Earth",
  Water: "Metal",
  Wood:  "Water",
};

// 상극 reverse: what element controls/suppresses X (we want to AVOID this when boosting X)
//   Wood is controlled by Metal (金克木)
//   Fire is controlled by Water (水克火)
//   Earth is controlled by Wood (木克土)
//   Metal is controlled by Fire (火克金)
//   Water is controlled by Earth (土克水)
const CONTROLLED_BY = {
  Wood:  "Metal",
  Fire:  "Water",
  Earth: "Wood",
  Metal: "Fire",
  Water: "Earth",
};

// ─── SEEDED PRNG (FNV-1a + Mulberry32) ───────────────────────────────────────
// Deterministic, dependency-free, good enough distribution for our use.

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  seed |= 0;
  seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function seededRandom(candidateId, sessionSeed) {
  return mulberry32(fnv1a(candidateId + "|" + sessionSeed));
}

// ─── STRATEGY DECISION ───────────────────────────────────────────────────────

function decideStrategy(analysis) {
  const lacking = analysis.lackingElement;
  const dominant = analysis.dominantElement;

  if (lacking) {
    return {
      kind:    "boost-lacking",
      target:  lacking,
      support: GENERATED_BY[lacking],
      avoid:   CONTROLLED_BY[lacking],
      summary: `Your chart lacks ${lacking}; the recommended name introduces ${lacking} energy supported by ${GENERATED_BY[lacking]}, while avoiding ${CONTROLLED_BY[lacking]}.`,
    };
  }

  return {
    kind:    "reinforce-dominant",
    target:  dominant,
    support: GENERATED_BY[dominant],
    avoid:   null,  // balanced charts don't need exclusion
    summary: `Your chart is balanced; the recommended name reinforces your dominant ${dominant} energy for natural alignment.`,
  };
}

// ─── CANDIDATE SCORING ───────────────────────────────────────────────────────
//
// Scoring components (raw, before jitter):
//   base:       elementStrength × 0.5   — how strongly primary expressed (0..0.5)
//   target hit: +0.40 if primary, +0.20 if secondary
//   support:    +0.15 if primary, +0.08 if secondary  (generator of target)
//   avoid:      -0.30 if name contains the controller of target
//   commonality: +0.05 common, ±0 uncommon, -0.05 rare
//
// Final range typically 0.0 ~ 1.1.

function scoreName(name, strategy) {
  let score = name.elementStrength * 0.5;
  const breakdown = [];
  breakdown.push(`base ${(name.elementStrength * 0.5).toFixed(2)} from elementStrength`);

  const [primary, secondary] = name.elements;
  const { target, support, avoid } = strategy;

  // Element match scoring
  if (primary === target) {
    score += 0.40;
    breakdown.push(`+0.40 primary element matches target ${target}`);
  } else if (secondary === target) {
    score += 0.20;
    breakdown.push(`+0.20 secondary element matches target ${target}`);
  } else if (primary === support) {
    score += 0.15;
    breakdown.push(`+0.15 primary ${support} generates target ${target}`);
  } else if (secondary === support) {
    score += 0.08;
    breakdown.push(`+0.08 secondary ${support} generates target ${target}`);
  }

  // Avoid penalty (상극)
  if (avoid && name.elements.includes(avoid)) {
    score -= 0.30;
    breakdown.push(`-0.30 contains ${avoid} which controls/suppresses ${target}`);
  }

  // Commonality
  if (name.commonality === "common") {
    score += 0.05;
  } else if (name.commonality === "rare") {
    score -= 0.05;
  }

  return { score: parseFloat(score.toFixed(4)), breakdown };
}

// ─── SEED CONSTRUCTION ───────────────────────────────────────────────────────

function buildSeed(input, override) {
  if (override) return String(override);
  const { surname, birthDate, birthTime, gender } = input;
  return [surname, birthDate, birthTime ?? "", gender].join("|");
}

// ─── HUMAN-READABLE REASON BUILDER ───────────────────────────────────────────

function buildReason(candidate, strategy, analysis, surname) {
  const { dominantElement, lackingElement } = analysis;
  const [s1, s2] = candidate.syllables;

  let chart;
  if (lackingElement) {
    chart = `Your birth chart shows strong ${dominantElement} energy with ${lackingElement} largely absent.`;
  } else {
    chart = `Your birth chart is balanced, with ${dominantElement} as your strongest element.`;
  }

  let strategyLine;
  if (strategy.kind === "boost-lacking") {
    strategyLine = `This name introduces ${strategy.target} energy to restore balance` +
      (strategy.avoid ? `, and was chosen to avoid ${strategy.avoid} which would further suppress ${strategy.target}.` : ".");
  } else {
    strategyLine = `This name reinforces your ${strategy.target} energy in harmony with your natural alignment.`;
  }

  const syllableLine =
    `${s1.hangul} (${s1.hanja}) means "${s1.meaning}" and carries ${s1.element} energy; ` +
    `${s2.hangul} (${s2.hanja}) means "${s2.meaning}" and carries ${s2.element} energy. ` +
    `Together they form ${candidate.hangul} (${candidate.hanja}) — ${candidate.meaning}.`;

  return `${chart} ${strategyLine} ${syllableLine}`;
}

// ─── OUTPUT SHAPING ──────────────────────────────────────────────────────────

function shapeName(scored, surname) {
  const { name, score, finalScore, breakdown } = scored;
  return {
    id:                  name.id,
    hangul:              name.hangul,
    hanja:               name.hanja,
    romanized:           name.romanized,
    meaning:             name.meaning,
    displayName:         `${name.hangul} (${name.romanized})`,
    fullNameRomanized:   `${name.romanized} ${surname}`,
    fullNameWithHanja:   `${name.hanja} (${surname})`,
    syllables:           name.syllables,
    elements:            name.elements,
    elementStrength:     name.elementStrength,
    commonality:         name.commonality,
    score,
    finalScore,
    scoreBreakdown:      breakdown,
  };
}

// ─── INPUT VALIDATION ────────────────────────────────────────────────────────

function validateInput(input) {
  const errors = [];
  if (!input || typeof input !== "object") {
    errors.push("input must be an object");
    return errors;
  }
  if (!input.surname || typeof input.surname !== "string") {
    errors.push("surname is required (string)");
  }
  if (!input.birthDate || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(input.birthDate)) {
    errors.push("birthDate is required in YYYY-MM-DD format");
  }
  if (input.birthTime && !/^\d{1,2}:\d{2}$/.test(input.birthTime)) {
    errors.push("birthTime, if provided, must be HH:MM format");
  }
  if (!input.gender || !["male", "female", "neutral"].includes(String(input.gender).toLowerCase())) {
    errors.push("gender must be one of: male, female, neutral");
  }
  return errors;
}

// ─── ROOT API ────────────────────────────────────────────────────────────────

/**
 * Generate a Korean destiny name from birth data.
 *
 * @param {object} input
 *   surname:      string  — user's English surname
 *   birthDate:    string  — "YYYY-MM-DD"
 *   birthTime:    string? — "HH:MM" (optional, defaults to 09:00)
 *   birthCountry: string?
 *   birthCity:    string?
 *   gender:       "male" | "female" | "neutral"
 * @param {object} [options]
 *   sessionSeed:     string?  — override for "try another" UX
 *   topN:            number   — how many alternates to surface (default 3 → 1 main + 2 alternates)
 *   explorationBase: number   — jitter strength 0..1 (default 0.15)
 * @returns {Promise<object>}
 */
export async function generateDestinyName(input, options = {}) {
  const errors = validateInput(input);
  if (errors.length) {
    const err = new Error(`Invalid input: ${errors.join("; ")}`);
    err.code = "INVALID_INPUT";
    err.details = errors;
    throw err;
  }

  const { surname, birthDate, birthTime, birthCountry, birthCity, gender } = input;
  const { sessionSeed: seedOverride = null, topN = 3, explorationBase = 0.15 } = options;

  // ── 1. Saju computation ──────────────────────────────────────────────────
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime ? birthTime.split(":").map(Number) : [9, 0];

  const fourPillars = getFourPillars(year, month, day, hour, minute);
  const analysis    = analyzeSajuElements(fourPillars);

  // ── 2. Strategy ──────────────────────────────────────────────────────────
  const strategy = decideStrategy(analysis);

  // ── 3. Pool selection ────────────────────────────────────────────────────
  const genderKey = String(gender).toLowerCase();
  const pool = koreanNamePool[genderKey] ?? koreanNamePool.neutral;
  if (!pool || pool.length === 0) {
    throw new Error(`No name pool available for gender: ${gender}`);
  }

  // ── 4. Scoring + seeded jitter ───────────────────────────────────────────
  const seed = buildSeed(input, seedOverride);
  const scored = pool.map(name => {
    const { score, breakdown } = scoreName(name, strategy);
    const jitter = seededRandom(name.id, seed) * explorationBase;
    const finalScore = parseFloat((score * (1 + jitter)).toFixed(4));
    return { name, score, finalScore, breakdown };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  // ── 5. Shape output ──────────────────────────────────────────────────────
  const top = scored.slice(0, topN).map(s => shapeName(s, surname));
  const main = top[0];
  const alternates = top.slice(1);

  return {
    name: main,
    alternates,
    fourPillars,
    sajuSummary: {
      dominantElement:       analysis.dominantElement,
      lackingElement:        analysis.lackingElement,
      balanceState:          analysis.balanceState,
      elementalDistribution: analysis.elementalDistribution,
      dominantPolarity:      analysis.dominantPolarity,
    },
    strategy: {
      kind:    strategy.kind,
      target:  strategy.target,
      support: strategy.support,
      avoid:   strategy.avoid,
      summary: strategy.summary,
    },
    reason: buildReason(main, strategy, analysis, surname),
    input: { surname, birthDate, birthTime, birthCountry, birthCity, gender },
    sessionSeed: seed,
  };
}
