/**
 * longitudeCorrection.js — 출생지 경도 기준 태양시 보정
 *
 * 경도 보정은 시주(時柱) 정확도를 위한 근사치이며,
 * 미국/캐나다/러시아/호주처럼 경도 폭이 큰 국가는
 * 수도 또는 최대 도시 하나를 대표값으로 사용함.
 *
 * 오프셋(분) = (실제 경도 − 표준시 자오선) × 4
 *   예: 서울 (126.98 − 135) × 4 ≈ −32분
 */

export const COUNTRY_LONGITUDE = {
  korea:         { label: "South Korea",    longitude: 126.98, timezoneMeridian: 135  }, // 서울
  japan:         { label: "Japan",          longitude: 139.69, timezoneMeridian: 135  }, // 도쿄
  china:         { label: "China",          longitude: 116.40, timezoneMeridian: 120  }, // 베이징
  taiwan:        { label: "Taiwan",         longitude: 121.56, timezoneMeridian: 120  }, // 타이베이
  "hong kong":   { label: "Hong Kong",      longitude: 114.16, timezoneMeridian: 120  }, // 홍콩
  singapore:     { label: "Singapore",      longitude: 103.82, timezoneMeridian: 120  }, // 싱가포르
  philippines:   { label: "Philippines",    longitude: 120.98, timezoneMeridian: 120  }, // 마닐라
  vietnam:       { label: "Vietnam",        longitude: 105.85, timezoneMeridian: 105  }, // 하노이
  thailand:      { label: "Thailand",       longitude: 100.50, timezoneMeridian: 105  }, // 방콕
  indonesia:     { label: "Indonesia",      longitude: 106.85, timezoneMeridian: 105  }, // 자카르타 (WIB)
  india:         { label: "India",          longitude:  77.20, timezoneMeridian:  82.5 }, // 델리
  usa:           { label: "United States",  longitude: -97.00, timezoneMeridian: -90  }, // 중부 기준
  canada:        { label: "Canada",         longitude: -75.70, timezoneMeridian: -75  }, // 오타와 (동부)
  mexico:        { label: "Mexico",         longitude: -99.13, timezoneMeridian: -90  }, // 멕시코시티
  brazil:        { label: "Brazil",         longitude: -47.93, timezoneMeridian: -45  }, // 브라질리아
  uk:            { label: "United Kingdom", longitude:  -0.13, timezoneMeridian:   0  }, // 런던
  france:        { label: "France",         longitude:   2.35, timezoneMeridian:  15  }, // 파리
  germany:       { label: "Germany",        longitude:  13.40, timezoneMeridian:  15  }, // 베를린
  netherlands:   { label: "Netherlands",    longitude:   4.90, timezoneMeridian:  15  }, // 암스테르담
  spain:         { label: "Spain",          longitude:  -3.70, timezoneMeridian:  15  }, // 마드리드
  italy:         { label: "Italy",          longitude:  12.50, timezoneMeridian:  15  }, // 로마
  poland:        { label: "Poland",         longitude:  21.02, timezoneMeridian:  15  }, // 바르샤바
  sweden:        { label: "Sweden",         longitude:  18.07, timezoneMeridian:  15  }, // 스톡홀름
  russia:        { label: "Russia",         longitude:  37.62, timezoneMeridian:  45  }, // 모스크바 (MSK)
  australia:     { label: "Australia",      longitude: 151.21, timezoneMeridian: 150  }, // 시드니 (AEST)
};

// UI select 옵션용 — { key, label } 배열. COUNTRY_LONGITUDE의 삽입 순서를 유지 (지역별 그룹).
export const COUNTRY_OPTIONS = Object.entries(COUNTRY_LONGITUDE).map(
  ([key, { label }]) => ({ key, label })
);

// 사용자 자유 입력 대응용 별칭 — 소문자 정규화 후 매칭.
const COUNTRY_ALIASES = {
  "south korea":              "korea",
  "republic of korea":        "korea",
  "대한민국":                  "korea",
  "한국":                      "korea",
  "united states":            "usa",
  "united states of america": "usa",
  "us":                       "usa",
  "u.s.":                     "usa",
  "u.s.a.":                   "usa",
  "america":                  "usa",
  "united kingdom":           "uk",
  "great britain":            "uk",
  "britain":                  "uk",
  "england":                  "uk",
  "prc":                      "china",
  "people's republic of china": "china",
  "deutschland":              "germany",
  "hk":                       "hong kong",
  "hongkong":                 "hong kong",
  "nederland":                "netherlands",
  "holland":                  "netherlands",
};

/**
 * 국가명 → 표준시 자오선 대비 태양시 오프셋(분).
 * 매핑에 없거나 falsy / "other"면 0을 반환.
 *
 * @param {string|null|undefined} country
 * @returns {number} 반올림된 분 단위 오프셋
 */
export function getSolarTimeOffsetMinutes(country) {
  if (!country) return 0;
  const key = String(country).trim().toLowerCase();
  if (!key || key === "other") return 0;

  const canonical = COUNTRY_ALIASES[key] ?? key;
  const entry = COUNTRY_LONGITUDE[canonical];
  if (!entry) return 0;

  return Math.round((entry.longitude - entry.timezoneMeridian) * 4);
}
