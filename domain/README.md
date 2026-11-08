# domain/ 사용법

> 반도체 도메인 지식 층. 기존 playbook은 도메인 중립이었고, 본선은 "반도체 현장의 고민을 AI로 해결"이 명시돼 있어 이 층을 추가했다. 모든 내용은 공개 자료 기반 일반 지식이며, 과제 README가 다르게 정의하면 README가 우선한다.

| 파일 | 대상 | 사람이 읽는 때 | 에이전트에게 경로를 주는 때 |
|---|---|---|---|
| `glossary.md` | 사람·에이전트 | 11/9~10 학습(60분), 시험 중 모르는 용어가 나올 때 | P1 데이터 계약 작성 시 컬럼 의미 해석용 |
| `kpi_formulas.md` | 사람·에이전트 | 학습(40분) | CONTRACT §6 지표 정의, §7 AC 기대 결과를 쓸 때 |
| `data_patterns.md` | 에이전트 중심 | 학습(30분) | P1 프롬프트에서 항상 함께 지정 |
| `scenarios/S01~S10.md` | 사람 → 에이전트 | 학습 시 전부 훑고, 시험 중 README와 가장 닮은 1장 선택 | §10 참고 문서로 **1장만** 경로 지정 |

## 카드 선택 규칙

1. P0 계약 요약을 읽고 가장 닮은 카드 1장을 고른다. 둘 이상 닮으면 산출물 형태가 같은 쪽.
2. 카드의 Baseline·독립 검증·함정만 쓰고, 예상 데이터 스키마는 실제 파일로 대체한다. 카드 스키마를 과제 요구사항으로 착각하지 않는다.
3. 어느 카드와도 안 닮으면 카드를 주지 않고 `shapes/unknown.md`로 간다.

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
