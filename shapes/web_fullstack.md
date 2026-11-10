# Shape: 웹 풀스택 업무 서비스

> **대상: 에이전트 참고 — 지시가 아니다.** 지시는 과제 루트의 AGENTS.md와 CONTRACT.md가 우선한다. CONTRACT §10에 이 파일 경로가 적혀 있을 때만 읽는다.

**적용:** 브라우저로 확인하는 서비스. 로그인·역할·데이터 저장·화면이 요구된다. 계산(최적화·분석)이 함께 있으면 이 문서가 **주 shape**, 다른 shape 한 장(`or_optimization.md`, `data_analysis_ml.md`, `rag_agent.md`, `simulation_whatif.md` 등)이 **계산 shape**다(CONTRACT §10에 둘 다 적는다, 최대 2장). 계산 AC는 계산 shape의 Baseline·독립 검증을 따르되 화면·API·권한은 이 문서를 따른다.

## 판별 신호
- README에 "관리자/직원/엔지니어" 같은 역할과 "로그인" 또는 "권한"이 명시됨
- "등록·조회·수정·삭제", "화면", "대시보드", "신청·승인" 같은 사용자 여정 문구
- 제공 데이터를 "적재해서 보여 달라"는 요구 (CSV·JSON을 화면에서 조회)
- 채점이 "브라우저에서 확인" 또는 "테스트 계정으로 로그인"으로 설명됨
- 스택 지정이 없거나 "자유"라고 적힘 → boilerplate 후보. 특정 스택·스타터가 지정되면 아래 "스택 지정" 규칙

## 산출물 형태
- 채점자가 먼저 볼 것: 제출 문서(`SUBMISSION.md`) 상단의 서버 실행 명령과 역할별 테스트 계정, 그리고 첫 화면
- 실행 중인 서버(boilerplate 사용 시 `0.0.0.0:3000`, 아니면 README 지정 포트나 그 스택의 기본 포트), 시드된 DB, 역할별 로그인 → 핵심 여정 1개 → 결과 화면
- 검증 명령: AC마다 도는 `verify_fast.sh`에는 curl 체크와 테스트만 넣는다. `cd web && pnpm build`와 `bash scripts/smoke.sh`(boilerplate), 지정 스택이면 그 스택의 빌드는 `verify_full.sh`에만 넣는다. boilerplate 과제의 `verify_fast.sh`에는 타입 검사 `(cd web && pnpm exec tsc --noEmit)` 한 줄을 넣는다(빌드가 아니고 수 초 걸린다. 지운 route 때문에 실패하면 `rm -rf web/.next/types` 후 다시 돌린다). `web/BOILERPLATE.md`의 "smoke.sh 하단에 check 추가" 안내는 따르지 않는다. AC check는 `verify_fast.sh`에만 둔다

## 붙일 부록 (과제 루트 파일명. §10 '붙인 부록' 줄에 이 이름으로 적는다)
- `WEB.md` (역할표, 라우트·API 목록, 접근 정책, 테스트 계정)
- 계산이 있으면 `OR_SPEC.md`, 데이터 적재가 있으면 `DATA_QUALITY.md`

## 330분 단계
> P0·P1 행은 이미 지난 단계의 점검표다. 빠진 것이 있어도 확정된 CONTRACT 본문은 고치지 않고 §9에 적고 보고한다. 시각은 권장이고, 실제 진행은 CONTRACT §0과 §7의 필수 AC 게이트를 따른다.

| 구간 | 이 형태에서 할 일 |
|---|---|
| T+5~15 계약(P0) | §5 역할표를 README 근거로 채움. boilerplate 사용 판정을 §10에 적음(아래 조건). 사람은 병렬로 `web/` 반입 |
| T+15~25 데이터(P1) | 적재할 파일의 스키마·키·인코딩을 §4에. 시드가 파일을 읽도록 설계 |
| T+25~90 AC1(P2) | 로그인 → 권한 검사 API → DB → 결과 화면의 수직 흐름 1개. placeholder 교체·삭제 시작 |
| T+90~점심 / 점심후~T+255 (P3, P4) | AC 하나씩. 점심 직전 P4로 §0 갱신·서버 상태 기록. 계산 AC는 baseline + 독립 검증 함수 동시 작성 |
| T+255~285 감사(P5) | 401/403 curl, 다른 사용자 데이터 차단, (boilerplate 사용 시) `check-placeholders.sh` 0건, build 통과, 화면에 템플릿 문구 없음, smoke가 만든 `smoke-*@example.com` 사용자 삭제 |
| T+285~305 제출 문서(P6) | 실행 방법, 테스트 계정, AC별 확인 경로, 미완 항목 |
| T+305~330 제출 | 용량 제한이면 `.next-build`·`.next/cache`부터 삭제. 서버는 끄지 않음 |

## boilerplate 사용 조건과 반입
다음을 **모두** 만족할 때만 §10에 "boilerplate 사용: 예":
브라우저로 확인하는 웹 / 로그인·역할·저장 중 둘 이상 필요 / 언어·프레임워크·스타터 지정 없음 / 기존 코드 수리 아님 / node 20 이상.

