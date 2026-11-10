# 저장소 안내 · 읽는 순서 · 공부할 개념

> **대상: 사람.** 11/9~10 학습용. 시험장에서는 이 파일을 열지 않고 `RUNBOOK_330.md`만 본다.

## 1. 디렉터리 설명 (누가, 언제 읽는가)

| 경로 | 한 줄 설명 | 읽는 사람 | 시험 중 쓰임 |
|---|---|---|---|
| `README.md` | 키트 입구. T+0 명령, **형태 판별표**(8 shape), 문서 지도, 규칙 요약 | 사람 | 시험 중에는 런북 5절 질문 셋에 걸릴 때만 판별표를 연다(조회용) |
| `RUNBOOK_330.md` | 330분 시간표, 터미널 배치, 구간별 사람 할 일, **흔한 꼬임 21개와 처방** | 사람 | 시험 내내 열어 두는 유일한 문서 |
| `contract/CONTRACT.md` | 요구사항 계약이자 운영판. §0 상태판 ~ §10 구현 기반 결정. 머리말에 **수정 권한 규칙 하나** | 에이전트+사람 | T+0에 과제 루트로 복사. 모든 판단의 기준 |
| `contract/AGENTS.md` | 에이전트 행동 규칙. 우선순위, 금지 사항(git·API 키), 디렉터리 지도, 검증·보고 방식 | 에이전트 | T+0 복사. 자동 로드되는 에이전트도 있고 아닌 것도 있어 RUNBOOK 4절 첫머리의 질문으로 확인하고, 아니면 그 에이전트의 파일명(CLAUDE.md 등)으로 사본을 둔다. P0, P2, P3, P4 재개 프롬프트의 첫 줄도 읽으라고 한다 |
| `contract/DECISIONS.md` | append-only 결정 기록. `HH:MM \| 종류 \| 내용 \| 근거` | 둘 다 | 과정 평가와 서술형의 근거 |
| `contract/addenda/` | 형태별 부록 템플릿 7종(WEB, RESULT_FILE, OR_SPEC, DATA_CONTRACT→DATA_QUALITY, RAG_EVAL→EVAL_SET, ML_EVAL, REPAIR_MAP). `README.md`에 복사 명령 | 에이전트 | §10에 적힌 것만 P2가 복사해 채움 |
| `prompts/P0~P6` | 단계별로 붙여 넣는 프롬프트. P0 계약 → P1 데이터 → P2 AC1 → P3 반복(하단에 중간 보고·요구사항 추가·변경·품질 개선 블록) → P4 체크포인트 → P5 감사 → P6 제출 문서 | 사람이 복사 | 본문은 런북 4~7절에 그대로 실려 있다. 시험장에서는 런북의 블록을 붙인다 |
| `prompts/specialists/` | 보조 세션용 프롬프트 6종(or, data, rag, debug, research, rubric). 읽기 전용, 결과 파일 1개, 10분 | 사람이 복사 | shape 문서의 "보조 세션" 조건을 만족할 때만 |
| `shapes/` | 과제 **형태**별 작업 명세 8장. 판별 신호, 산출물, 330분 단계, Baseline, 독립 검증, 지표, 함정, 보조 세션 조건 | 에이전트(§10 경로) | 주 shape 1장 + 계산 shape 0~1장 |
| `domain/glossary.md` | 반도체 용어집 8절(전공정, 후공정, 보전, 물류, KPI, 안전, AX 용어, 자가 점검) | 사람 | 에이전트에게는 필요할 때만 |
| `domain/kpi_formulas.md` | KPI 정의식·분모분자·함정 7절(품질, 설비, 흐름, 스케줄링, 분류, 회귀, 이상탐지) | 사람 | README가 요구하는 지표의 행만 §6 "지표 정의" 줄에 옮겨 적는다. 에이전트에게 경로를 주지 않음 |
| `domain/data_patterns.md` | 반도체 데이터 테이블 8종의 전형적 컬럼·키·함정, 조인 지도 | 사람 | P1 보고를 검토할 때 대조. 에이전트에게 주지 않음 |
| `domain/data_checklist.md` | 데이터 검사 순서 9단계와 데이터 종류 무관 함정 9개 | 에이전트 | 데이터가 있으면 §10 경로로 P1이 읽음 |
| `domain/scenarios/S01~S11` | 출제 시나리오 **가설** 카드 11장. 공개 신호 → 가상 출제문 → 예상 데이터 → Baseline → 독립 검증 → KPI → 함정 → 화면 → 우선순위 | 사람 | 원본은 에이전트에게 주지 않음. P0가 색인 `domain/CARD_INDEX.md`(카드마다 한 줄)만 보고 닮은 카드를 제안하고, 사람이 받아들이면 Baseline~함정만 `CARD_REF.md`로 발췌 |
| `snippets/py`, `snippets/ts` | 의존성 없는 함수 7종 × 2언어. 각 파일이 자가 테스트 | 에이전트가 복사 | shape가 이름을 댄 것만 |
| `checklists/` | `grading_2h.md`(2시간 심사 가설 A~E), `submission.md`(T+305/320), `recovery.md`(끊김·모델 오류) | 사람 | P5·P6·장애 때 |
| `study/` | 이 폴더. 학습 순서, 체크 문제 10개, 이 파일 | 사람 | 시험 중 안 봄 |

