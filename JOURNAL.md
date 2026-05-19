# iRuum 기술 지도서 (Technical Atlas)

> 코드베이스 항해용 레퍼런스. 어느 파일이 무엇을 하는지, 사주 입력이 DB까지 어떻게 흘러가는지, 어떤 결정이 어떤 제약을 만들었는지 한 곳에 정리한다.
> **문서 시점:** 2026-05-09 (Phase 1 Week 1 완료, 브랜치: `feat/supabase-week1`)

---

## 0. 이 문서의 역할

- 새 기능을 짜기 전에 **가장 먼저 펼쳐볼 문서**.
- 변경하면 안 되는 영역과 변경 가능한 영역의 경계를 명시.
- 의사결정의 근거를 코드와 함께 추적 가능하게 보존.

`CLAUDE.md`가 "프로젝트가 무엇인지"라면, 이 문서는 "프로젝트가 어떻게 돌아가는지"다.

---

## 1. 폴더 구조와 파일별 기술적 역할

```
iruum-app/
├── CLAUDE.md                      # AI 협업용 프로젝트 컨텍스트
├── JOURNAL.md                     # ← 이 문서
├── .env.local.example             # 환경변수 템플릿 (Supabase 키 3종)
├── .gitignore                     # .env*.local, node_modules, .next 등
├── README.md                      # 외부용 프로젝트 소개
├── package.json                   # next, react, @supabase/supabase-js, @supabase/ssr
├── next.config.mjs                # Next.js 설정
├── postcss.config.mjs             # Tailwind 빌드 파이프라인
├── tailwind.config.js             # 디자인 토큰 (paper/ink/vermilion 등)
│
├── app/                           # Next.js 14 App Router 진입점
│   ├── layout.jsx                 # 루트 레이아웃 (폰트, 글로벌 CSS)
│   ├── page.jsx                   # 메인 페이지 (폼 + 결과)
│   ├── globals.css                # Tailwind 베이스 + 커스텀 토큰
│   └── api/
│       └── name/
│           └── route.js           # POST /api/name — 생성기 + DB 저장
│
├── components/                    # 클라이언트 React 컴포넌트
│   ├── InputForm.jsx              # 생년월일·시간·성별·성씨 입력 폼
│   ├── Loading.jsx                # 생성 대기 UI
│   └── ResultCard.jsx             # 추천 이름 결과 카드
│
├── lib/                           # 순수 로직 (UI 의존 없음)
│   ├── saju.js                    # 사주(四柱) 계산 엔진 — 외부 만세력 24/24 검증
│   ├── scoring.js                 # 오행 분석 + 교차 시스템 점수
│   ├── generateDestinyName.js     # 이름 매칭 엔진 (결정론적)
│   └── supabase/
│       ├── client.js              # 브라우저용 anon 키 클라이언트
│       └── server.js              # 서버 전용 service-role 클라이언트 (RLS 우회)
│
├── data/
│   └── koreanNames.js             # 큐레이션된 한국 이름 풀 (54개)
│
├── docs/
│   └── supabase.md                # Supabase 프로젝트 셋업 매뉴얼
│
└── supabase/
    └── migrations/
        └── 20260509000001_init.sql  # 초기 스키마 + RLS + 시드
```

### 파일별 책임 한 줄 요약

| 파일 | 책임 | 변경 정책 |
|---|---|---|
| `lib/saju.js` | 양력 → 천간/지지 4기둥 변환 | **불변(Immutable)** — 만세력 24/24 검증됨. 수정 시 전체 회귀 테스트 필수 |
| `lib/scoring.js` | 4기둥 → 오행 분포 + 점수 산정 | **불변** — 가중치 변경 시 기존 추천 결과 모두 변동 |
| `lib/generateDestinyName.js` | 입력 + 시드 → 이름 추천 | **결정론 계약 보존** — `같은 입력 → 같은 이름` 깨면 안 됨 |
| `data/koreanNames.js` | 후보 이름 풀 (id 안정) | 추가는 OK, **id 변경 금지** (시드 기반 재현성 깨짐) |
| `app/api/name/route.js` | HTTP 어댑터 + DB 저장 | 자유롭게 수정. 단, 응답 스키마는 클라이언트와 계약 |
| `lib/supabase/client.js` | 브라우저 클라이언트 (anon) | 절대 service-role 키 import 금지 |
| `lib/supabase/server.js` | 서버 클라이언트 (service-role, RLS 우회) | 클라이언트 컴포넌트에서 import 금지 |
| `supabase/migrations/*.sql` | DB 스키마 변경 이력 | **append-only** — 이미 적용된 파일은 절대 편집 금지, 새 파일 추가만 |

