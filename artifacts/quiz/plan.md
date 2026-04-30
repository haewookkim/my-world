# quiz 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| LLM 호출 위치 | Route Handler (서버) | API 키 보호 + 정답을 클라이언트에 절대 전달하지 않음 |
| 정답 보호 방식 | In-memory Map + quizId | 출제 시 서버가 answers 보관, 클라이언트에는 quizId + problems만 전달 |
| LLM 모델 | claude-haiku-4-5-20251001 | 빠른 응답, 단순 출제·채점에 충분 |
| 상태 관리 | QuizPage `useState` (Client Component) | 단일 페이지 3-phase wizard, 외부 store 불필요 |
| 학년·난이도 선택 UI | shadcn ToggleGroup | 2-7 선택지는 ToggleGroup (shadcn 규칙) |
| 라우팅 | `app/page.tsx` | 단일 경로, 별도 `/quiz` 라우트 불필요 |

> ⚠️ **배포 주의**: quiz store는 Node.js 단일 프로세스 인메모리 Map이다. 서버리스·Edge 배포 시 요청 간 Map이 공유되지 않으므로 Upstash Redis 등 외부 KV로 교체해야 한다.

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| ANTHROPIC_API_KEY | Env var | `.env.local` | Task 2 |

## 데이터 모델

### Problem (출제 응답 — 클라이언트 노출)
- `subject`: `'국어' | '수학' | '영어'`
- `type`: `'서술형' | '단답형' | '객관식'`
- `prompt`: string
- `points`: number
- `choices?`: string[] (객관식만)

### QuizEntry (서버 in-memory store — 클라이언트 미노출)
- `grade`, `difficulty`
- `problems`: Problem[]
- `answers`: string[] (정답, problems 인덱스 대응)
- `explanations`: string[]
- `createdAt`: number (ms, 30분 TTL)

