# snippets: 복사해 쓰는 검증기·baseline 재료

> **대상: 에이전트 참고.** shape 문서가 경로로 지정한 파일만 읽는다. kit 이 아니라 "검증기와 baseline 을 20분 안에 세우는 재료"다.

## 규칙

- **복사해서 과제 폴더로 가져간 뒤 과제에 맞게 고친다.** 이 폴더를 import 하거나 수정하지 않는다.
- **설치 없음.** Python 은 표준 라이브러리만, TypeScript 는 node 내장 모듈만 쓴다.
- **각 파일은 단독 실행 시 자가 테스트**를 돌리고 `OK <이름>` 을 출력한다. 고친 뒤에도 같은 방식으로 테스트를 유지한다.
- 같은 이름의 py/ts 는 같은 입력·출력 형식이다. 환경에 Python 이 있으면 py, 없으면 ts 를 쓴다.
- 파일끼리 import 하지 않는다(각 파일 단독). 두 개가 필요하면 둘 다 복사한다.

## 목록

| 이름 | 용도 | 쓰는 shape | 핵심 함수 |
|---|---|---|---|
| `validate_schedule` | 스케줄 hard constraint 독립 검증 + makespan/tardiness KPI | or_optimization, simulation_whatif | `validate_schedule(problem, schedule)` / `validateSchedule` |
| `greedy_assign` | 항상 feasible 한 baseline: list scheduling greedy, 용량 제약 배정 + 배정 검증 | or_optimization, web_fullstack(계산 포함) | `greedy_schedule`, `greedy_capacity_assign`, `validate_assignment` |
| `group_compare` | 그룹별 robust z-score, rolling z, EWMA 경보, 이상군 vs 정상군 비교 표(효과크기, evidence) | data_analysis_ml, simulation_whatif | `robust_z_by_group`, `ewma_alarm`, `compare_groups` |
| `time_split` | 시간순·그룹 단위 분할, 누수 점검(미래 시각 컬럼, 타깃 프록시, 분할 간 중복 id) | data_analysis_ml | `time_split`, `group_split`, `leakage_report` |
| `fts_search` | 문단 청킹 + BM25(한글 2-gram) + citation 형식, py 는 sqlite FTS5 변형 포함 | rag_agent | `BM25Index.search`, `to_citations` |
| `csv_load` | 인코딩(utf-8/cp949) 감지, 구분자 추정, 헤더 정규화, 타입 추론, 프로파일, 중복 키 | 모든 shape (P1 데이터 계약) | `load_csv`, `profile`, `duplicate_keys` |
| `metrics` | MAE/RMSE/MAPE/R2, precision/recall/F1, PR-AUC, ROC-AUC, Recall@K, 스케줄 KPI | data_analysis_ml, or_optimization | `regression_report`, `classification_report`, `schedule_kpis` |

## 실행 명령

| 언어 | 단일 파일 | 전체 자가 테스트 |
|---|---|---|
| Python | `python3 -I snippets/py/<이름>.py` | `for f in snippets/py/*.py; do python3 -I "$f"; done` |
| TypeScript | `npx tsx snippets/ts/<이름>.ts` (tsx 가 있는 프로젝트에서) | `for f in snippets/ts/*.ts; do npx tsx "$f"; done` |

TypeScript 는 `strict` 설정에서 오류 없이 컴파일된다. tsx 가 없으면 `npx tsc --noEmit --strict --target es2020 --module nodenext --moduleResolution nodenext --skipLibCheck snippets/ts/<이름>.ts` 로 타입만 확인하거나 py 버전을 쓴다.

## 쓰는 순서 (권장)

1. `csv_load` 로 제공 데이터를 읽고 `profile` 결과를 CONTRACT §4 데이터 계약에 옮긴다.
2. 형태에 맞는 **검증기부터** 복사한다 (`validate_schedule`, `leakage_report`, `metrics`).
3. 그 다음 baseline (`greedy_*`, `group_compare`, `BM25Index`) 을 붙이고 검증기를 통과시킨다.
4. 개선안은 같은 검증기·같은 지표로 baseline 과 비교해 DECISIONS 에 수치를 남긴다.

## 주의

- 수치 계산은 코드가 하고, 에이전트는 결과를 해석·설명만 한다. 검증기 출력이 비어 있을 때만 "통과"라고 쓴다.
- 고친 snippet 의 자가 테스트가 깨지면 고친 쪽이 틀렸을 가능성부터 본다.
