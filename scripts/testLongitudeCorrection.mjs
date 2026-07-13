// scripts/testLongitudeCorrection.mjs
//
// 수동 스모크 테스트: 국가별 경도 보정이 실제로 시주(hour pillar)에
// 영향을 주는가? 오프셋(분), shift된 태양시, 최종 4주를 나란히 출력.
//
// 실행: node scripts/testLongitudeCorrection.mjs

import { computePillarsFromInput } from "../lib/computePillars.js";
import { getSolarTimeOffsetMinutes } from "../lib/longitudeCorrection.js";

function formatPillar(p) {
  return `${p.label} (${p.labelEn}, ${p.element})`;
}

function shiftedClock(hhmm, offsetMin) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = ((h * 60 + m + offsetMin) % 1440 + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function runCase(label, { birthDate, birthTime, birthCountry }) {
  const offset  = getSolarTimeOffsetMinutes(birthCountry);
  const pillars = computePillarsFromInput({ birthDate, birthTime, birthCountry });

  console.log(`── ${label.padEnd(10)} ──────────────────────────────`);
  console.log(`  country     : ${birthCountry}`);
  console.log(`  offset      : ${offset >= 0 ? "+" : ""}${offset} min`);
  console.log(`  clock time  : ${birthTime}`);
  console.log(`  solar time  : ${shiftedClock(birthTime, offset)}`);
  console.log(`  hour pillar : ${formatPillar(pillars.hour)}`);
  console.log(`  day  pillar : ${formatPillar(pillars.day)}`);
  console.log();
  return pillars;
}

function compare(header, base, countries) {
  console.log(`\n╔══════════════════════════════════════════════════════`);
  console.log(`║  ${header}`);
  console.log(`║  date : ${base.birthDate}   clock : ${base.birthTime}`);
  console.log(`╚══════════════════════════════════════════════════════\n`);

  const results = countries.map(c => runCase(c.toUpperCase(), { ...base, birthCountry: c }));
  const [a, b] = results;

  const hourSame = a.hour.label === b.hour.label;
  const daySame  = a.day.label  === b.day.label;

  console.log(`▶ 결과 비교`);
  console.log(`   hour pillar : ${a.hour.label}  vs  ${b.hour.label}   → ${hourSame ? "SAME" : "DIFFERENT ✓"}`);
  console.log(`   day  pillar : ${a.day.label}   vs  ${b.day.label}    → ${daySame  ? "SAME" : "DIFFERENT"}`);
}

// ─── 1. 사용자 요청 케이스 ──────────────────────────────────────────
compare(
  "요청 케이스 · 1990-05-15 05:10  Korea vs Mexico",
  { birthDate: "1990-05-15", birthTime: "05:10" },
  ["korea", "mexico"]
);

// ─── 2. 보너스: 경계 근처에서는 pillar가 달라지는 걸 확인 ──────────
// 지지 boundary는 30분 shift 규칙 때문에 매 홀수반시(01:30, 03:30, 05:30...)에 위치.
// Japan(+19) vs Korea(−32)는 51분 차이라 05:45 부근에서 pillar가 갈림.
compare(
  "보너스 · 1990-05-15 05:45  Japan vs Korea  (지지 boundary 근처)",
  { birthDate: "1990-05-15", birthTime: "05:45" },
  ["japan", "korea"]
);

console.log(`
📝 해설
   ─ Korea 오프셋 −32분, Mexico 오프셋 −37분 → 차이 5분.
   ─ 사주 지지(시주)는 약 2시간 단위로 구획되고, 30분 shift 규칙으로
     boundary가 01:30 / 03:30 / 05:30 / ... 에 위치.
   ─ 05:10은 두 국가 모두 shift 후 03:30~05:30 구간(인시)에 머무름 → hour pillar SAME.
   ─ 반면 05:45는 Japan(+19) → 06:04 → 묘시,  Korea(−32) → 05:13 → 인시.
     여기서 처음으로 pillar가 갈림. 이게 경도 보정의 실효 지점.
`);
