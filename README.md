# AI Hackathon Finals Kit — 330분

> **시험 당일에는 [RUNBOOK_330.md](RUNBOOK_330.md) 하나만 열고 위에서부터 따른다.** 이 README는 저장소가 무엇이고 어떻게 쓰는지 설명하는 문서다. 처음 읽는다면 [study/READING_ORDER.md](study/READING_ORDER.md)가 읽는 순서를 안내한다.

## 이 저장소는 무엇인가

SK하이닉스 AI 해커톤 본선(2026-11-11, 개발 시간 330분) 대비 운영 자료다. 과제 정답이 아니다. **어떤 형태의 과제가 나와도 같은 운영 문서(`CONTRACT.md`)로 330분을 굴리기 위한 절차·템플릿·참고 자료**다.

시험장에서는 이 저장소를 과제 폴더 **밖**(`~/finals`)에 clone하고, 과제 폴더에는 파일 세 개(`AGENTS.md`, `CONTRACT.md`, `DECISIONS.md`)만 복사한다. 에이전트는 `~/finals` 전체를 읽지 않는다. `CONTRACT.md` §10에 사람이 경로를 적어 준 파일만 읽는다. 이렇게 하는 이유는 두 가지다. 제출물에 참고 자료가 섞이지 않게 하고, 에이전트가 11장의 시나리오 가설을 전부 읽고 엉뚱한 기능을 만들지 않게 한다.

저장소는 네 층으로 되어 있다.

| 층 | 폴더 | 한 줄 |
|---|---|---|
| 운영 뼈대 | `RUNBOOK_330.md`, `contract/`, `prompts/`, `checklists/` | 시간표, 계약서 템플릿, 단계별 프롬프트, 심사·제출·복구 체크. **과제가 무엇이든 그대로 쓴다** |
| 형태(shape) | `shapes/` | 과제의 작업 형태 8가지별 절차. 과제를 보고 **1~2장만 고른다** |
| 도메인 | `domain/` | 반도체 용어·KPI·데이터 패턴과 출제 시나리오 가설 11장. **사람이 미리 공부**하고, 시험 중에는 일부만 에이전트에게 준다 |
| 코드 | `snippets/` | 의존성 없는 검증기·baseline 함수 7종(py·ts). 에이전트가 **shape가 이름을 댄 것만 복사**해 고쳐 쓴다 |

## 시험 당일 가장 먼저 치는 명령

과제 루트에서 아래 한 줄로 이 저장소를 받는다. 나머지 준비 명령(파일 복사, 런타임 확인, 원본 해시)은 [RUNBOOK_330.md 3절](RUNBOOK_330.md)에 있고, 거기 적힌 블록이 유일한 기준이다.

```bash
git clone --depth 1 https://github.com/nailegg/ai-hackathon-finals.git ~/finals
```

## 형태 판별표

**언제 쓰나.** P0(계약 초안)가 끝나면 `CONTRACT.md` §10에 "주 shape 제안"이 적혀 있다. 사람은 이 표로 다시 분류하지 않는다. 에이전트가 같은 판별 신호로 이미 골랐기 때문이다. 대신 런북 5절의 질문 셋(§2 산출물과 일치하는가, 근거가 README 인용인가, 내가 갈 수 있는 길인가)으로 확인하고, 하나라도 걸릴 때만 이 표를 연다. 그때 이 표의 쓸모는 재분류가 아니라 shape별 부록·보조 세션·코드 기반 조회다. 시간표상 T+15~25다.

**열 읽는 법.** "부록"은 그 형태에서 P2가 과제 루트로 복사해 채우는 세부 문서로, 과제 루트에 생길 파일명으로 적었다(`DATA_QUALITY.md`의 템플릿은 `DATA_CONTRACT.md`, `EVAL_SET.md`의 템플릿은 `RAG_EVAL.md`). "보조 세션"은 꼭 필요할 때만 Terminal 2에서 띄우는 두 번째 에이전트이고, 조건은 각 shape 문서의 "보조 세션" 절에 있다. "코드 기반"은 구현을 무엇 위에서 시작하는지다.