반입은 응시자가 P0와 병렬로 이미 한다. `web/`이 있으면 아래를 다시 실행하지 않는다. §10이 "예"인데 `web/`이 없을 때만 실행한다.
```bash
cd <과제 루트>
git clone --depth 1 https://github.com/nailegg/web_boilerplate.git web   # 대상 이름 web 필수
bash web/scripts/exam-init.sh --install                                  # 정리 + .env + install + bootstrap
```
반입 후 기반 코드 안내는 `web/BOILERPLATE.md`를 읽고, 첫 리소스 CRUD를 만들 때 `web/docs/FEATURE_TEMPLATE.md`, 소유자·공유 정책이 걸리면 `web/docs/ACCESS_POLICY_GUIDE.md`만 추가로 읽는다. exam-init이 "설치·bootstrap 완료"를 출력하면 성공이다. WARN으로 다른 pnpm 명령을 알려 주면 이후 모든 `pnpm`을 그 명령으로 바꾼다. 3000번이 응답하지 않을 때만 `cd web && nohup pnpm dev > /tmp/web-dev.log 2>&1 &`로 띄우고(서버는 하나만) `bash web/scripts/smoke.sh`가 전부 PASS인지 확인한 뒤 보고한다. 설치가 5분 넘게 막히면 `rm -rf web` 후 아래 "스택 지정" 경로로 간다.

**스택 지정 또는 로그인·저장 없는 단순 화면:** boilerplate를 반입하지 않는다. 로그인이 필요하고 `/tmp/ref_web`이 없으면 `git clone --depth 1 https://github.com/nailegg/web_boilerplate.git /tmp/ref_web`으로 참고 사본을 받는다(과제 루트 밖이고 clone은 금지된 git 쓰기 명령이 아니다). 거기서 `lib/auth/`·`lib/http.ts`·`prisma/schema.prisma`의 User·Session·`app/api/auth/login/route.ts` 패턴(해시 비밀번호, DB 세션, HttpOnly 쿠키, 서버측 역할 검사, 401/403 구분)만 지정 스택으로 이식한다. 다른 파일은 보지 않는다. 로그인도 스택 지정도 없으면 과제 환경에 이미 있는 런타임으로 서버 하나를 띄워 JSON API 하나와 정적 HTML 한 장으로 시작하고 curl로 확인한다. 프레임워크 설치에 5분 넘게 쓰지 않는다. boilerplate 설치 실패로 이 경로에 왔을 때도 같다. 새 프레임워크를 받지 않고 과제 환경에 이미 있는 런타임의 표준 라이브러리 서버(node 내장 http 또는 python)로 간다.

## Baseline
- §5 역할표의 역할 중 AC1에 필요한 것만(보통 2개, 예: 관리자/사용자). 로그인 요구가 없으면 역할 없이 화면과 API만. 리소스 1개의 목록·생성 화면, 서버측 권한 검사, 파일 읽는 시드. 미관은 뒤로
- 계산이 섞이면 몇 초 안에 끝나는 greedy를 API 요청 안에서 동기 실행하고 결과를 DB에 저장. Job은 수십 초 이상일 때만

## 독립 검증
- 비로그인 401, 역할 불일치 403, 타인 데이터 접근 차단을 curl로. 잘못된 입력 400
- 저장 후 새로고침해도 유지. 시드 재실행이 멱등
- 예시 AC 검증 명령: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<포트>/api/<res>` → `401`; (boilerplate 사용 시) 로그인이 필요한 check는 `web/scripts/smoke.sh`의 `check()`와 쿠키 jar 형식을 `verify_fast.sh`에 복사해 시드 계정으로 로그인해 쓴다; 계산 AC는 `validate_*` 함수 위반 0건

## 지표
> §6 "지표 정의"가 비어 있을 때 §9 가정으로 제안할 후보다. §6에 정의가 있으면 그것만 계산한다.

- 주: AC 통과 수, 권한 테스트 통과, 핵심 여정이 브라우저에서 끝까지 됨
- 보조: build 통과, 입력 검증, 오류 메시지
- 함정 지표: 화면 수. 많을수록 좋은 게 아니다

## 흔한 함정
- boilerplate 화면·Item·Job을 과제 기능처럼 확장함 (placeholder는 교체·삭제 대상)
- 버튼만 숨기고 서버 권한 검사를 생략함
- 제공 데이터를 코드에 하드코딩함
- 스키마 변경 후 서버 재시작을 잊어 새 API만 500
- 서버를 둘 띄우거나 다른 서버를 kill함
- 내부 Browser에서 로그인이 튕김 → `.env`에 `COOKIE_SAMESITE="none"`, `COOKIE_SECURE="true"` 후 재시작
- 계약 밖 기능(알림, 차트 꾸미기)에 30분 이상 씀

## 쓸 snippets
- `csv_load`: 시드에서 cp949/utf-8 CSV를 읽어 적재할 때
- `greedy_assign` + `validate_schedule`: 배정·스케줄 계산 AC가 있을 때 `server/<feature>/`에 이식
- `group_compare`: 대시보드에 집단 비교 표가 필요할 때

## 참고 카드
과제 루트에 `CARD_REF.md`가 있을 때만 그 파일을 읽는다. 카드 원본은 읽지 않는다.

## 만들지 않을 것
- 요구되지 않은 Auth·역할·DB, 실시간 알림, 파일 업로드 UI, 디자인 시스템
- 브라우저 E2E(반입 시 삭제됨). 검증은 smoke와 curl로
- 여러 서버, 여러 세션으로 나눈 프론트/백 구현

## 보조 세션 (응시자용, 메인 세션은 띄우지 않는다)
이 형태는 분할하지 않는다. 계산 정식화가 막히면 `or_optimization.md`의 규칙대로 OR 보조 세션 1개만(사람이 띄움, 동시 1개, 10분, 결과는 `OR_SPEC.md` 한 파일, `prompts/specialists/specialist-or.md`).