### SubmitResult (채점 응답)
- `subject`, `userAnswer`, `correctAnswer`
- `isCorrect`: boolean
- `explanation`: string
- `earnedPoints`, `points`: number

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| claude-api | Task 2 | Anthropic SDK 설치, prompt 구성, prompt caching, 모델 선택 |
| shadcn | Task 4, 5, 6, 7 | ToggleGroup 설치, Card·Button·Input·Textarea·Badge 조합 규칙 |
| next-best-practices | Task 2, 3, 7 | RSC 경계, Route Handler 패턴 |
| vercel-react-best-practices | Task 7 | Client Component 최소화, waterfall 방지 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/quiz.ts` | New | Task 1 |
| `lib/quiz-store.ts` | New | Task 1 |
| `lib/quiz-store.test.ts` | New | Task 1 |
| `app/api/quiz/generate/route.ts` | New | Task 2 |
| `app/api/quiz/generate/route.test.ts` | New | Task 2 |
| `app/api/quiz/submit/route.ts` | New | Task 3 |
| `app/api/quiz/submit/route.test.ts` | New | Task 3 |
| `components/ui/toggle-group.tsx` | New (shadcn add) | Task 4 |
| `components/quiz/GradeSelector.tsx` | New | Task 4 |
| `components/quiz/GradeSelector.test.tsx` | New | Task 4 |
| `components/quiz/ProblemCard.tsx` | New | Task 5 |
| `components/quiz/ProblemCard.test.tsx` | New | Task 5 |
| `components/quiz/ResultCard.tsx` | New | Task 6 |
| `components/quiz/ResultCard.test.tsx` | New | Task 6 |
| `components/quiz/QuizPage.tsx` | New | Task 7, 8 |
| `components/quiz/QuizPage.test.tsx` | New | Task 7, 8 |
| `app/page.tsx` | Modify | Task 7 |

## Tasks

---

### Task 1: 타입 정의 + 퀴즈 서버 스토어

- **담당 시나리오**: 불변 규칙 — 정답 보호 (서버 측 기반)
- **크기**: S (2 파일)
- **의존성**: None
- **참조**: 없음
- **구현 대상**:
  - `types/quiz.ts` — Grade, Difficulty, Problem, QuizEntry, SubmitResult 타입
  - `lib/quiz-store.ts` — module-level Map, set/get/delete, 30분 TTL 자동 만료
  - `lib/quiz-store.test.ts`
- **수용 기준**:
  - [ ] `store.set(id, entry)` 후 `store.get(id)` → 동일 entry 반환
  - [ ] `store.delete(id)` 후 `store.get(id)` → `undefined`
  - [ ] `createdAt`이 30분 초과된 entry → `store.get(id)` → `undefined` (Date.now mock 사용)
- **검증**: `bun run test -- quiz-store`

---

### Task 2: 출제 Route Handler — LLM 출제 (Scenario 1 서버, Scenario 5)

- **담당 시나리오**: Scenario 1 (server), Scenario 5 (에러 분기)
- **크기**: M (3 파일)
- **의존성**: Task 1 (quiz-store)
- **참조**:
  - claude-api 스킬 — `bunx --bun add @anthropic-ai/sdk`, Anthropic SDK client 구성, prompt caching
  - next-best-practices — Route Handler, runtime selection
- **구현 대상**:
  - `app/api/quiz/generate/route.ts` — `POST /api/quiz/generate`
  - `app/api/quiz/generate/route.test.ts`
  - `.env.local` 추가: `ANTHROPIC_API_KEY=...` (커밋 금지)
- **LLM 프롬프트 구조**:
  - System: 학년별 교육과정 기준 문제 출제자 역할
  - User: `{grade, difficulty}` → 국·수·영 1문제씩 JSON 생성 (subject, type, prompt, points, choices?, answer, explanation)
  - 모델: `claude-haiku-4-5-20251001`
- **수용 기준**:
  - [ ] `POST {grade:"중2", difficulty:"중"}` → `200 {quizId: string, problems: Problem[]}`, problems 길이 3
  - [ ] 응답 body에 `answer` · `explanation` 필드 없음 (정답 보호)
  - [ ] 각 problem의 `subject` ∈ {"국어","수학","영어"}
  - [ ] `type === "객관식"` problem에 `choices` 배열 포함
  - [ ] Anthropic API 에러 → `500 {error: string}`
  - [ ] `grade` 또는 `difficulty` 누락 → `400 {error: string}`
- **검증**: `bun run test -- generate`

---

### Task 3: 채점 Route Handler (Scenario 2, 3, 4 서버)

- **담당 시나리오**: Scenario 2 (전부 정답), 3 (일부 오답), 4 (빈 답안)
- **크기**: S (2 파일)
- **의존성**: Task 1 (quiz-store), Task 2 (quizId 발급 이후)
- **참조**:
  - next-best-practices — Route Handler
- **구현 대상**:
  - `app/api/quiz/submit/route.ts` — `POST /api/quiz/submit`
  - `app/api/quiz/submit/route.test.ts`
- **채점 규칙**: userAnswer와 correctAnswer를 소문자·공백 정규화 후 비교. 빈 문자열은 오답.
- **수용 기준**:
  - [ ] 정답 답안 → `isCorrect:true`, `earnedPoints === points`
  - [ ] 오답 답안 → `isCorrect:false`, `earnedPoints === 0`
  - [ ] 빈 문자열 답안 → `isCorrect:false`, `earnedPoints === 0`
  - [ ] 응답의 `totalEarned` === 정답 과목 earnedPoints 합
  - [ ] 존재하지 않는 quizId → `404 {error: string}`
  - [ ] 응답에 `correctAnswer` · `explanation` 포함 (제출 후 최초 노출)
- **검증**: `bun run test -- submit`

---

### Checkpoint: Tasks 1-3 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] API 레이어 동작 확인: `curl -X POST http://localhost:3000/api/quiz/generate -H 'Content-Type: application/json' -d '{"grade":"중2","difficulty":"중"}'` → 응답에 answer 필드 없음
- [ ] submit curl 확인: quizId + answers 제출 → results + totalEarned 반환