| 과제 README의 신호 | shape | 부록 | 보조 세션 (선택) | 코드 기반 |
|---|---|---|---|---|
| 로그인·역할·저장·화면 명시, 스택 미지정 | `web_fullstack` | WEB.md (+OR_SPEC.md) | OR specialist | web_boilerplate 반입 |
| 웹이지만 스택·스타터 지정, 또는 로그인·저장 없는 화면 | `web_fullstack` (지정 스택 절) | WEB.md | 없음 | 지정 스택, lib/auth만 이식 |
| 배정·스케줄·경로·생산계획, 결과 파일 또는 웹 안의 계산 | `or_optimization` | OR_SPEC.md, RESULT_FILE.md | OR specialist | snippets validate_schedule·greedy_assign |
| 예측·분류·이상탐지·분석 보고 | `data_analysis_ml` | DATA_QUALITY.md, ML_EVAL.md, RESULT_FILE.md | data specialist | snippets time_split·group_compare·metrics |
| 문서 검색·질의응답·인용·승인·에이전트 | `rag_agent` | EVAL_SET.md (+WEB.md) | rag specialist | snippets fts_search |
| CSV·JSON 변환·정제·집계 | `etl_pipeline` | DATA_QUALITY.md, RESULT_FILE.md | 없음 | snippets csv_load |
| 시나리오 재생·what-if·KPI 비교 | `simulation_whatif` | OR_SPEC.md 또는 RESULT_FILE.md | OR specialist | snippets validate_schedule·metrics |
| 기존 소스 + 실패 테스트 | `code_repair` | REPAIR_MAP.md | debug specialist | 제공 코드 |
| 어디에도 깔끔히 맞지 않음 | `unknown` | 산출물에 따라 | research specialist | 표준 라이브러리 |

**혼합 과제는 두 장까지.** 대부분의 과제는 한 행에 깔끔히 들어가지 않는다. 예를 들어 "역할이 있는 웹에서 PM 일정을 짜고 승인한다"는 웹이면서 최적화다. 이럴 때는 다음 순서로 정한다.

1. **채점자가 직접 확인할 산출물**이 무엇인지 본다. 브라우저 화면이면 `web_fullstack`, 결과 파일이면 그 계산의 형태다. 이것이 **주 shape**다.
2. 그 안에 다른 형태의 계산·검색·추출이 있으면 그 형태를 **계산 shape**로 하나 더 적는다. 위 예는 `web_fullstack` + `or_optimization`이다. `web_fullstack` + `rag_agent`처럼 어느 조합이든 된다.
3. 두 장을 넘기지 않는다. 어느 정의에도 1:1로 맞지 않으면 억지로 고르지 말고 `unknown` 하나만 적는다. `shapes/unknown.md`가 그런 과제를 받아내는 절차다.
4. 10분이 지나도 애매하면 분류를 멈춘다. 산출물·입력·검증 방법 세 가지만 정하고 `unknown`으로 간다.

도메인(최적화인가, 검색인가)과 출력 형태(웹인가, 파일인가)는 별개의 축이다. 둘을 섞어서 고민하면 10분이 금방 간다.

## 문서 지도

| 경로 | 누가 읽나 | 무엇이 들어 있나 | 언제 여나 |
|---|---|---|---|
| [RUNBOOK_330.md](RUNBOOK_330.md) | 사람 | 0절 개요·용어, 시간표, 터미널 배치, 구간별 할 일, 흔한 꼬임과 처방 | 시험 내내. 유일하게 열어 두는 문서 |
| [contract/](contract) | 에이전트 (사람이 확정) | `CONTRACT.md` 계약서 템플릿(§0 상태판 ~ §10), `AGENTS.md` 에이전트 규칙, `DECISIONS.md` 결정 기록, `addenda/` 형태별 부록 템플릿 7종 | T+0에 세 파일을 과제 루트로 복사. 부록은 P2가 복사 |
| [prompts/](prompts) | 사람이 복사해 붙임 | P0 계약 → P1 데이터 → P2 AC1 → P3 반복 → P4 체크포인트 → P5 감사 → P6 제출 문서. 각 파일 위에 "언제, 사람이 할 일" 안내. `specialists/`는 보조 세션용 6종 | 시간표의 해당 구간 |
| [shapes/](shapes) | 에이전트 (§10 경로) | 형태 8가지별 판별 신호, 산출물, 330분 단계, Baseline, 독립 검증, 지표, 함정, 보조 세션 조건 | 사람이 §10에 1~2장 경로를 적으면 에이전트가 읽음 |
| [domain/](domain) | 사람 학습, 일부는 에이전트 참조 | `glossary.md` 용어 8절, `kpi_formulas.md` KPI 사전(사람용), `data_patterns.md` 데이터 테이블 8종과 조인 지도(사람용), `data_checklist.md` 데이터 검사 순서·함정(에이전트용), `scenarios/S01~S11.md` 출제 시나리오 가설 카드 | 사람은 11/9~10에 공부. 시험 중 에이전트에게 가는 것은 `data_checklist.md` 경로, P0가 마지막에 읽는 카드 색인 `CARD_INDEX.md`(카드마다 한 줄), 카드 발췌(`CARD_REF.md`)뿐. KPI 정의식은 사람이 §6에 옮겨 적는다 |
| [snippets/](snippets) | 에이전트가 복사 | 검증기·baseline·분할·검색·CSV·지표 함수 7종, py와 ts 동일 동작, 각 파일이 자가 테스트 | shape 문서가 이름을 댄 것만 과제 폴더로 복사 |
| [checklists/](checklists) | 사람 | `grading_2h.md` 2시간 심사 가설과 대비, `submission.md` 제출 절차, `recovery.md` 끊김·모델 오류 복구 | P5, 제출, 장애 때 |
| [study/](study) | 사람 전용 | `READING_ORDER.md` 저장소 안내·읽는 순서·공부할 개념, `README.md` 11/9~10 시간표, `check_questions.md` 체크 문제 10개 | 시험 전. 시험 중에는 열지 않음 |