---

## 2. 데이터 흐름도: 사주 입력 → Supabase 저장

### 2.1 전체 파이프라인 (텍스트 다이어그램)

```
[사용자]
  │  생년월일·시간·성별·성씨 입력
  ▼
[components/InputForm.jsx]
  │  fetch("POST /api/name?seed=<optional>", body)
  ▼
[app/api/name/route.js  ─  POST 핸들러]
  │  ① body.gender 정규화 (Female|Male|Non-binary → female|male|neutral)
  │  ② URL 쿼리에서 sessionSeed 추출 (재추천용 옵션)
  │
  ├─▶ generateDestinyName(input, { sessionSeed, topN: 1 })
  │     │
  │     │  [lib/generateDestinyName.js]
  │     │  ① validateInput()                          ← 형식 검증, 실패 시 INVALID_INPUT throw
  │     │  ② birthDate/birthTime 파싱 → year, month, day, hour, minute
  │     │  ③ getFourPillars(...)                      ← lib/saju.js
  │     │       └─ getYearPillar / getMonthPillar / getDayPillar / getHourPillar
  │     │           각각 천간(stem) + 지지(branch) + element + yinYang 반환
  │     │  ④ analyzeSajuElements(fourPillars)         ← lib/scoring.js
  │     │       └─ Wood/Fire/Earth/Metal/Water 분포(%) + dominant + lacking + balanceState
  │     │  ⑤ decideStrategy(analysis)                 ← 보충 vs 강화 결정
  │     │       └─ lacking 있으면 "boost-lacking", 없으면 "reinforce-dominant"
  │     │  ⑥ koreanNamePool[gender] 풀 선택           ← data/koreanNames.js
  │     │  ⑦ scoreName(name, strategy) × 후보 전체    ← base + 매칭 + 상극 페널티 + commonality
  │     │  ⑧ seededRandom(name.id, seed) × explorationBase 만큼 jitter 가산
  │     │       └─ FNV-1a 해시 + Mulberry32 PRNG (결정론, 의존성 없음)
  │     │  ⑨ finalScore 내림차순 정렬 → top 1 선택
  │     │  ⑩ buildReason() 으로 사람 읽을 수 있는 설명 텍스트 생성
  │     │
  │     ▼
  │  result = { name, alternates, sajuSummary, strategy, reason, input, sessionSeed }
  │
  ├─▶ persistSajuResult(result)                       ← route.js 내부 헬퍼
  │     │
  │     │  ① getSupabaseServiceClient()              ← lib/supabase/server.js
  │     │       └─ 환경변수 없으면 null 반환 (best-effort)
  │     │  ② input.birthDate/birthTime → fourPillars 재계산 (saju.js 재사용)
  │     │       └─ 엔진 응답에 four_pillars가 없으므로 여기서 다시 만든다
  │     │         (엔진은 결정론적이므로 같은 결과 보장)
  │     │  ③ supabase.from("saju_results").insert({
  │     │         session_seed, input, saju_summary,
  │     │         recommended_name, strategy, reason, four_pillars
  │     │     }).select("id").single()
  │     │  ④ 성공: row.id 반환
  │     │     실패: console.error 로그 후 null 반환 (HTTP 응답은 영향 없음)
  │     │
  │     ▼
  │  sajuResultId: string | null
  │
  ▼
[응답 정형화]
  │  { alternates, sessionSeed } 제거 → lean 객체
  │  { ...lean, sajuResultId } 으로 클라이언트에 응답
  ▼
[components/ResultCard.jsx]
  │  결과 카드 렌더링
  │  (sajuResultId는 추후 결제 CTA에서 saju_result_id 외래키로 사용)
  ▼
[Supabase Postgres]
  └─ saju_results 테이블에 row 1개 추가됨 (user_id = NULL)
```

