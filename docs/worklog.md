# Work log

작업 일지 + 재사용 가능한 패턴 모음. 새 항목은 위쪽에 추가.

## 사용법
- 의미 있는 변경이 머지/푸시될 때마다 "Sessions" 맨 위에 새 항목 추가
- 각 세션 항목: **변경 내용 / 이유 / 만진 파일 / 커밋 / 메모** 형식
- 다른 프로젝트에서도 쓸 만한 일반 패턴은 "Reusable patterns"에 별도로 정리
- 잘못된 기록을 발견하면 그 자리에서 수정 (이 문서는 진실의 원천이 아님 — 참고용)

---

# Sessions

## 2026-06-08 — Hangul dedup, TTS rate, work log 도입

### 변경 내용
1. **`data/koreanNames.js` 중복 한글 제거**
   - `f178 (美娜, "Mina2")`, `f226 (梨娜, "Ina2")` 두 항목 삭제
   - 둘 다 기존 항목 (`f013 珉雅 Mina`, `f211 仁雅 Ina`)과 한글이 겹쳐서 매칭 결정성을 깨뜨림
   - 풀: 514 → 512개
2. **TTS 속도 조정**: `components/ResultCard.jsx` `utterance.rate` `0.7 → 0.6`
   - 외국인이 음절 경계를 더 잘 듣도록
3. **work log 도입**: 이 문서 (`docs/worklog.md`)

### 만진 파일
- `data/koreanNames.js`
- `components/ResultCard.jsx`
- `docs/worklog.md` (새 파일)

### 커밋
- `d5698ae` fix(names): remove duplicate hangul entries (Mina, Ina)
- `c4d4488` tweak(result): slow Korean name TTS rate from 0.7 to 0.6

### 메모 / 미해결 사항
- `data/koreanNames.js` 상단 주석은 여전히 **"총 500개: 여자 300 · 남자 100 · 중성 100"** 로 적혀 있음
  - 실제는 **여자 302 · 남자 105 · 중성 105 = 512** (이번 dedup 반영)
  - 다음에 데이터 변경할 때 주석도 같이 동기화하기
- 풀 구조 메모: `_f`, `_m = _f`, `_n = _f` 헬퍼 alias를 쓰므로 ID prefix (`f###`, `m###`, `n###`)로 구분해야 정확하게 셈
- 매칭 엔진 (`lib/generateDestinyName.js`)이 결정적(FNV-1a + Mulberry32)이라 풀이 바뀌면 같은 입력에 대해 다른 이름이 나올 수 있음 — 데이터 수정 시 인지

---

## 2026-06-08 — Waitlist API + `feat/supabase-week1` 정리

### 배경
- 로컬에 추적되지 않은 waitlist 파일 두 개 발견
- `feat/supabase-week1` 머지 요청 받음 → 확인해 보니 **이미 머지된 상태**였음 (`72a19a1`)
- `main..feat/supabase-week1` 비어 있음, `feat/supabase-week1..main`은 3개 앞섬

### 변경 내용
- **Waitlist (Phase 1 Week 1 보조)**
  - `app/api/waitlist/route.js`: POST `{email, productType}` 받아 Supabase에 upsert
  - 허용 `productType`: `"name-stamp"`, `"goods-collection"`
  - 검증: 이메일 정규식 + productType 화이트리스트
  - 중복은 unique 인덱스로 조용히 무시 (`ignoreDuplicates: true`)
  - Service role 클라이언트가 없으면 503 반환
  - `supabase/migrations/20260520000001_waitlist.sql`: `public.waitlist` 테이블 + RLS
    - `anon`/`authenticated` insert 허용, select/update/delete 정책 없음 (service role 전용)
    - `unique (email, product_type)` + product/created_at 인덱스

### 푸시 도중 만난 일
- `git push origin main` 거부됨 — 원격에 3개 커밋이 더 있었음:
  - `6643a03 feat(names): expand dataset from 54 to 500 entries`
  - `d3ab881 fix(ui): foreigner-friendly date/time picker + slower TTS`
  - `5bc61d5 Merge remote-tracking branch 'origin/main'`
- 로컬 waitlist 커밋과 파일이 겹치지 않아 `git rebase origin/main`으로 정리 → 정상 푸시

### 커밋
- `65b34e0` feat(waitlist): collect emails for physical-goods products

