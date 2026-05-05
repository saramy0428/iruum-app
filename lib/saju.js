/**
 * saju.js — Korean Four Pillars (사주팔자) Engine
 * Covers: Year, Month, Day, Hour pillars
 * All pillars return { heavenlyStem, earthlyBranch, element, yinYang }
 */

// ─── SHARED LOOKUP TABLES ────────────────────────────────────────────────────

export const HEAVENLY_STEMS = [
  { ko: "갑", en: "Gab",    element: "Wood",  yinYang: "Yang" },
  { ko: "을", en: "Eul",    element: "Wood",  yinYang: "Yin"  },
  { ko: "병", en: "Byeong", element: "Fire",  yinYang: "Yang" },
  { ko: "정", en: "Jeong",  element: "Fire",  yinYang: "Yin"  },
  { ko: "무", en: "Mu",     element: "Earth", yinYang: "Yang" },
  { ko: "기", en: "Gi",     element: "Earth", yinYang: "Yin"  },
  { ko: "경", en: "Gyeong", element: "Metal", yinYang: "Yang" },
  { ko: "신", en: "Sin",    element: "Metal", yinYang: "Yin"  },
  { ko: "임", en: "Im",     element: "Water", yinYang: "Yang" },
  { ko: "계", en: "Gye",    element: "Water", yinYang: "Yin"  },
];

export const EARTHLY_BRANCHES = [
  { ko: "자", en: "Ja",   animal: "Rat",     element: "Water", yinYang: "Yang", hours: [23, 1]  },
  { ko: "축", en: "Chuk", animal: "Ox",      element: "Earth", yinYang: "Yin",  hours: [1,  3]  },
  { ko: "인", en: "In",   animal: "Tiger",   element: "Wood",  yinYang: "Yang", hours: [3,  5]  },
  { ko: "묘", en: "Myo",  animal: "Rabbit",  element: "Wood",  yinYang: "Yin",  hours: [5,  7]  },
  { ko: "진", en: "Jin",  animal: "Dragon",  element: "Earth", yinYang: "Yang", hours: [7,  9]  },
  { ko: "사", en: "Sa",   animal: "Snake",   element: "Fire",  yinYang: "Yin",  hours: [9,  11] },
  { ko: "오", en: "O",    animal: "Horse",   element: "Fire",  yinYang: "Yang", hours: [11, 13] },
  { ko: "미", en: "Mi",   animal: "Goat",    element: "Earth", yinYang: "Yin",  hours: [13, 15] },
  { ko: "신", en: "Sin",  animal: "Monkey",  element: "Metal", yinYang: "Yang", hours: [15, 17] },
  { ko: "유", en: "Yu",   animal: "Rooster", element: "Metal", yinYang: "Yin",  hours: [17, 19] },
  { ko: "술", en: "Sul",  animal: "Dog",     element: "Earth", yinYang: "Yang", hours: [19, 21] },
  { ko: "해", en: "Hae",  animal: "Pig",     element: "Water", yinYang: "Yin",  hours: [21, 23] },
];

// ─── SHARED GANJI BUILDER ─────────────────────────────────────────────────────

function buildGanji(stemIndex, branchIndex) {
  const stem   = HEAVENLY_STEMS[((stemIndex % 10) + 10) % 10];
  const branch = EARTHLY_BRANCHES[((branchIndex % 12) + 12) % 12];
  return {
    heavenlyStem:  stem,
    earthlyBranch: branch,
    element:       stem.element,
    yinYang:       stem.yinYang,
    label:         `${stem.ko}${branch.ko}`,
    labelEn:       `${stem.en}-${branch.en}`,
  };
}

// ─── YEAR PILLAR ──────────────────────────────────────────────────────────────
// Epoch: 1984 = 갑자(Gab-Ja), stem index 0, branch index 0

export function getYearPillar(year) {
  const stemIndex   = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return buildGanji(stemIndex, branchIndex);
}

// ─── MONTH PILLAR ─────────────────────────────────────────────────────────────

