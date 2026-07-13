/**
 * computePillars.js — 폼 입력 → 사주 4주 산출 공통 헬퍼.
 *
 * 파싱과 경도 보정을 한 곳에 모아 route.js / generateDestinyName.js 간 중복 제거.
 * saju.js 는 순수 계산 엔진으로 유지 — 여기서 보정 후 넘겨준다.
 */

import { getFourPillars } from "./saju.js";
import { getSolarTimeOffsetMinutes } from "./longitudeCorrection.js";

export function computePillarsFromInput({ birthDate, birthTime, birthCountry, placeUnknown }) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime ? birthTime.split(":").map(Number) : [9, 0];

  const offsetMin = placeUnknown ? 0 : getSolarTimeOffsetMinutes(birthCountry);

  // Date 레벨에서 shift → 자정/월/년 경계 자동 롤오버 (일주·월주까지 정확)
  const shifted = new Date(year, month - 1, day, hour, minute + offsetMin);

  return getFourPillars(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    shifted.getDate(),
    shifted.getHours(),
    shifted.getMinutes()
  );
}