## 규칙 요약 (왜 그런지와 함께)

- **에이전트에게 주는 참고 문서는 정해져 있다.** 주 shape 1장(+계산 shape 1장), 카드 발췌 `CARD_REF.md` 0~1개, 데이터 체크리스트 `data_checklist.md`, shape가 이름을 댄 snippets, 과제 루트의 부록. 전부 `CONTRACT.md` §10에 경로로 적는다. 어느 카드를 발췌할지는 P0가 계약 초안을 쓴 뒤 색인 `domain/CARD_INDEX.md`만 보고 제안하고 사람이 받아들일지 정한다. 시나리오 카드 원본, KPI 사전, 데이터 패턴 문서, `~/finals` 전체는 읽히지 않는다. 이유: 가설 11장과 지표 61개를 다 읽은 에이전트는 과제에 없는 화면·스키마·지표를 만든다. 지표 정의식은 사람이 필요한 행만 §6에 옮겨 적는다.
- **`CONTRACT.md` §1~§8 본문은 사람이 확정한다.** 초안은 에이전트가 쓰지만, "확정" 뒤에는 §0 상태판, §4 데이터 계약, §7의 상태 열, §9 가정 추가, §10의 런타임·검증·부록 줄만 에이전트가 고친다. 규칙은 `CONTRACT.md` 머리말 한 곳에만 있고 다른 문서는 그것을 가리킨다. 이유: 요구사항이 구현 중에 조용히 바뀌는 것을 막는다.
- **AC 상태는 검증 스크립트가 통과할 때만 바뀐다.** 과제 루트의 `verify_fast.sh`(검증기·curl·테스트, AC마다 수십 초)와 `verify_full.sh`(빌드·깨끗한 재현 포함, P5와 제출 전)가 실체이고, CONTRACT에는 이름만 적는다. 채점자용 한 줄 실행 명령은 §2에 따로 둔다. 이유: 심사는 2시간이라 돌아가는 것만 점수가 되고, "됐다"는 말은 점수가 아니다.
- **카드는 가설이고 README가 우선이다.** `domain/scenarios/`의 11장은 공개된 하이닉스 AX 방향을 근거로 한 연습용 추정이다. 과제와 70% 닮았어도 30%는 다르다. 그래서 원본 대신 Baseline·독립 검증·KPI·함정 절만 발췌해 주고, 그 안의 숫자·상태명·컬럼명도 예시로 취급한다.
- **과제 명세가 README.md가 아니어도 된다.** 없으면 사람이 명세를 과제 루트 `TASK_SPEC.md`에 붙여 넣고(런북 3절), 시험 중 추가 요구도 그 파일 끝에 붙인다. 모든 문서의 "README"는 그 파일을 뜻한다. 요구가 바뀌면 `P3_next_ac.md`의 "요구사항 추가·변경" 프롬프트로 계약부터 고친다.
- **상태는 파일에 있다.** 대화 기록은 끊기면 사라진다. `CONTRACT.md` §0과 `DECISIONS.md`만 있으면 새 세션이 이어 간다. 시각은 모두 실제 시계(HH:MM)로 적는다.

> 시험 안내와 운영진의 최신 지침이 언제나 우선한다. 이 자료는 SK하이닉스/크래프톤의 공식 문서가 아니다.