const SOLAR_TERM_STARTS = [
  [1,  6],  [2,  4],  [3,  6],  [4,  5],
  [5,  6],  [6,  6],  [7,  7],  [8,  7],
  [9,  8],  [10, 8],  [11, 7],  [12, 7],
];

const SOLAR_MONTH_TO_BRANCH = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10, 11: 11,
  12: 0,
  1: 1,
};

const FIVE_TIGER_BASE = {
  0: 2, 1: 4, 2: 6, 3: 8, 4: 0,
  5: 2, 6: 4, 7: 6, 8: 8, 9: 0,
};

export function getMonthPillar(year, month, day) {
  let sajuMonth = month;
  const termDay = SOLAR_TERM_STARTS.find(([m]) => m === month)?.[1] ?? 6;
  if (day < termDay) {
    sajuMonth = month === 1 ? 12 : month - 1;
  }

  const branchIndex = SOLAR_MONTH_TO_BRANCH[sajuMonth] ?? 2;

  const sajuYear = (month === 1 || (month === 2 && day < 4)) ? year - 1 : year;
  const yearStemIndex = ((sajuYear - 4) % 10 + 10) % 10;
  const monthStemBase = FIVE_TIGER_BASE[yearStemIndex];

  const monthOffset = ((branchIndex - 2) + 12) % 12;
  const stemIndex = (monthStemBase + monthOffset) % 10;

  return buildGanji(stemIndex, branchIndex);
}

// ─── DAY PILLAR ───────────────────────────────────────────────────────────────

function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

const DAY_ANCHOR_JDN = 2451551; // Jan 7, 2000 → 갑자 (stem=0, branch=0) — 수정: 2451575(Jan 31)는 무자(index 24)였음

export function getDayPillar(year, month, day) {
  const jdn = gregorianToJDN(year, month, day);
  const offset = ((jdn - DAY_ANCHOR_JDN) % 60 + 60) % 60;
  return buildGanji(offset % 10, offset % 12);
}

// ─── HOUR PILLAR ──────────────────────────────────────────────────────────────

const FIVE_RAT_BASE = {
  0: 0, 1: 2, 2: 4, 3: 6, 4: 8,
  5: 0, 6: 2, 7: 4, 8: 6, 9: 8,
};

export function getHourPillar(year, month, day, hour, minute = 0) {
  const totalMinutes = hour * 60 + minute;
  // 전통 사주에서 시(時) 경계는 정각이 아닌 30분 후부터 시작.
  // 예: 인시(寅時)는 03:00가 아니라 03:30부터 시작.
  // 30분을 당겨서 계산하면 모든 경계가 정확히 맞음.
  const adj = ((totalMinutes - 30) + 1440) % 1440;
  let branchIndex;

  if (adj >= 23 * 60 || adj < 1 * 60) {
    branchIndex = 0;
  } else {
    branchIndex = Math.floor((adj - 60) / 120) + 1;
  }

  const dayPillar = getDayPillar(year, month, day);
  const dayStemIndex = HEAVENLY_STEMS.indexOf(
    HEAVENLY_STEMS.find(s => s.ko === dayPillar.heavenlyStem.ko)
  );
  const hourStemBase = FIVE_RAT_BASE[dayStemIndex];
  const stemIndex = (hourStemBase + branchIndex) % 10;

  const branch = EARTHLY_BRANCHES[branchIndex];
  return {
    ...buildGanji(stemIndex, branchIndex),
    shiHour:    branch.en,
    clockRange: `${branch.hours[0].toString().padStart(2, '0')}:00–${branch.hours[1].toString().padStart(2, '0')}:00`,
  };
}

// ─── FULL FOUR PILLARS ────────────────────────────────────────────────────────

export function getFourPillars(year, month, day, hour = 12, minute = 0) {
  return {
    year:  getYearPillar(year),
    month: getMonthPillar(year, month, day),
    day:   getDayPillar(year, month, day),
    hour:  getHourPillar(year, month, day, hour, minute),
  };
}