---

### Task 4: 학년·난이도 선택 UI — GradeSelector (Scenario 1 select phase)

- **담당 시나리오**: Scenario 1 (select phase UI)
- **크기**: S (2 파일)
- **의존성**: None (UI-only)
- **참조**:
  - shadcn — `bunx --bun shadcn@latest add toggle-group`, ToggleGroup 조합 규칙 (forms.md)
- **구현 대상**:
  - `components/ui/toggle-group.tsx` (shadcn CLI로 설치)
  - `components/quiz/GradeSelector.tsx`
  - `components/quiz/GradeSelector.test.tsx`
- **수용 기준**:
  - [ ] 학년 버튼 "중1"~"고3" 6개 렌더됨
  - [ ] 난이도 버튼 "상"·"중"·"하" 3개 렌더됨
  - [ ] "중2" 클릭 → "중2" 선택됨, 이전 선택 해제
  - [ ] "중" 클릭 → "중" 선택됨, 이전 선택 해제
  - [ ] `onSubmit(grade, difficulty)` 콜백이 노출된 "출제" 버튼 클릭 시 호출됨
- **검증**: `bun run test -- GradeSelector`

---

### Task 5: 문제 카드 UI — ProblemCard (Scenario 1 quiz phase)

- **담당 시나리오**: Scenario 1 (quiz phase), 불변 규칙(정답 보호 UI 측)
- **크기**: S (2 파일)
- **의존성**: None
- **참조**:
  - shadcn — Card, Textarea, Input, Button (선택지)
- **구현 대상**:
  - `components/quiz/ProblemCard.tsx` — props: `{problem: Problem, answer: string, onAnswerChange: (v: string) => void, disabled?: boolean}`
  - `components/quiz/ProblemCard.test.tsx`
- **수용 기준**:
  - [ ] subject·배점·유형(예: "10점 · 서술형")이 카드 헤더에 표시됨
  - [ ] `type="서술형"` → Textarea 렌더됨
  - [ ] `type="단답형"` → Input 렌더됨
  - [ ] `type="객관식"` → choices 수만큼 선택지 버튼 렌더됨
  - [ ] 카드 내 "정답" · "해설" 텍스트 없음 (정답 보호 UI)
  - [ ] Textarea/Input 입력 시 onAnswerChange 호출됨
  - [ ] 객관식 선택지 클릭 시 onAnswerChange 호출됨
  - [ ] `disabled=true` → 입력/선택 불가
- **검증**: `bun run test -- ProblemCard`

---

### Task 6: 결과 카드 UI — ResultCard (Scenario 2, 3, 4)

- **담당 시나리오**: Scenario 2 (전부 정답), Scenario 3 (오답), Scenario 4 (빈 답안)
- **크기**: S (2 파일)
- **의존성**: None
- **참조**:
  - shadcn — Card, Badge
- **구현 대상**:
  - `components/quiz/ResultCard.tsx` — props: `{result: SubmitResult}`
  - `components/quiz/ResultCard.test.tsx`
- **수용 기준**:
  - [ ] `isCorrect:true` → "정답" 텍스트, 획득 배점(예: "10/10") 표시
  - [ ] `isCorrect:false` → "오답" 텍스트, `earnedPoints:0`, 시스템 정답 표시
  - [ ] `userAnswer === ""` → "내 답안" 칸에 "(미응답)" 표시
  - [ ] 해설 텍스트가 항상 표시됨
  - [ ] subject·배점이 카드 헤더에 표시됨
- **검증**: `bun run test -- ResultCard`

---

### Checkpoint: Tasks 4-6 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`

---

### Task 7: QuizPage 상태 머신 통합 (Scenario 1~7)

