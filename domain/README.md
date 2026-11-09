# domain/ 사용법

> 반도체 도메인 지식 층. 기존 playbook은 도메인 중립이었고, 본선은 "반도체 현장의 고민을 AI로 해결"이 명시돼 있어 이 층을 추가했다. 모든 내용은 공개 자료 기반 일반 지식이며, 과제 README가 다르게 정의하면 README가 우선한다.

| 파일 | 대상 | 사람이 읽는 때 | 에이전트에게 경로를 주는 때 |
|---|---|---|---|
| `glossary.md` | 사람 중심 | 11/9~10 학습(60분), 시험 중 모르는 용어가 나올 때 | 기본은 주지 않는다. 컬럼 의미를 못 푸는 용어가 있을 때만 해당 절을 지정 |
| `kpi_formulas.md` | 사람·에이전트 | 학습(40분) | CONTRACT §6 지표 정의, §7 AC 기대 결과를 쓸 때 |
| `data_patterns.md` | 에이전트 중심 | 학습(30분) | 데이터가 있으면 P0 확정 때 §10에 경로를 적어 P1이 읽게 한다 |
| `scenarios/S01~S11.md` | 사람 | 학습 시 전부 훑고, 시험 중 README와 가장 닮은 1장 선택 | 원본은 주지 않는다. Baseline~함정 절만 `CARD_REF.md`로 뽑아 과제 루트에 두고 §10에 적는다(명령은 RUNBOOK T+15~25) |

## 카드 선택 규칙

1. P0 계약 요약을 읽고 가장 닮은 카드 1장을 고른다. 둘 이상 닮으면 산출물 형태가 같은 쪽.
2. 고르기 전에 README와 카드의 차이 3개(입력 단위·산출물·채점 방식)를 DECISIONS에 적는다. 하나라도 핵심이면 카드를 주지 않는다. 카드를 먼저 공부한 사람이 README를 카드에 끼워 맞추는 것이 가장 흔한 실수다.
3. "닮았다"는 입력 형식(표·텍스트·이미지·코드)과 산출물이 둘 다 같을 때만이다. 하나라도 다르면 카드 없이 shape만 주거나 `shapes/unknown.md`로 간다.
4. 주는 것은 카드 원본이 아니라 Baseline·독립 검증·KPI·함정 절의 발췌(`CARD_REF.md`)다. 그 안의 숫자·상태명·컬럼명도 예시이며, 실제 값은 README와 데이터가 정한다.

## 카드 지도

| 카드 | 형태 | 가장 가까운 shape |
|---|---|---|
| S01 공정 이상 분석 | 분석 + 웹 | data_analysis_ml |
| S02 현장 지식 에이전트 | RAG + 승인 CRUD | rag_agent |
| S03 가상 계측 | 예측 결과 파일 | data_analysis_ml |
| S04 Fab 스케줄링 | 최적화 + 웹 | or_optimization |
| S05 데이터 의미 통합 | ETL + 질의 | etl_pipeline |
| S06 실험 설계 | 회귀 + 추천 | data_analysis_ml |
| S07 보전 일정·부품 | 최적화 + 역할 웹 | or_optimization |
| S08 OHT/AMR 배차 | 배정/VRP + 웹 | or_optimization |
| S09 테스트 저수율 | 분석 + 웹 | data_analysis_ml |
| S10 작업허가 승인 | 역할 CRUD 상태 머신 | web_fullstack |
| S11 웨이퍼맵·이미지 불량 분류 | 분류 결과 파일 | data_analysis_ml |
