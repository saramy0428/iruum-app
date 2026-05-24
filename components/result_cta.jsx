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
    <section className="mx-auto mt-16 w-full max-w-2xl border-t border-[#1a1a1a] px-6 pt-10 text-center sm:px-8">
      <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#c8392b]">
        Make it yours
      </p>
      <h2 className="mb-4 font-serif text-2xl leading-snug text-[#1a1a1a] sm:text-3xl">
        Turn your name into a Korean name stamp
      </h2>
      <p className="mx-auto mb-8 max-w-md text-sm leading-[1.7] text-[#1a1a1a]/65">
        A hand-carved seal pressed in vermilion ink — a keepsake, a gift, and a
        small talisman bearing the name we found for you.
      </p>

      <Link
        href={href}
        className="inline-block rounded-sm bg-[#c8392b] px-8 py-4 font-serif text-base tracking-wide text-[#faf8f3] transition-colors hover:bg-[#a82e22]"
      >
        Order your Korean name stamp →
      </Link>
    </section>
  );
}