### 2.2 단계별 데이터 형태

| 단계 | 변수명 | 형태 |
|---|---|---|
| 입력 | `body` | `{ surname, birthDate: "YYYY-MM-DD", birthTime?: "HH:MM", birthCountry?, birthCity?, gender }` |
| 4기둥 | `fourPillars` | `{ year, month, day, hour }` 각각 `{ heavenlyStem: {ko,en,element,yinYang}, earthlyBranch: {...}, element, yinYang, label, labelEn }` |
| 오행 분석 | `analysis` | `{ dominantElement, lackingElement, balanceState, elementalDistribution: {Wood,Fire,Earth,Metal,Water}, dominantPolarity, elementConflict }` |
| 전략 | `strategy` | `{ kind: "boost-lacking" \| "reinforce-dominant", target, support, avoid, summary }` |
| 추천 이름 | `result.name` | `{ id, hangul, hanja, romanized, meaning, displayName, fullNameRomanized, syllables, elements, elementStrength, commonality, score, finalScore, scoreBreakdown }` |
| API 응답 | `lean + sajuResultId` | 위 + `{ sajuSummary, strategy, reason, input, sajuResultId }` |
| DB row (`saju_results`) | jsonb 컬럼들 | 위 객체들이 각자 컬럼에 그대로 직렬화 |

### 2.3 에러 경로

| 분기 | 동작 |
|---|---|
| 입력 검증 실패 (`INVALID_INPUT`) | 400, `{ error, details: string[] }` |
| 엔진 throw (예: 성별 풀 없음) | 500, `{ error: "Failed to generate name" }`, 서버 로그 |
| Supabase env 없음 | 응답 정상 반환, `sajuResultId: null` |
| Supabase insert 실패 | 응답 정상 반환, `sajuResultId: null`, 서버 로그 |

**원칙: 외부 시스템 장애는 사용자 응답을 망치지 않는다.** 생성기는 stateless 계약을 유지하며, DB 저장은 부가 기능(best-effort).

---

## 3. 데이터베이스 스키마 상세

마이그레이션 파일: `supabase/migrations/20260509000001_init.sql`

### 3.1 테이블 목록

| 테이블 | 행당 의미 | 핵심 외래키 |
|---|---|---|
| `profiles` | 가입한 사용자의 앱 레벨 프로필 | `id → auth.users(id)` |
| `saju_results` | 생성기 1회 실행 결과 1건 | `user_id → auth.users(id)` (nullable) |
| `products` | 판매 품목 카탈로그 | — |
| `orders` | 주문 헤더 1건 | `user_id` (nullable), `saju_result_id` (필수) |
| `order_items` | 주문 라인 아이템 | `order_id`, `product_id` |
| `webhook_events` | Stripe 이벤트 로그 (멱등성) | PK = Stripe `evt_...` id |

### 3.2 `saju_results` 핵심 컬럼

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid (nullable) | NULL = 익명. Week 2에서 회원가입 시 매핑 |
| `session_seed` | text | `surname\|birthDate\|birthTime\|gender` 결정론 시드. 익명 결과의 소프트 액세스 토큰 역할 |
| `input` | jsonb | 사용자가 입력한 원본 (재계산용) |
| `saju_summary` | jsonb | dominantElement, lackingElement, balanceState, elementalDistribution 등 |
| `recommended_name` | jsonb | 엔진의 `name` 객체 전체 |
| `strategy` | jsonb | boost-lacking / reinforce-dominant 전략 정보 |
| `reason` | text | 사람 읽을 수 있는 추천 사유 |
| `four_pillars` | jsonb | 추후 PDF 렌더링 시 재계산 비용 절감용 |