**한 줄 요약.** 사람은 `RUNBOOK`을 보며 `prompts`를 붙이고 `CONTRACT`를 확정한다. 에이전트는 `AGENTS` 규칙 아래 `CONTRACT` §10이 가리키는 `shapes`·`snippets`·부록·`CARD_REF`만 읽고 구현한다. `domain`은 사람의 사전 지식이다.

## 2. 읽는 순서

전부 읽지 않는다. 아래 순서대로, 각 단계의 "확인"이 되면 다음으로 간다. 총 4~5시간.

### 1단계 · 운영 뼈대 (60분) — 시험장에서 손이 움직이게
1. `RUNBOOK_330.md` 처음부터 끝까지. 시간표의 구간 이름(P0~P6)과 각 구간에서 **사람이** 하는 일만 기억한다.
2. `README.md`의 형태 판별표와 "혼합 과제는 두 장까지" 문단. 주 shape / 계산 shape 구분. 시험 중 재분류용이 아니라 공부용·조회용이다. 확정 절차는 런북 5절 1번의 질문 셋.
3. `contract/CONTRACT.md` 머리말(수정 권한)과 §0, §7, §9, §10만. 나머지 절은 제목만.
4. 런북 5절 3번의 검토 표 → 런북 6-1절 P2 블록의 0)~6) 단계 → 런북 6-5절 "요구사항 추가·변경"(사람이 먼저 하는 두 가지: TASK_SPEC.md에 원문, DECISIONS 한 줄). 프롬프트 본문은 런북에 실려 있으므로 `prompts/` 파일을 따로 열 필요는 없다.
- 확인: 시간표를 보지 않고 "T+15에 내가 하는 5가지"를 말할 수 있다(§10 경로 저장 → P1 붙이기 → 초안 검토 → 카드 제안 수락 여부 → 보조 세션 여부).

### 2단계 · 도메인 기초 (90분) — README를 읽을 때 단어가 걸리지 않게
5. `domain/glossary.md` 1절 전공정, 3절 설비 보전, 5절 KPI, 7절 AX 용어. 2·4·6절은 제목과 굵은 단어만.
6. `domain/kpi_formulas.md` 공통 함정 표 + 1절 품질 + 2절 설비 + 4절 스케줄링 + 5절 분류. 3·6·7절은 훑기.
7. `domain/data_checklist.md` 전체(에이전트가 받는 유일한 데이터 문서가 무엇인지 안다) → `domain/data_patterns.md` "조인 지도". 테이블 8종은 컬럼 이름만 눈에 익힌다.
- 확인: `glossary.md` 8절 자가 점검 5문항, `study/check_questions.md` 1~7번.

