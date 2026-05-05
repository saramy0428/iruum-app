/**
 * data/koreanNames.js — Korean Name Dataset v2
 *
 * Schema (per entry):
 *   id              — stable identifier (f001 / m001 / n001 ...) for seeded random
 *   hangul          — 한글 표기 (e.g. "지아")
 *   hanja           — 한자 표기 (e.g. "智雅") for stamp products + cultural depth
 *   romanized       — 외국인 발음용 로마자 (popular naming style, not strict RR)
 *   meaning         — 영문 한 줄 의미 (user-facing)
 *   syllables       — 음절 단위 분해 [{ hangul, hanja, element, meaning }, ...]
 *   elements        — primary first; derived from syllables[*].element in order
 *   elementStrength — 0~1 — primary 원소가 얼마나 강하게 표현되는지
 *                     • 두 음절 동일 원소: 0.85~0.90
 *                     • 두 음절 상생 관계: 0.70~0.80
 *                     • 두 음절 무관/약한 관계: 0.60~0.70
 *   commonality     — "common" | "uncommon" | "rare"
 *
 * 자원오행 (element classification) 원칙:
 *   Wood  — tree/plant radicals (木, 艹, 系, 巾)
 *   Fire  — heat/light radicals (火, 灬, 日, 心/忄, 辶 motion)
 *   Earth — ground/space radicals (土, 山, 田, 宀, 女, 阝)
 *   Metal — metal/jade radicals (金, 玉/王)
 *   Water — water/cold radicals (水, 氵, 雨, 多)
 *
 * Curation notes:
 *   • Hanja chosen from common modern Korean naming usage (avoid archaic/rare)
 *   • Where the original v1 dataset had conflicting element tags for the same
 *     hangul, one canonical hanja was selected and elements re-tagged accordingly
 *   • Names appearing in multiple gender pools (e.g., 하린 female + neutral)
 *     have separate IDs but identical hanja/syllable data
 */