**인덱스:**
- `user_id` (partial, NOT NULL 인 경우만)
- `session_seed`
- `created_at DESC`

### 3.3 RLS(Row-Level Security) 매트릭스

| 테이블 | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `profiles` | 본인만 (`auth.uid() = id`) | 본인 UPDATE만 |
| `saju_results` | 본인 row만 (익명 row는 service-role로만 접근) | 정책 없음 → service-role 전용 |
| `products` | `is_active = true` 인 행은 누구나 | 정책 없음 → service-role 전용 |
| `orders` | 본인 row만 | 정책 없음 → service-role 전용 |
| `order_items` | 본인 주문에 속한 라인만 | 정책 없음 → service-role 전용 |
| `webhook_events` | 정책 없음 | 정책 없음 → service-role 전용 |

**핵심 원칙:** 기본은 deny-all. 명시적으로 허용한 select 정책만 anon/authenticated 키로 통과한다. 모든 쓰기는 service-role 클라이언트(서버 전용)로만 수행.

### 3.4 트리거

- `on_auth_user_created`: `auth.users` INSERT 시 `profiles` 행 자동 생성
- `*_set_updated_at`: 4개 테이블에 `updated_at = now()` 자동 갱신

---

## 4. 익명 저장 설계: 기술적 근거

### 4.1 결정 사항

생성기 사용자는 회원가입 없이 서비스를 쓸 수 있어야 한다. 동시에 그들의 사주 결과는 손실되면 안 된다(추후 결제 또는 회원가입 후 회수 대상).

### 4.2 기술 구현

| 요소 | 선택 | 이유 |
|---|---|---|
| `saju_results.user_id` | nullable | 회원/비회원 동일 테이블에서 처리. 별도 anonymous 테이블 만들면 union 쿼리·중복 코드 발생 |
| 익명 row 작성 주체 | service-role 서버 클라이언트 | anon 키로 RLS 통과시키려면 INSERT 정책을 열어야 하는데, 그러면 외부에서 임의의 jsonb 페이로드 주입 가능 → 거부 |
| 익명 row 식별자 | `session_seed` | `buildSeed()` 결과 = 입력 기반 결정론 문자열. 같은 사람이 같은 입력으로 다시 오면 매칭 가능 |
| 익명 row 인덱스 | `(user_id) WHERE user_id IS NOT NULL` partial 인덱스 | 익명 row가 다수일 때 회원 조회 인덱스 효율 보존 |

### 4.3 Week 2 회수(claim) 흐름 (예정)

```
1. 사용자가 magic link로 가입 (Supabase Auth)
2. on_auth_user_created 트리거가 profiles 행 생성
3. 클라이언트가 가지고 있던 sessionSeed를 서버에 전달
   (또는 가장 최근 익명 row를 시간 윈도우로 매칭)
4. service-role 클라이언트가 saju_results.user_id = auth.uid() UPDATE
5. 이후 사용자는 자기 결과 페이지에 RLS로 접근 가능
```

---

## 5. $9 PDF 인포그래픽: 비즈니스 로직과 DB 모델링

### 5.1 가격 책정 근거

- **9달러 = 첫 거래의 심리적 임계값.** 결제 결심 시간 짧음, 결제 후 후회 적음.
- 첫 거래 통과율이 LTV 결정. 가격 인상은 두 번째 상품(스탬프, 캘린더)에서 회수.
- Stripe 최소 결제 금액(USD $0.50) 한참 위, 카드 수수료 흡수 여유 있음.

### 5.2 DB 모델링

`products` 테이블에 다음 1건이 마이그레이션 시점에 시드된다:

```sql
slug:        'pdf-infographic'        -- 안정 식별자, 코드에서 직접 참조
type:        'digital'                -- 'physical' 분기와 구분 (배송 로직 다름)
title:       'Personalized Saju Infographic (PDF)'
price_cents: 900
currency:    'usd'
metadata:    { format: 'pdf', pages: 1, language: 'en' }
```