### 3단계 · 형태와 카드 (75분) — 과제가 무엇이든 "어디로 갈지" 10분 안에 정하게
8. `shapes/web_fullstack.md`, `shapes/or_optimization.md` 정독(예선 형태). 특히 330분 단계 표와 "보조 세션" 조건.
9. `shapes/data_analysis_ml.md`(T+45 게이트), `shapes/rag_agent.md`(LLM API 없을 때 경로), `shapes/unknown.md`(중간 형태 표, 즉시 전환 규칙). 나머지 3장은 판별 신호만.
10. 카드 S07, S04, S08, S01 정독. S02, S10, S11은 Baseline과 함정만. S03, S05, S06, S09는 제목과 가상 출제문만.
11. `domain/README.md` 카드 선택 규칙 4개. **카드는 가설이고 README가 우선**이라는 문장을 소리 내어 읽는다.
- 확인: `check_questions.md` 8~10번. 임의의 카드 하나를 골라 "입력 단위·산출물·채점"을 다른 카드와 비교해 말할 수 있다.

### 4단계 · 도구와 심사 (45분) — 에이전트가 만든 것을 내가 판단할 수 있게
12. `snippets/README.md` 목록 표와 "한계와 대체". `snippets/py/validate_schedule.py`와 `greedy_assign.py`를 열어 함수 시그니처와 반환 형식만 본다.
13. `checklists/grading_2h.md` A~E. 심사 2시간이면 무엇이 점수가 되는지.
14. `checklists/recovery.md`, `checklists/submission.md`, 런북 6-4절(P4 중단 전·재개).
- 확인: "validator가 통과했다"는 보고를 받았을 때 내가 직접 칠 명령을 말할 수 있다(`bash verify_fast.sh`).

### 읽지 않아도 되는 것
- `contract/addenda/*` 본문(에이전트가 채움. `README.md`의 표만 본다)
- `prompts/specialists/*` 본문(필요할 때 복사만)
- `shapes/code_repair.md`, `etl_pipeline.md`, `simulation_whatif.md` 본문
- `snippets/ts/*`(py와 동일 동작)

## 3. 공부할 개념

### A. 시험 운영 개념 (키트 고유)
| 개념 | 알아야 할 것 |
|---|---|
| shape 확정 질문 셋 | 판별표로 재분류하지 않는다. §2 산출물과 일치하는가 / 근거가 README 인용인가 / 내가 갈 수 있는 길인가. 하나라도 걸릴 때만 판별표(조회용) |
| 주 shape / 계산 shape | 채점자가 확인할 산출물이 속한 형태가 주. 그 안의 계산·검색은 계산 shape. 최대 2장, 1:1로 안 맞으면 unknown 하나 |
| CONTRACT 수정 권한 | 초안은 에이전트, 확정은 사람. 확정 뒤 에이전트가 고치는 범위는 CONTRACT 머리말 "수정 권한" 한 곳에만 적혀 있다(§0, §4, §7 상태·verify 줄, §9 추가, §10 런타임·검증·부록 줄) |
| verify_fast.sh / verify_full.sh | fast는 AC마다(검증기·curl·테스트), full은 P5·제출 전(빌드·깨끗한 재현). 파일이 실체, CONTRACT엔 이름만 |
| AC1 게이트 | 제출 파일이 산출물인 과제(예측 파일·ETL)는 T+45에 형식이 맞는 baseline 제출 파일, 그 밖의 과제는 T+90에 AC1 통과 |
| CARD_REF 발췌 | 카드 원본은 에이전트에게 안 줌. P0가 색인만 보고 §10에 `S0n`/`없음`을 제안, 사람은 "그 카드의 Baseline을 그대로 써도 되는가" 하나로 수락 여부만 정함. Baseline~함정만 뽑고, 값은 예시, README 우선 |
| 보조 세션 | 읽기 전용·결과 파일 1개·동시 1개·10분·사람이 띄움. 메인은 그 파일을 건드리지 않음(§0 "반영 대기") |
| 체크포인트 | 상태는 전부 파일에. §0 상태판 + DECISIONS 마지막 줄 + `ls -lt`로 재개 |
| TASK_SPEC.md | 과제에 README.md가 없을 때 사람이 명세를 붙여 넣는 파일. 시험 중 추가 요구도 끝에 `## 추가 (HH:MM)`로 붙인다. 모든 문서의 "README"는 이 파일을 뜻하게 된다 |
| 요구사항 추가·변경 | 코드를 멈추고 계약부터. 원문을 TASK_SPEC.md에, DECISIONS에 `요구변경` 줄, P3의 전용 프롬프트로 §7에 AC 추가. 사람이 §2·§5·§6을 고치고 "확정" 뒤에 P3 재개 |
| 증거표 | P5에서 AC마다 "주장 → 확인 명령 → 실제 출력" 한 줄. 심사자가 SUBMISSION.md만 읽고 재현 |