### 메모
- `feat/supabase-week1` 브랜치는 이미 main에 흡수되었으므로 안전하게 삭제해도 됨 (아직 안 지움)
- waitlist 테이블은 마이그레이션만 추가했지 **Supabase에 실제로 적용했는지는 별개** — 다음 작업 시 `supabase db push` 또는 대시보드에서 실행 확인 필요

---

# Reusable patterns

다른 프로젝트에서도 그대로 가져갈 만한 작업 패턴 모음.

## Git

### "이미 머지된 브랜치" 진단
머지 요청을 받았을 때 진짜로 머지가 필요한지 먼저 확인:
```bash
git log --oneline main..feature-branch   # feature가 main보다 앞선 커밋
git log --oneline feature-branch..main   # main이 feature보다 앞선 커밋
```
- 첫 번째가 비어 있고 두 번째에 머지 커밋이 보이면 **이미 머지됨**. `git merge`를 다시 돌리면 "Already up to date"만 나오므로 시간 낭비.

### Push 거부 — 원격에 추가 커밋 있을 때
1. `git fetch origin` 후 `git log --oneline HEAD..origin/main`으로 **원격이 뭘 가지고 있는지 먼저 본다**
2. 로컬 커밋과 원격 커밋이 다른 파일을 건드리면 → `git rebase origin/main` (선형 히스토리)
3. 같은 파일을 건드리면 → 충돌 가능성, rebase 시 충돌 해결
4. 절대 `--force` 먼저 시도하지 말 것. 원격 내용을 보지도 않고 덮어쓰면 다른 사람 작업 날아감

### 의미 단위 커밋 분리
- 한 번에 두 가지 무관한 변경이 워킹 트리에 있으면 **개별 커밋으로 분리** (`git add <파일>` 단위)
- 커밋 메시지: 첫 줄 짧은 요약 (`type(scope): subject`), 본문은 **WHY** 중심 (HOW는 diff가 말해줌)

## 데이터 파일 디버깅

### Helper alias가 있는 리스트 세기
이 프로젝트의 `koreanNames.js`처럼 `const _m = _f`, `const _n = _f` 패턴을 쓰면:
- `grep '^  _f('` 만으로는 전체를 못 셈 (`_m`, `_n` 누락)
- **ID prefix로 세는 게 안전**: `grep -oE '"(f|m|n)[0-9]+"' file.js | sort -u | awk -F\" '{print $2}' | grep -oE '^[fmn]' | sort | uniq -c`
- 또는 각 helper별 `grep '^  _f('`, `^  _m(`, `^  _n(`을 따로 세고 합산

### 한글 중복 검사
deterministic 매칭 엔진(이 프로젝트의 FNV-1a + Mulberry32 같은)을 쓸 때 풀에 같은 한글이 두 번 나오면 매칭이 깨질 수 있음. 추가/수정 후에는:
```bash
# 한글만 추출해서 중복 찾기
grep -oE '"[가-힣]+"' data/koreanNames.js | sort | uniq -d
```

## Supabase

### RLS 정책 — "insert만 허용, read는 service role"
공개 폼 (waitlist, 피드백 수집 등)에서 자주 쓰는 패턴:
```sql
alter table public.X enable row level security;
create policy "X: public insert" on public.X for insert
  to anon, authenticated with check (true);
-- select/update/delete 정책 없음 → service role만 가능
```
API 라우트에서는 반드시 **service role client**로 읽기. anon client로는 못 봄.

### 중복 무시하는 upsert
`unique(email, product_type)` 같은 제약이 있으면:
```js
.upsert({ ... }, { onConflict: "email,product_type", ignoreDuplicates: true })
```
사용자에게는 항상 성공으로 보여줘서 이메일 존재 여부를 노출하지 않음.

## Next.js API route

### 입력 검증 순서 (POST endpoint)
1. `request.json()` try/catch → 잘못된 JSON은 400
2. 타입/형식 검증 (정규식, 화이트리스트) → 400
3. 외부 의존성 확인 (DB 클라이언트 등) → 503
4. 실제 작업 → 실패 시 500, 성공 시 200
이 순서를 지키면 클라이언트가 받는 에러 코드가 의미 있게 분리됨.

---

# 자주 참조하는 명령어

```bash
# 빌드 검증 (main 푸시 전 필수)
npm run build

# 로컬 dev
npm run dev

# 현재 main과 origin/main 차이
git fetch origin && git log --oneline main...origin/main

# 한글 중복 검사
grep -oE '"[가-힣]+"' data/koreanNames.js | sort | uniq -d
```