### 5.3 가격 변동 보호: 스냅샷 패턴

`order_items`에는 다음 두 컬럼이 있다:

- `unit_price_cents`: 결제 시점의 단가
- `product_snapshot`: 결제 시점의 product 행 jsonb 전체

**왜 필요한가:** 운영 중 `products.price_cents`를 850 → 1200 으로 바꾸어도, 과거 주문은 결제 당시 가격으로 영구 보존되어야 한다(영수증, 환불, 회계). 카탈로그 변경이 거래 이력을 거꾸로 덮어쓰지 않도록 차단.

### 5.4 디지털 vs 물리 상품 분기

`order_items.delivery_status` ENUM이 두 종류 모두 커버한다:

| 상태 | digital | physical (Phase 2 스탬프) |
|---|---|---|
| `pending` | 결제 후 PDF 생성 대기 | 결제 후 벤더 발주 대기 |
| `delivered` | 이메일 발송 완료 | 수령 확인 |
| `shipped` | 사용 안 함 | 배송 출발 |

`delivery_metadata`(jsonb)에는 digital이면 `{ fileUrl, sentAt }`, physical이면 `{ trackingNumber, carrier }` 같은 형태로 저장한다.

---

## 6. 보안 모델

### 6.1 키 분리 원칙

| 키 | 위치 | 권한 | 노출 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 + 서버 | 호스트 식별만 | 공개 OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | RLS 정책 통과해야 통과 | 공개 OK (의도) |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | RLS 우회, 모든 행 권한 | **절대 공개 금지** |

`lib/supabase/server.js`만이 service-role 키를 읽는다. 이 파일을 클라이언트 컴포넌트(`"use client"`)에서 import하면 빌드 시점에 키가 클라이언트 번들에 포함될 위험이 있으므로 **금지**.

### 6.2 검증 방법

```powershell
# 빌드 결과물에서 service role 키가 누출되지 않았는지 확인
npm run build
# .next/static/ 안에 SERVICE_ROLE 또는 sb_secret_ 같은 패턴이 검색되면 안 됨
```

### 6.3 익명 데이터의 보호 한계

`session_seed`는 입력으로부터 결정론적으로 만들어지기 때문에, 같은 입력을 아는 사람은 같은 시드를 만들 수 있다. 따라서 **현재 익명 결과는 강한 비밀이 아니다.** Week 2에서 `auth.uid()` 매핑 후에야 진짜 보호된다.

---

## 7. 향후 수정 시 핵심 체크포인트

### 7.1 절대 깨면 안 되는 것

- **결정론 계약**: `같은 (surname + birthDate + birthTime + gender) → 같은 추천 이름`. `lib/generateDestinyName.js:166` 의 `buildSeed()` 시그니처와 `data/koreanNames.js`의 `id` 안정성이 이 계약을 지탱한다.
- **사주 엔진 입출력**: `getFourPillars()` 반환 형태 (`lib/saju.js:156`). 변경하면 `scoring.js`, `generateDestinyName.js`, DB의 `four_pillars` 컬럼 호환성 모두 깨짐.
- **API 응답 키**: 클라이언트가 의존하는 필드 (`name`, `sajuSummary`, `strategy`, `reason`). 추가는 OK, 제거/이름 변경은 클라이언트 동시 수정 필요.
- **마이그레이션 append-only**: 이미 운영 DB에 적용된 `20260509000001_init.sql`은 절대 편집하지 않는다. 변경은 새 마이그레이션 파일로.

### 7.2 자유롭게 바꿔도 되는 것

- `app/api/name/route.js` 내부 로직 (응답 키만 유지)
- 새 마이그레이션 추가 (테이블, 컬럼, 인덱스, 정책)
- `data/koreanNames.js`에 새 이름 **추가** (기존 id는 유지)
- `lib/supabase/*` 클라이언트 옵션 조정
- 가격, 통화, 상품 메타데이터 (`products` 테이블 UPDATE)