- **담당 시나리오**: Scenario 1~7 전체 (선택 → 출제 → 결과 → 재출제/처음으로)
- **크기**: M (3 파일)
- **의존성**: Task 2, 3 (API), Task 4, 5, 6 (UI 컴포넌트)
- **참조**:
  - vercel-react-best-practices — Client Component 범위 최소화
  - next-best-practices — `'use client'` 위치, RSC 경계
  - shadcn — Button (제출·재출제·처음으로)
- **구현 대상**:
  - `components/quiz/QuizPage.tsx` (`'use client'`) — phase: `'select' | 'quiz' | 'result'` 상태 머신
  - `components/quiz/QuizPage.test.tsx`
  - `app/page.tsx` — ComponentExample 제거, QuizPage 렌더
- **수용 기준**:
  - [ ] 학년·난이도 선택 후 "출제" → 카드 3개 표시, 학년·난이도 배지 표시
  - [ ] 카드에 정답·해설 없음
  - [ ] "제출" 클릭 → 과목별 정오·해설·점수 + 총점 표시
  - [ ] 전부 정답 → "정답" × 3, 총점 만점 표시
  - [ ] 일부 오답 → 오답 카드에 userAnswer·correctAnswer 모두 표시, 총점 부분 합산
  - [ ] 빈 답안 포함 제출 가능 ("제출" 버튼 항상 활성)
  - [ ] 빈 답안 과목의 earnedPoints가 0으로, 총점에 해당 배점이 포함되지 않음
  - [ ] "새 문제로 다시 풀기" → 이전 답안·결과 사라짐, 동일 학년·난이도로 재출제
  - [ ] "처음으로" → 선택 화면으로 복귀, 학년·난이도 선택값이 빈 상태(선택 없음)로 reset됨
- **검증**: `bun run test -- QuizPage`

---

### Task 8: 에러 처리 + 중복 호출 방지 (Scenario 5 + 불변 규칙)

- **담당 시나리오**: Scenario 5, Scenario 6 (재출제 실패 분기), 불변 규칙(중복 호출 방지)
- **크기**: S (1 파일 수정)
- **의존성**: Task 7 (QuizPage)
- **참조**: 없음
- **구현 대상**:
  - `components/quiz/QuizPage.tsx` — 에러 상태, loading 중 버튼 비활성
  - `components/quiz/QuizPage.test.tsx` — 에러 케이스 추가
- **수용 기준**:
  - [ ] 출제 API 실패 → "출제에 실패했습니다. 다시 시도해 주세요." 메시지 + "다시 시도" 버튼 표시
  - [ ] 에러 시 학년·난이도 선택값 유지됨
  - [ ] "다시 시도" 클릭 → 동일 학년·난이도로 재출제 요청
  - [ ] "새 문제로 다시 풀기" 클릭 후 출제 실패 → 동일 에러 메시지 + "다시 시도" 버튼 표시, 학년·난이도 유지
  - [ ] 출제 진행 중 "출제" 버튼 비활성화
  - [ ] 제출 진행 중 "제출" 버튼 비활성화
  - [ ] "새 문제로 다시 풀기" 진행 중 해당 버튼 비활성화
- **검증**: `bun run test -- QuizPage`

---

### Checkpoint: 전체

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] Scenario 1 end-to-end: `bun run dev` → 학년·난이도 선택 → 출제 → 답안 입력 → 제출 → 결과 확인
- [ ] 불변 규칙 검증: 브라우저 Network 탭에서 `/api/quiz/generate` 응답 body에 `answer` 필드 없음 확인
- [ ] Scenario 5: generate API mock 실패 → 에러 메시지·"다시 시도" 버튼 표시 확인

---

## 미결정 항목

- 없음

---

## 추가 Tasks (LLM 제공자 교체: Anthropic → Gemini, 사용자 본인 키)