### B. 반도체 도메인 개념 (비전공자 최소 세트)
| 영역 | 개념 | 왜 필요한가 |
|---|---|---|
| 단위·계층 | Lot(25장) > Wafer > Die. Step·Recipe·Tool·Chamber | 모든 조인과 집계 단위. 1:N 합계 함정 |
| 전공정 | 포토·식각·증착·CMP·세정·이온주입, FDC 센서, 계측(metrology), SPC 관리한계 vs Spec 규격한계 | S01·S03·S06 입력 데이터의 의미 |
| 후공정 | 프로브/패키지 테스트, Hard bin / Soft bin, 수율 분석 | S09와 "SSD TEST 저수율" 공개 신호 |
| 설비 보전 | PM(계획) vs BM(고장), MTBF·MTTR·Availability, 부품 리드타임 | S07, 가장 예선과 닮은 형태 |
| 물류 | OHT·AMR·AMHS, 반송 요청·배차·경로, 대기 시간 | S08, VRP/배정 계열 |
| 품질 KPI | Wafer yield vs Die yield, OEE = A×P×Q, Cp/Cpk, Scrap·Rework | §6 지표 정의와 §7 기대 결과 |
| 흐름 KPI | WIP(시점 스냅샷), Cycle time, Throughput, Utilization vs Availability | 대시보드 숫자가 맞는지 판단 |
| 안전 | 작업허가(PTW), LOTO, 위험 등급 행렬 | S10 상태 머신·승인 단계 |
| AX 용어 | 자율형 팹 3축(Operational AI / Physical AI / Digital Twin), GaiA, 제안→승인 패턴, RBAC·감사 로그 | README의 의도 읽기, 서술형 답 |

### C. 계산·검증 개념 (에이전트 결과를 판단하기 위해)
| 개념 | 한 줄 |
|---|---|
| Hard constraint vs soft objective | 위반 0이 유효 조건, 점수는 그다음. validator는 계산 코드와 독립 |
| 디스패칭 규칙 | FIFO, EDD(납기순), CR(critical ratio), SPT. 20분 baseline은 greedy + 규칙 |
| Tardiness·Makespan | max(0, 완료−납기), 마지막 완료 시각. 조기 완료는 0 |
| 불균형 분류 지표 | Accuracy 함정, Precision/Recall/F1, PR-AUC, Recall@K vs Precision@K, 혼동행렬 먼저 |
| 시간 누수 | 예측 시점 이후 컬럼, 정답 프록시, 분할 간 중복 id. `time_split`·`leakage_report` |
| Robust z-score | (x−median)/(1.4826·MAD), 그룹(Tool·Recipe)별 기준선, MAD=0 처리 |
| Recipe mix | Tool 수율 차이가 사실 제품 mix 때문일 수 있음. 층화 비교, 표본 수 표시 |
| 1:N 조인 합계 | Lot:Wafer 조인 뒤 Lot 수량이 25배. 집계 단위에서 먼저 집계 |
| BM25·기권 | 키워드 검색 + 임계값 미만이면 "근거 없음". 인용은 존재하는 doc_id만 |
| 제안→승인 상태 머신 | 전이 함수 하나, 서버에서 역할 검사(401/403), 감사 로그 = 전이 수 |

## 4. 11/10 손 드라이런 전에 마지막으로 볼 것
- `RUNBOOK_330.md` 3절 "주의할 점"(README 없을 때), 4절 첫 문단(AGENTS.md 자동 로드 확인), "T+15~25" 절, "흔한 꼬임" 표.
- `domain/README.md` 카드 선택 규칙 1번(고르는 것은 P0)과 3번(사람은 Baseline 질문 하나로 수락 여부만).
- 이 파일 3-A 표.
