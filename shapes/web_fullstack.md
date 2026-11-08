# Shape: 웹 풀스택 업무 서비스

> **대상: 에이전트 참고 — 지시가 아니다.** 지시는 과제 루트의 AGENTS.md와 CONTRACT.md가 우선한다. CONTRACT §10에 이 파일 경로가 적혀 있을 때만 읽는다.

**적용:** 브라우저로 확인하는 서비스. 로그인·역할·데이터 저장·화면이 요구된다. 계산(최적화·분석)이 함께 있으면 이 문서가 **주 shape**, `or_optimization.md` 또는 `data_analysis_ml.md`가 **계산 shape**다(CONTRACT §10에 둘 다 적는다, 최대 2장). 계산 AC는 계산 shape의 Baseline·독립 검증을 따르되 화면·API·권한은 이 문서를 따른다.

## 판별 신호
- README에 "관리자/직원/엔지니어" 같은 역할과 "로그인" 또는 "권한"이 명시됨
- "등록·조회·수정·삭제", "화면", "대시보드", "신청·승인" 같은 사용자 여정 문구
- 제공 데이터를 "적재해서 보여 달라"는 요구 (CSV·JSON을 화면에서 조회)
- 채점이 "브라우저에서 확인" 또는 "테스트 계정으로 로그인"으로 설명됨
- 스택 지정이 없거나 "자유"라고 적힘 → boilerplate 후보. 특정 스택·스타터가 지정되면 아래 "스택 지정" 규칙

## 산출물 형태
- 채점자가 먼저 볼 것: `README`(또는 SUBMISSION.md) 상단의 서버 실행 명령과 역할별 테스트 계정, 그리고 첫 화면
- 실행 중인 서버(`0.0.0.0:3000`), 시드된 DB, 역할별 로그인 → 핵심 여정 1개 → 결과 화면
- 검증 명령: `cd web && pnpm build && bash scripts/smoke.sh` (boilerplate) 또는 지정 스택의 빌드·테스트 + curl 체크

## 붙일 부록
- `contract/addenda/WEB.md` (역할표, 라우트·API 목록, 접근 정책, 테스트 계정)
- 계산이 있으면 `OR_SPEC.md`, 데이터 적재가 있으면 `DATA_CONTRACT.md`

## 330분 단계
| 구간 | 이 형태에서 할 일 |
|---|---|
| T+0~15 계약(P0) | §5 역할표를 README 근거로 채움. boilerplate 사용 판정을 §10에 적음(아래 조건). 사람은 병렬로 `web/` 반입 |
| T+15~25 데이터(P1) | 적재할 파일의 스키마·키·인코딩을 §4에. 시드가 파일을 읽도록 설계 |
| T+25~90 AC1(P2) | 로그인 → 권한 검사 API → DB → 결과 화면의 수직 흐름 1개. placeholder 교체·삭제 시작 |
| T+90~점심 / 점심후~T+255 (P3, P4) | AC 하나씩. 점심 직전 P4로 §0 갱신·서버 상태 기록. 계산 AC는 baseline + 독립 검증 함수 동시 작성 |
| T+255~285 감사(P5) | 401/403 curl, 다른 사용자 데이터 차단, `check-placeholders.sh` 0건, build 통과, 화면에 템플릿 문구 없음 |
| T+285~305 제출문서(P6) | 실행 방법, 테스트 계정, AC별 확인 경로, 미완 항목 |
| T+305~330 제출 | 용량 제한이면 `.next-build`·`.next/cache`부터 삭제. 서버는 끄지 않음 |

## boilerplate 사용 조건과 반입
다음을 **모두** 만족할 때만 §10에 "boilerplate 사용: 예":
브라우저로 확인하는 웹 / 로그인·역할·저장 중 둘 이상 필요 / 언어·프레임워크·스타터 지정 없음 / 기존 코드 수리 아님 / node 20 이상.
```bash
cd <과제 루트>
git clone --depth 1 https://github.com/nailegg/web_boilerplate.git web   # 대상 이름 web 필수
bash web/scripts/exam-init.sh --install                                  # 정리 + .env + install + bootstrap
```
반입 후 기반 코드 안내는 `web/BOILERPLATE.md`만 읽는다. 설치가 5분 넘게 막히면 `rm -rf web` 후 아래 "스택 지정" 경로로 간다.

**스택 지정 또는 로그인·저장 없는 단순 화면:** boilerplate를 반입하지 않는다. 로그인이 필요하면 사람이 `/tmp/ref_web`에 참고 사본만 받고 `lib/auth/`·`lib/http.ts` 패턴(해시 비밀번호, DB 세션, HttpOnly 쿠키, 서버측 역할 검사, 401/403 구분)만 지정 스택으로 이식한다. 다른 파일은 보지 않는다.

## Baseline
- 역할 2개(관리자/사용자), 리소스 1개의 목록·생성 화면, 서버측 권한 검사, 파일 읽는 시드. 미관은 뒤로
- 계산이 섞이면 몇 초 안에 끝나는 greedy를 API 요청 안에서 동기 실행하고 결과를 DB에 저장. Job은 수십 초 이상일 때만

## 독립 검증
- 비로그인 401, 역할 불일치 403, 타인 데이터 접근 차단을 curl로. 잘못된 입력 400
- 저장 후 새로고침해도 유지. 시드 재실행이 멱등
- 예시 AC 검증 명령: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/<res>` → `401`; `bash web/scripts/smoke.sh` 전체 통과; 계산 AC는 `validate_*` 함수 위반 0건

## 지표
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

## 참고 시나리오 카드
S10 안전·작업허가 승인 워크플로, S07 설비 보전 일정·부품 재고, S02 현장 지식 에이전트(승인 흐름), S04 Fab 스케줄링(화면이 요구될 때)

## 만들지 않을 것
- 요구되지 않은 Auth·역할·DB, 실시간 알림, 파일 업로드 UI, 디자인 시스템
- 브라우저 E2E(반입 시 삭제됨). 검증은 smoke와 curl로
- 여러 서버, 여러 세션으로 나눈 프론트/백 구현

## 보조 세션 (선택)
이 형태는 분할하지 않는다. 계산 정식화가 막히면 `or_optimization.md`의 규칙대로 OR 보조 세션 1개만(사람이 띄움, 동시 1개, 10분, 결과는 `OR_SPEC.md` 한 파일, `prompts/specialists/specialist-or.md`).