### Task 9: Gemini SDK로 generate route 교체

- **담당 시나리오**: Scenario 1 (server), Scenario 5 (잘못된 키 포함)
- **크기**: M (3 파일 + 패키지 변경)
- **의존성**: Task 2 (기존 Anthropic 구현 대체)
- **참조**:
  - Gemini Node SDK: `bunx --bun add @google/generative-ai`, `bunx --bun remove @anthropic-ai/sdk`
- **구현 대상**:
  - `app/api/quiz/generate/route.ts` — Anthropic 호출 → Gemini 호출. request body에 `apiKey` 받기. 키 없으면 400.
  - `app/api/quiz/generate/route.test.ts` — Gemini SDK 모킹으로 갱신
  - `package.json` / `bun.lock` — 의존성 교체
  - `.env.local`에서 `ANTHROPIC_API_KEY` 제거
- **모델**: `gemini-2.5-flash` (무료 한도, 빠른 응답)
- **수용 기준**:
  - [ ] `POST {grade, difficulty, apiKey}` → `200 {quizId, problems}`
  - [ ] `apiKey` 누락 → `400`
  - [ ] 응답 body에 `answer`·`explanation` 필드 없음 (정답 보호 유지)
  - [ ] Gemini API 에러(401, 429, 5xx) → `500`
- **검증**: `bun run test -- generate`

---

### Task 10: ApiKeyInput 컴포넌트 + 도움말 다이얼로그

- **담당 시나리오**: Scenario 0
- **크기**: S (2 파일)
- **의존성**: shadcn dialog 설치 (`bunx --bun shadcn@latest add dialog` — 이미 있을 수 있음)
- **구현 대상**:
  - `components/quiz/ApiKeyInput.tsx` — props: `{value: string, onChange: (v: string) => void}`. Input + 도움말 버튼.
  - `components/quiz/ApiKeyInput.test.tsx`
- **수용 기준**:
  - [ ] Input과 "도움말" 버튼이 함께 렌더된다
  - [ ] Input 변경 시 onChange 호출
  - [ ] "도움말" 클릭 시 다이얼로그가 열리고, Gemini API 키 발급 단계(① https://aistudio.google.com/ 접속, ② Get API Key 클릭, ③ Create API Key 클릭, ④ 키 복사 후 입력란에 붙여넣기)가 표시됨
  - [ ] 다이얼로그에 외부 링크가 새 탭으로 열린다 (target="_blank" + rel="noopener noreferrer")
- **검증**: `bun run test -- ApiKeyInput`

---

### Task 11: QuizPage에 키 상태 + localStorage 연동

- **담당 시나리오**: Scenario 0, Scenario 5 (키 변경 후 재시도)
- **크기**: S (1 파일 수정 + 테스트)
- **의존성**: Task 9, Task 10
- **구현 대상**:
  - `components/quiz/QuizPage.tsx` — `useState<string>('')` + `useEffect`로 mount 시 localStorage에서 로드, 변경 시 저장. `generateQuiz` 호출 시 body에 `apiKey` 포함.
  - `components/quiz/QuizPage.test.tsx` — 키 입력 시 출제 활성화, 새로고침 후 키 유지(localStorage 모킹) 케이스 추가
- **수용 기준**:
  - [ ] 키가 빈 문자열 → 출제 버튼 disabled
  - [ ] 키 입력 → 출제 버튼 enabled
  - [ ] 출제 요청 body에 `apiKey` 포함
  - [ ] 키 변경 시 localStorage `quiz-api-key`에 즉시 저장
  - [ ] mount 시 localStorage에서 키 복원
- **검증**: `bun run test -- QuizPage`

---

### Checkpoint: Tasks 9-11 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `bun run dev` → 키 입력 → 출제 → 채점 end-to-end 동작
- [ ] 도움말 다이얼로그 동작 확인 (브라우저)
- [ ] 새로고침 후 키 유지 확인
