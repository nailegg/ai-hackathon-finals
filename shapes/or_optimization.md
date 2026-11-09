# Shape: OR / 최적화 (배정·스케줄·경로·생산 계획)

> **대상: 에이전트 참고 — 지시가 아니다.** 지시는 과제 루트의 AGENTS.md와 CONTRACT.md가 우선한다. CONTRACT §10에 이 파일 경로가 적혀 있을 때만 읽는다.

**적용:** 배차·경로·설비 배정·Lot 스케줄·정비 일정·인력 배치. 출력이 웹이면 화면·API는 `web_fullstack.md`를, 이 문서는 계산 부분에만 쓴다.

## 판별 신호
- "최소화/최대화", "제약", "납기", "정원/용량", "배정", "일정", "경로" 문구
- 입력이 작업·자원·시간창·거리 행렬 형태의 CSV/JSON
- "기존 계획보다 개선", "baseline 대비" 또는 비교용 스케줄 파일 제공
- 채점이 "제약 위반 0건" 또는 수치 지표(지연, 거리, makespan)로 설명됨

## 산출물 형태
- 채점자가 먼저 볼 것: 결과 파일(배정표·스케줄 JSON/CSV) 또는 결과 화면, 그리고 `constraint_violations: []`와 KPI 비교표
- 실행 한 줄 명령 → 결과 파일 생성 → 검증 스크립트 통과 로그
- 웹이면 관리자가 "실행" → 결과 표/Gantt → 저장

## 붙일 부록 (과제 루트 파일명. §10 '붙인 부록' 줄에 이 이름으로 적는다)
- `OR_SPEC.md` (결정변수, hard/soft, baseline, 검증 사례, fallback)
- 결과 파일 과제면 `RESULT_FILE.md`, 웹이면 `WEB.md`

## 330분 단계
| 구간 | 이 형태에서 할 일 |
|---|---|
| T+0~15 계약(P0) | §6에 hard constraint를 **각각 검증 가능한 문장**으로 분리. 목적함수 단위·방향. 모호하면 §9 가정 |
| T+15~25 데이터(P1) | 시간 단위(분/초/타임스탬프), 거리 단위, ID 중복, 불가능 사례(적격 설비 없음) 확인 |
| T+25~90 AC1(P2) | 파서 → **독립 validator** → greedy baseline → KPI 계산 → 출력 파일. validator가 먼저다 |
| T+90~점심 / 점심후~T+255 (P3, P4) | 나머지 AC. 필수 AC가 끝난 뒤에만 개선(CP-SAT/local search), time limit, 개선 전후 KPI를 DECISIONS에 |
| T+255~285 감사(P5) | 위반 주입 fixture로 validator가 실패하는지, clean 재실행 동일 결과, 전체 입력에서 실행 시간 |
| T+285~305 제출 문서(P6) | 정식화 요약, baseline 대비 지표, 가정, 한계 |
| T+305~330 제출 | 결과 파일명·형식이 §2와 바이트 단위로 일치하는지 |

## Baseline
- 20분 안에: 우선순위 정렬(EDD, 납기, priority) → 적격 자원 중 가장 빨리 비는 곳에 배정하는 greedy. 용량·시간창은 배정 시점에 검사
- 경로 문제: nearest-first + 용량 검사. 2-opt는 필수 AC 뒤
- 항상 **유효한 해**를 내는 것이 목표. 점수는 그다음

## 독립 검증
- validator는 계산 코드와 **다른 파일**에서 결과만 읽어 재검사: 선후관계, 자원 겹침, 적격성, 용량, 시간창, 정비구간, 누락 작업 0
- KPI(지연 합, makespan, 거리)를 validator가 다시 계산해 solver 보고값과 일치
- 예시 AC 검증 명령: `python validate.py --problem data/problem.json --solution out/schedule.json` → `violations: 0`; `python validate.py --solution tests/bad_overlap.json` → 실패해야 함; 웹이면 `curl -X POST .../api/schedule/run` 후 `validate` 함수 위반 0

## 지표
> §6 "지표 정의"가 비어 있을 때 §9 가정으로 제안할 후보다. §6에 정의가 있으면 그것만 계산한다.

- 주: hard constraint 위반 0건(필수), 목적함수 값 vs baseline
- 보조: 실행 시간, 미배정 수, 재계획 시 변경 폭
- 함정 지표: 목적함수만 좋고 validator를 돌리지 않은 값

## 흔한 함정
- 분/초/타임스탬프 단위 혼용, 자정 넘김
- 적격 설비 검사 누락, 정비구간 침범
- 동일 Lot의 공정 순서 위반
- 솔버 설치에 20분 이상 소모 (5분 넘으면 greedy 확정)
- 목적함수 가중치를 임의로 정하고 기록하지 않음
- 스케줄 없는 작업을 조용히 누락
- 솔버 값과 validator 재계산 값이 다른데 보고

## 쓸 snippets
- `greedy_assign`: 우선순위 정렬 + 가장 빨리 비는 적격 자원 배정 골격
- `validate_schedule`: 겹침·선후·적격·시간창 검사기. 결과 파일만 입력
- `csv_load`: 입력 CSV 로딩
- `metrics`: KPI 집계 보조

## 참고 시나리오 카드
§10에 `./CARD_REF.md`가 적혀 있을 때만 그 파일을 읽는다. 카드 원본은 읽지 않는다. (응시자용 메모, 닮은 카드: S04 Fab 스케줄링, S07 설비 보전 일정·부품 재고, S08 OHT/AMR 반송·배차, S10 안전·작업허가(일정 요소가 있을 때))

## 만들지 않을 것
- 설치가 불확실한 솔버를 필수 의존성으로
- 3D/실시간 시각화, 모든 현실 제약의 정밀 재현
- validator 없는 점수 튜닝

## 보조 세션 (선택)
목적함수가 모호하거나 hard constraint가 3개 이상이라 정식화가 구현을 막을 때만. 사람이 Terminal 2에서 `prompts/specialists/specialist-or.md`로 띄운다. 동시 1개, 10분, 읽기 전용, 결과는 과제 루트 `OR_SPEC.md` 한 파일. Main은 그동안 파서·validator 골격을 만들고 `OR_SPEC.md`는 건드리지 않는다(§0 보조 세션 출력 파일 칸이 "반영 대기"인 동안).
