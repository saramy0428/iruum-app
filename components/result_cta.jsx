import Link from "next/link";

/**
 * 결과 페이지 하단 CTA.
 * 기존 "MAKE IT YOURS" 두 카드(Custom Korean Name Stamp / Korean Name Goods Collection)
 * 자리에 이 컴포넌트를 그대로 넣으면 됩니다.
 *
 * @param {Object} props.recommendedName - saju_results.recommended_name
 *   { hangul, hanja, fullNameRomanized?, romanized? }
 */
export function NameStampCTA({ recommendedName }) {
  const name = recommendedName?.hangul ?? "";
  const hanja = recommendedName?.hanja ?? "";
  const romanized =
    recommendedName?.fullNameRomanized ?? recommendedName?.romanized ?? "";

  // 한글·한자가 들어가므로 반드시 인코딩
  const query = new URLSearchParams();
  if (name) query.set("name", name);
  if (hanja) query.set("hanja", hanja);
  if (romanized) query.set("romanized", romanized);

  const href = `/stamp${query.toString() ? `?${query}` : ""}`;

  return (
    <div className="w-full text-center">
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-vermilion">
        Make it yours
      </p>
      <h2 className="mb-3 font-serif text-xl md:text-2xl leading-snug text-ink">
        Turn your name into a Korean name stamp
      </h2>
      <p className="mx-auto mb-5 max-w-sm text-xs md:text-sm leading-[1.7] text-ink/70">
        A hand-carved seal pressed in vermilion ink — a keepsake, a gift, and a
        small talisman bearing the name we found for you.
      </p>

      <Link
        href={href}
        className="inline-block rounded-lg bg-vermilion px-6 py-3 font-sans text-sm tracking-wide text-paper transition-colors hover:bg-vermilion/85"
      >
        Order your Korean name stamp →
      </Link>
    </div>
  );
}