export const koreanNamePool = {
  // ─── FEMALE (21 unique names) ───────────────────────────────────────────
  female: [
    { id: "f001", hangul: "지아", hanja: "智雅", romanized: "Jia",
      meaning: "wisdom and elegance",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.70, commonality: "common" },

    { id: "f002", hangul: "수아", hanja: "秀雅", romanized: "Sua",
      meaning: "refined elegance",
      syllables: [
        { hangul: "수", hanja: "秀", element: "Wood",  meaning: "excellent, refined" },
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
      ],
      elements: ["Wood", "Earth"], elementStrength: 0.70, commonality: "common" },

    { id: "f003", hangul: "하윤", hanja: "河潤", romanized: "Hayun",
      meaning: "river that nourishes",
      syllables: [
        { hangul: "하", hanja: "河", element: "Water", meaning: "river, flowing" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Water", "Water"], elementStrength: 0.90, commonality: "common" },

    { id: "f004", hangul: "서현", hanja: "瑞賢", romanized: "Seohyun",
      meaning: "auspicious wisdom",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "현", hanja: "賢", element: "Wood",  meaning: "wise, virtuous" },
      ],
      elements: ["Metal", "Wood"], elementStrength: 0.65, commonality: "common" },

    { id: "f005", hangul: "유나", hanja: "柔娜", romanized: "Yuna",
      meaning: "gentle grace",
      syllables: [
        { hangul: "유", hanja: "柔", element: "Wood",  meaning: "gentle, supple" },
        { hangul: "나", hanja: "娜", element: "Earth", meaning: "graceful, beautiful" },
      ],
      elements: ["Wood", "Earth"], elementStrength: 0.70, commonality: "common" },

    { id: "f006", hangul: "서윤", hanja: "瑞潤", romanized: "Seoyun",
      meaning: "auspicious flowing",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Metal", "Water"], elementStrength: 0.80, commonality: "common" },

    { id: "f007", hangul: "지우", hanja: "智宇", romanized: "Jiwoo",
      meaning: "wisdom across the universe",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "우", hanja: "宇", element: "Earth", meaning: "universe, vast space" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "common" },

    { id: "f008", hangul: "하린", hanja: "夏潾", romanized: "Harin",
      meaning: "summer's clear water",
      syllables: [
        { hangul: "하", hanja: "夏", element: "Fire",  meaning: "summer, vibrant season" },
        { hangul: "린", hanja: "潾", element: "Water", meaning: "clear flowing water" },
      ],
      elements: ["Fire", "Water"], elementStrength: 0.65, commonality: "common" },

    { id: "f009", hangul: "서아", hanja: "瑞雅", romanized: "Seoa",
      meaning: "auspicious elegance",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
      ],
      elements: ["Metal", "Earth"], elementStrength: 0.80, commonality: "common" },

    { id: "f010", hangul: "지윤", hanja: "智潤", romanized: "Jiyun",
      meaning: "wise nourishment",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Fire", "Water"], elementStrength: 0.65, commonality: "common" },

    { id: "f011", hangul: "유진", hanja: "裕珍", romanized: "Yujin",
      meaning: "abundant treasure",
      syllables: [
        { hangul: "유", hanja: "裕", element: "Wood",  meaning: "abundant, plentiful" },
        { hangul: "진", hanja: "珍", element: "Metal", meaning: "precious, rare" },
      ],
      elements: ["Wood", "Metal"], elementStrength: 0.65, commonality: "common" },

    { id: "f012", hangul: "수진", hanja: "秀眞", romanized: "Sujin",
      meaning: "refined truth",
      syllables: [
        { hangul: "수", hanja: "秀", element: "Wood", meaning: "excellent, refined" },
        { hangul: "진", hanja: "眞", element: "Fire", meaning: "true, genuine" },
      ],
      elements: ["Wood", "Fire"], elementStrength: 0.80, commonality: "common" },

    { id: "f013", hangul: "아린", hanja: "雅潾", romanized: "Arin",
      meaning: "elegant clarity",
      syllables: [
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
        { hangul: "린", hanja: "潾", element: "Water", meaning: "clear flowing water" },
      ],
      elements: ["Earth", "Water"], elementStrength: 0.65, commonality: "uncommon" },

    { id: "f014", hangul: "다윤", hanja: "多潤", romanized: "Dayun",
      meaning: "abundant nourishment",
      syllables: [
        { hangul: "다", hanja: "多", element: "Water", meaning: "abundant, many" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Water", "Water"], elementStrength: 0.90, commonality: "uncommon" },

    { id: "f015", hangul: "나윤", hanja: "娜潤", romanized: "Nayun",
      meaning: "graceful flow",
      syllables: [
        { hangul: "나", hanja: "娜", element: "Earth", meaning: "graceful, beautiful" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Earth", "Water"], elementStrength: 0.65, commonality: "uncommon" },

    { id: "f016", hangul: "서린", hanja: "瑞潾", romanized: "Seorin",
      meaning: "auspicious clarity",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "린", hanja: "潾", element: "Water", meaning: "clear flowing water" },
      ],
      elements: ["Metal", "Water"], elementStrength: 0.80, commonality: "uncommon" },

    { id: "f017", hangul: "예린", hanja: "藝潾", romanized: "Yerin",
      meaning: "artistic clarity",
      syllables: [
        { hangul: "예", hanja: "藝", element: "Wood",  meaning: "art, talent" },
        { hangul: "린", hanja: "潾", element: "Water", meaning: "clear flowing water" },
      ],
      elements: ["Wood", "Water"], elementStrength: 0.70, commonality: "uncommon" },

    { id: "f018", hangul: "도아", hanja: "道雅", romanized: "Doa",
      meaning: "the path of elegance",
      syllables: [
        { hangul: "도", hanja: "道", element: "Fire",  meaning: "the way, path" },
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "uncommon" },

    { id: "f019", hangul: "세아", hanja: "世雅", romanized: "Seah",
      meaning: "the world's elegance",
      syllables: [
        { hangul: "세", hanja: "世", element: "Metal", meaning: "world, generation" },
        { hangul: "아", hanja: "雅", element: "Earth", meaning: "elegant, refined" },
      ],
      elements: ["Metal", "Earth"], elementStrength: 0.80, commonality: "uncommon" },

    { id: "f020", hangul: "지현", hanja: "智賢", romanized: "Jihyun",
      meaning: "wisdom and virtue",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire", meaning: "wisdom" },
        { hangul: "현", hanja: "賢", element: "Wood", meaning: "wise, virtuous" },
      ],
      elements: ["Fire", "Wood"], elementStrength: 0.80, commonality: "common" },

    { id: "f021", hangul: "하나", hanja: "河娜", romanized: "Hana",
      meaning: "flowing grace",
      syllables: [
        { hangul: "하", hanja: "河", element: "Water", meaning: "river, flowing" },
        { hangul: "나", hanja: "娜", element: "Earth", meaning: "graceful, beautiful" },
      ],
      elements: ["Water", "Earth"], elementStrength: 0.65, commonality: "uncommon" },
  ],

  // ─── MALE (20 unique names) ─────────────────────────────────────────────
  male: [
    { id: "m001", hangul: "수민", hanja: "秀敏", romanized: "Sumin",
      meaning: "refined intellect",
      syllables: [
        { hangul: "수", hanja: "秀", element: "Wood",  meaning: "excellent, refined" },
        { hangul: "민", hanja: "敏", element: "Water", meaning: "agile, quick of mind" },
      ],
      elements: ["Wood", "Water"], elementStrength: 0.75, commonality: "common" },

    { id: "m002", hangul: "하준", hanja: "夏俊", romanized: "Hajun",
      meaning: "summer's brilliance",
      syllables: [
        { hangul: "하", hanja: "夏", element: "Fire", meaning: "summer, vibrant season" },
        { hangul: "준", hanja: "俊", element: "Fire", meaning: "talented, eminent" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "common" },

    { id: "m003", hangul: "지환", hanja: "智煥", romanized: "Jihwan",
      meaning: "radiant wisdom",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire", meaning: "wisdom" },
        { hangul: "환", hanja: "煥", element: "Fire", meaning: "brilliant, shining" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "common" },

    { id: "m004", hangul: "도현", hanja: "道顯", romanized: "Dohyun",
      meaning: "manifesting the path",
      syllables: [
        { hangul: "도", hanja: "道", element: "Fire", meaning: "the way, path" },
        { hangul: "현", hanja: "顯", element: "Fire", meaning: "manifest, eminent" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "common" },

    { id: "m005", hangul: "유진", hanja: "裕珍", romanized: "Yujin",
      meaning: "abundant treasure",
      syllables: [
        { hangul: "유", hanja: "裕", element: "Wood",  meaning: "abundant, plentiful" },
        { hangul: "진", hanja: "珍", element: "Metal", meaning: "precious, rare" },
      ],
      elements: ["Wood", "Metal"], elementStrength: 0.65, commonality: "common" },

    { id: "m006", hangul: "도윤", hanja: "道潤", romanized: "Doyun",
      meaning: "the path that nourishes",
      syllables: [
        { hangul: "도", hanja: "道", element: "Fire",  meaning: "the way, path" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Fire", "Water"], elementStrength: 0.65, commonality: "common" },

    { id: "m007", hangul: "지후", hanja: "智厚", romanized: "Jihu",
      meaning: "wise and generous",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "후", hanja: "厚", element: "Earth", meaning: "thick, generous" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "uncommon" },

    { id: "m008", hangul: "민준", hanja: "旻俊", romanized: "Minjun",
      meaning: "autumn sky's brilliance",
      syllables: [
        { hangul: "민", hanja: "旻", element: "Fire", meaning: "autumn sky" },
        { hangul: "준", hanja: "俊", element: "Fire", meaning: "talented, eminent" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "common" },

    { id: "m009", hangul: "서준", hanja: "瑞俊", romanized: "Seojun",
      meaning: "auspicious talent",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "준", hanja: "俊", element: "Fire",  meaning: "talented, eminent" },
      ],
      elements: ["Metal", "Fire"], elementStrength: 0.65, commonality: "common" },

    { id: "m010", hangul: "지훈", hanja: "智勳", romanized: "Jihun",
      meaning: "wise accomplishment",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "훈", hanja: "勳", element: "Earth", meaning: "merit, achievement" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "common" },

    { id: "m011", hangul: "서진", hanja: "瑞鎭", romanized: "Seojin",
      meaning: "auspicious calm strength",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "진", hanja: "鎭", element: "Metal", meaning: "calm, settling power" },
      ],
      elements: ["Metal", "Metal"], elementStrength: 0.85, commonality: "common" },

    { id: "m012", hangul: "민재", hanja: "敏宰", romanized: "Minjae",
      meaning: "quick mind, governing presence",
      syllables: [
        { hangul: "민", hanja: "敏", element: "Water", meaning: "agile, quick of mind" },
        { hangul: "재", hanja: "宰", element: "Earth", meaning: "to govern" },
      ],
      elements: ["Water", "Earth"], elementStrength: 0.65, commonality: "common" },

    { id: "m013", hangul: "유준", hanja: "裕俊", romanized: "Yujun",
      meaning: "abundant talent",
      syllables: [
        { hangul: "유", hanja: "裕", element: "Wood", meaning: "abundant, plentiful" },
        { hangul: "준", hanja: "俊", element: "Fire", meaning: "talented, eminent" },
      ],
      elements: ["Wood", "Fire"], elementStrength: 0.80, commonality: "uncommon" },

    { id: "m014", hangul: "태윤", hanja: "泰潤", romanized: "Taeyun",
      meaning: "great peace, deep nourishment",
      syllables: [
        { hangul: "태", hanja: "泰", element: "Water", meaning: "great peace, vast" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Water", "Water"], elementStrength: 0.90, commonality: "uncommon" },

    { id: "m015", hangul: "현우", hanja: "賢佑", romanized: "Hyunwoo",
      meaning: "wise protection",
      syllables: [
        { hangul: "현", hanja: "賢", element: "Wood",  meaning: "wise, virtuous" },
        { hangul: "우", hanja: "佑", element: "Earth", meaning: "to help, protect" },
      ],
      elements: ["Wood", "Earth"], elementStrength: 0.65, commonality: "common" },

    { id: "m016", hangul: "준서", hanja: "俊瑞", romanized: "Junseo",
      meaning: "talented and auspicious",
      syllables: [
        { hangul: "준", hanja: "俊", element: "Fire",  meaning: "talented, eminent" },
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
      ],
      elements: ["Fire", "Metal"], elementStrength: 0.65, commonality: "common" },

    { id: "m017", hangul: "지민", hanja: "智旻", romanized: "Jimin",
      meaning: "wisdom of the autumn sky",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire", meaning: "wisdom" },
        { hangul: "민", hanja: "旻", element: "Fire", meaning: "autumn sky" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "common" },

    { id: "m018", hangul: "서우", hanja: "瑞佑", romanized: "Seowoo",
      meaning: "auspicious protection",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "우", hanja: "佑", element: "Earth", meaning: "to help, protect" },
      ],
      elements: ["Metal", "Earth"], elementStrength: 0.80, commonality: "common" },

    { id: "m019", hangul: "태현", hanja: "泰賢", romanized: "Taehyun",
      meaning: "great peace and wisdom",
      syllables: [
        { hangul: "태", hanja: "泰", element: "Water", meaning: "great peace, vast" },
        { hangul: "현", hanja: "賢", element: "Wood",  meaning: "wise, virtuous" },
      ],
      elements: ["Water", "Wood"], elementStrength: 0.80, commonality: "common" },

    { id: "m020", hangul: "유찬", hanja: "裕燦", romanized: "Yuchan",
      meaning: "abundant brilliance",
      syllables: [
        { hangul: "유", hanja: "裕", element: "Wood", meaning: "abundant, plentiful" },
        { hangul: "찬", hanja: "燦", element: "Fire", meaning: "brilliant, gleaming" },
      ],
      elements: ["Wood", "Fire"], elementStrength: 0.80, commonality: "uncommon" },
  ],

  // ─── NEUTRAL (13 unique names) ──────────────────────────────────────────
  neutral: [
    { id: "n001", hangul: "수현", hanja: "秀賢", romanized: "Suhyun",
      meaning: "refined wisdom",
      syllables: [
        { hangul: "수", hanja: "秀", element: "Wood", meaning: "excellent, refined" },
        { hangul: "현", hanja: "賢", element: "Wood", meaning: "wise, virtuous" },
      ],
      elements: ["Wood", "Wood"], elementStrength: 0.85, commonality: "common" },

    { id: "n002", hangul: "하린", hanja: "夏潾", romanized: "Harin",
      meaning: "summer's clear water",
      syllables: [
        { hangul: "하", hanja: "夏", element: "Fire",  meaning: "summer, vibrant season" },
        { hangul: "린", hanja: "潾", element: "Water", meaning: "clear flowing water" },
      ],
      elements: ["Fire", "Water"], elementStrength: 0.65, commonality: "common" },

    { id: "n003", hangul: "도윤", hanja: "道潤", romanized: "Doyun",
      meaning: "the path that nourishes",
      syllables: [
        { hangul: "도", hanja: "道", element: "Fire",  meaning: "the way, path" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Fire", "Water"], elementStrength: 0.65, commonality: "common" },

    { id: "n004", hangul: "지안", hanja: "智安", romanized: "Jian",
      meaning: "wise tranquility",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "안", hanja: "安", element: "Earth", meaning: "peace, tranquility" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "common" },

    { id: "n005", hangul: "서윤", hanja: "瑞潤", romanized: "Seoyun",
      meaning: "auspicious flowing",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "윤", hanja: "潤", element: "Water", meaning: "moisten, nourish" },
      ],
      elements: ["Metal", "Water"], elementStrength: 0.80, commonality: "common" },

    { id: "n006", hangul: "지원", hanja: "智元", romanized: "Jiwon",
      meaning: "wisdom at the source",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire", meaning: "wisdom" },
        { hangul: "원", hanja: "元", element: "Wood", meaning: "origin, beginning" },
      ],
      elements: ["Fire", "Wood"], elementStrength: 0.80, commonality: "common" },

    { id: "n007", hangul: "시온", hanja: "始溫", romanized: "Sion",
      meaning: "the warmth at the beginning",
      syllables: [
        { hangul: "시", hanja: "始", element: "Earth", meaning: "beginning" },
        { hangul: "온", hanja: "溫", element: "Water", meaning: "warm, gentle" },
      ],
      elements: ["Earth", "Water"], elementStrength: 0.65, commonality: "uncommon" },

    { id: "n008", hangul: "이안", hanja: "怡安", romanized: "Ian",
      meaning: "joyful peace",
      syllables: [
        { hangul: "이", hanja: "怡", element: "Fire",  meaning: "joyful, harmonious" },
        { hangul: "안", hanja: "安", element: "Earth", meaning: "peace, tranquility" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "uncommon" },

    { id: "n009", hangul: "하율", hanja: "河律", romanized: "Hayul",
      meaning: "the river's rhythm",
      syllables: [
        { hangul: "하", hanja: "河", element: "Water", meaning: "river, flowing" },
        { hangul: "율", hanja: "律", element: "Fire",  meaning: "rhythm, law" },
      ],
      elements: ["Water", "Fire"], elementStrength: 0.65, commonality: "uncommon" },

    { id: "n010", hangul: "도하", hanja: "道夏", romanized: "Doha",
      meaning: "the path of summer",
      syllables: [
        { hangul: "도", hanja: "道", element: "Fire", meaning: "the way, path" },
        { hangul: "하", hanja: "夏", element: "Fire", meaning: "summer, vibrant season" },
      ],
      elements: ["Fire", "Fire"], elementStrength: 0.85, commonality: "uncommon" },

    { id: "n011", hangul: "서우", hanja: "瑞佑", romanized: "Seowoo",
      meaning: "auspicious protection",
      syllables: [
        { hangul: "서", hanja: "瑞", element: "Metal", meaning: "auspicious jade" },
        { hangul: "우", hanja: "佑", element: "Earth", meaning: "to help, protect" },
      ],
      elements: ["Metal", "Earth"], elementStrength: 0.80, commonality: "common" },

    { id: "n012", hangul: "지우", hanja: "智宇", romanized: "Jiwoo",
      meaning: "wisdom across the universe",
      syllables: [
        { hangul: "지", hanja: "智", element: "Fire",  meaning: "wisdom" },
        { hangul: "우", hanja: "宇", element: "Earth", meaning: "universe, vast space" },
      ],
      elements: ["Fire", "Earth"], elementStrength: 0.75, commonality: "common" },

    { id: "n013", hangul: "하민", hanja: "河旻", romanized: "Hamin",
      meaning: "sky reflected in the river",
      syllables: [
        { hangul: "하", hanja: "河", element: "Water", meaning: "river, flowing" },
        { hangul: "민", hanja: "旻", element: "Fire",  meaning: "autumn sky" },
      ],
      elements: ["Water", "Fire"], elementStrength: 0.65, commonality: "uncommon" },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Quick stats for diagnostics — useful when expanding the dataset.
 */
export function getDatasetStats() {
  const stats = { total: 0, byPool: {}, byElement: {}, byCommonality: {} };
  for (const [pool, names] of Object.entries(koreanNamePool)) {
    stats.byPool[pool] = names.length;
    stats.total += names.length;
    for (const n of names) {
      const primary = n.elements[0];
      stats.byElement[primary] = (stats.byElement[primary] ?? 0) + 1;
      stats.byCommonality[n.commonality] = (stats.byCommonality[n.commonality] ?? 0) + 1;
    }
  }
  return stats;
}