### 7.3 변경 시 체크리스트

스키마 변경:
- [ ] 새 마이그레이션 파일 (`YYYYMMDDHHMMSS_<설명>.sql`)
- [ ] RLS 정책 명시 (활성화 + select/insert/update/delete 각각)
- [ ] 인덱스 (조회 패턴 기반)
- [ ] `updated_at` 트리거 등록 (필요 시)
- [ ] `docs/supabase.md` 업데이트
- [ ] 로컬 `supabase db push`로 실패 없는지 확인

API 변경:
- [ ] 응답 스키마가 클라이언트와 호환되는지
- [ ] 외부 시스템(Supabase, Stripe, Resend) 장애 시 best-effort 폴백 유지
- [ ] 에러 응답 형태 일관성 (`{ error, details? }`)
- [ ] 빌드 통과 (`npm run build`)

엔진 변경 (saju.js / scoring.js / generateDestinyName.js):
- [ ] 기존 추천 결과가 변동된다는 것을 인지 — Week 2 이후엔 사용자 결과 영구 저장 중이므로 영향 큼
- [ ] 외부 만세력 24/24 회귀 검증 (saju.js 변경 시)
- [ ] 변경 사유와 영향 범위 커밋 메시지에 명시

### 7.4 운영 시 자주 보게 될 곳

| 증상 | 먼저 볼 곳 |
|---|---|
| 추천 결과가 이상함 | `lib/scoring.js:85` `analyzeSajuElements`, `lib/generateDestinyName.js:123` `scoreName` |
| 같은 입력에 다른 이름 | `lib/generateDestinyName.js:164` `buildSeed`, `data/koreanNames.js`의 id 변경 여부 |
| `saju_results` 행이 안 쌓임 | dev 서버 로그에서 `saju_results insert failed:`, env 3종 확인 |
| RLS로 막힘 | `supabase/migrations/20260509000001_init.sql` 의 정책 매트릭스 + 어떤 클라이언트로 쿼리 중인지 (anon vs service-role) |
| 빌드 시 service key 누출 의심 | `.next/static/` grep, `lib/supabase/server.js`의 import 경로 |

---

## 8. 다음 단계 (Week 2 ~ Week 4)

### Week 2 — 인증 & 익명 결과 회수
- Supabase Auth (magic link 이메일)
- `app/login`, `app/auth/callback` 라우트
- 가입 시 `sessionSeed` 매칭 → `saju_results.user_id` UPDATE
- 결과 페이지에 "내 결과" 권한 검증 추가

### Week 3 — PDF 인포그래픽 생성기
- `@react-pdf/renderer` 설치
- `lib/pdf/sajuInfographic.jsx` (사주 4기둥 + 오행 차트 + 추천 이름 + 사유)
- `app/api/render-pdf/route.js` (server-only, Supabase Storage 업로드)
- Supabase Storage 버킷 `infographics` 생성 (private + signed URL)

### Week 4 — Stripe 결제 + Resend 자동 발송
- `app/api/checkout/route.js` (Stripe Checkout Session 생성)
- `app/api/webhooks/stripe/route.js` (`webhook_events` 멱등 저장 후 처리)
- 결제 성공 시 PDF 렌더 → Storage 업로드 → Resend로 이메일 발송
- 실패 시 재시도 큐 (최소 구현: 관리자 알림)

---

## 9. 부록: 환경 변수와 셋업

`.env.local.example` 참고. 셋업 절차는 `docs/supabase.md`에 단계별로 정리되어 있다.

운영 배포 시 Vercel → Project Settings → Environment Variables에 동일 3종 키 등록. `SUPABASE_SERVICE_ROLE_KEY`는 **Sensitive** 표시 활성화.

---

**문서 갱신 정책:** Phase 또는 Week 단위 작업 종료 시 이 문서의 영향받은 섹션을 함께 업데이트한다. 새 마이그레이션 추가 시 §3, 새 라우트 추가 시 §1·§2, 보안 모델 변경 시 §6, 다음 단계 진행 시 §8.
