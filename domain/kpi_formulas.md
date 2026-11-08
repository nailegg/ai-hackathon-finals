# KPI 정의식과 계산 함정

> **대상: 사람(학습)과 에이전트(참조).** CONTRACT §6 핵심 계산의 지표를 정할 때와 §7 AC의 기대 결과를 쓸 때 본다. 과제 README가 지표를 정의하면 README가 우선하고, 다르게 계산했다면 §9 가정에 적는다.

## 공통 함정 (모든 KPI)

| 함정 | 증상 | 예방 |
|---|---|---|
| 1:N 조인 후 합계 | Lot(1) : Wafer(25) 조인 뒤 Lot 수량 합이 25배 | 조인 전후 행 수를 출력, 집계 단위에서 먼저 집계한 뒤 조인 |
| 분모 0 | 투입 0인 Tool·Shift에서 NaN/inf | 분모 0은 `None`으로 두고 표에 "집계 불가" 표시 |
| Recipe/제품 mix | Tool A 수율이 낮은데 사실 어려운 제품만 처리 | 같은 Recipe·제품끼리 비교(층화), 표본 수 함께 표시 |
| 시간대·단위 | UTC/KST 9시간 차, 초/밀리초, 분/시간 혼용 | 로드 직후 하나의 단위·시간대로 변환하고 §4에 기록 |
| 미래 정보 누수 | 예측 시점 이후 검사 결과가 feature에 포함 | `time_split`, 예측 시점 이전 데이터만 사용 |
| 중복 행 | 같은 `(lot_id, step_id)`가 재작업으로 2번 | 기본키 유일성 검사, 재작업은 `rework_flag`로 분리 |

## 1. 품질

| KPI | 정의식 | 집계 단위 | 함정 | 코드 힌트 |
|---|---|---|---|---|
| Wafer yield | 양품 Wafer 수 / 투입 Wafer 수 | Lot, Tool, 일 | Scrap을 분모에서 빼면 과대평가 | `good_wafers / total_wafers` |
| Die yield | 양품 Die 수 / 전체 Die 수 | Wafer, Lot | Wafer별 Die 수가 다르면 단순 평균 금지, Die 수로 가중 | `good_die.sum() / total_die.sum()` |
| Bin ratio | 해당 Bin 수 / 테스트 수 | Lot, Tester, Program | Soft bin과 Hard bin 혼용 | `groupby(['lot_id','hard_bin']).size() / n` |
| Scrap rate | 폐기 Wafer 수 / 투입 Wafer 수 | Lot, Step | 사유 코드 결측 | `scrap_flag.mean()` |
| Rework rate | 재작업 건수 / 처리 건수 | Step, Tool | 재작업을 처리 건수에 중복 계산 | 원 처리와 재작업을 구분한 뒤 비율 |
| Defect density | 결함 수 / 면적(cm²) | Wafer | 면적 단위 mm² vs cm² | `defects / area_cm2` |
| Cp | (USL − LSL) / (6σ) | 측정 항목 | Spec 없는 항목에 계산 | `(usl-lsl)/(6*std)` |
| Cpk | min(USL − μ, μ − LSL) / (3σ) | 측정 항목 | σ가 0이면 inf | `min(usl-mean, mean-lsl)/(3*std)` |

## 2. 설비

| KPI | 정의식 | 집계 단위 | 함정 | 코드 힌트 |
|---|---|---|---|---|
| Availability (가동률) | (총 시간 − 다운타임) / 총 시간 | Tool, 일/주 | PM(계획)과 BM(비계획)을 합산할지 README 확인 | `1 - downtime_h / total_h` |
| Performance (성능) | 실제 처리량 / 이론 처리량 | Tool | 이론 처리량(Recipe별 시간)이 없으면 계산 불가, §9 가정 | `actual_units / (run_h * ideal_rate)` |
| Quality (품질) | 양품 수 / 처리 수 | Tool | 수율과 같은 분모 문제 | |
| OEE | Availability × Performance × Quality | Tool | 세 값을 각각 보고, 곱만 보여주지 않는다 | `a*p*q` |
| MTBF | 가동 시간 합 / 고장(BM) 횟수 | Tool | 고장 0회면 분모 0 | `uptime_h / n_failures` |
| MTTR | 수리 시간 합 / 고장 횟수 | Tool | 수리 중 대기(부품 입고 대기) 포함 여부 | `repair_h.sum() / n_failures` |
| PM 준수율 | 기한 내 수행 PM 수 / 예정 PM 수 | Tool, 월 | 기한 정의(일 기준·Wafer 수 기준) | `(done_at <= due).mean()` |
| 부품 재고 지표 | 재고일수 = 재고량 / 일평균 소비량, 결품률 = 결품 건수 / 요청 건수 | 부품 | 소비 0인 부품은 재고일수 inf | |

## 3. 생산·흐름

| KPI | 정의식 | 집계 단위 | 함정 | 코드 힌트 |
|---|---|---|---|---|
| WIP | 시점 t에 라인에 있는 Lot 수 | 시점, Step | 시점별 스냅샷. 기간 합계가 아니다 | `((start<=t)&(end>t)).sum()` |
| Cycle time | 완료 시각 − 투입 시각 | Lot | 재작업 Lot은 꼬리가 길다. 중앙값도 함께 | `(end_at - start_at)` |
| Throughput | 기간 내 완료 Lot(또는 Wafer) 수 / 기간 | 일, 주 | 완료 기준(마지막 Step 종료)을 명시 | `completed.groupby(date).size()` |
| Queue time | 설비 앞 대기 시간 = 처리 시작 − 도착 | Step, Tool | 반송 시간 포함 여부 | |
| Utilization | 처리 시간 합 / 가용 시간 | Tool | 가동률과 혼동. 가동률은 "고장 안 남", 가동률은 "실제 일함" | |

## 4. 스케줄링·최적화

| KPI | 정의식 | 함정 | 코드 힌트 |
|---|---|---|---|
| Tardiness (지연) | max(0, 완료 − 납기) | 조기 완료는 0, 음수 아님 | `max(0, end - due)` |
| Total / Weighted tardiness | Σ 지연, Σ 우선순위 × 지연 | 가중치 단위 명시 | `sum(w * max(0, end-due))` |
| Number of tardy jobs | 지연 > 0인 작업 수 | | |
| Makespan | 마지막 작업 완료 시각 − 시작 기준 시각 | 시작 기준(0 또는 첫 release) | `max(end) - t0` |
| Flow time | 완료 − 투입(release) | Cycle time과 동일 개념 | |
| 총 이동 거리·시간 (VRP) | Σ 구간 거리 | 왕복·복귀 포함 여부 | |
| 제약 위반 수 | hard constraint 위반 건수. **0이어야 유효해** | 점수보다 먼저 확인 | `validate_schedule` |
| 개선율 | (baseline − 결과) / baseline | 분모 0, 방향(최소화/최대화) | |

## 5. 예측·분류 (불균형 데이터 기준)

| 지표 | 정의 | 언제 | 함정 |
|---|---|---|---|
| 혼동행렬 | TP/FP/FN/TN 표 | 항상 먼저 | Accuracy만 보고하면 불량률 0.5%에서 99.5%가 나온다 |
| Precision | TP / (TP+FP) | 경보당 적중률 | |
| Recall | TP / (TP+FN) | 불량을 놓치지 않기 | |
| F1 | 2PR/(P+R) | 둘의 균형 | 임계값에 따라 바뀜, 임계값 명시 |
| PR-AUC | Precision-Recall 곡선 아래 면적 | 희소 양성 | ROC-AUC는 불균형에서 낙관적 |
| Recall@K | 점수 상위 K건 중 실제 양성 비율 | 점검 인력이 K건만 볼 때 | K를 업무 기준으로 정해 §9에 |
| Lead time | 이상 탐지 시각 − 실제 불량 발생 시각 | 조기 탐지 | 음수면 사후 탐지 |

## 6. 회귀·계측 예측

| 지표 | 정의 | 함정 |
|---|---|---|
| MAE | mean(\|y − ŷ\|) | 단위가 y와 같아 설명하기 좋다 |
| RMSE | sqrt(mean((y − ŷ)²)) | 큰 오차에 민감 |
| MAPE | mean(\|y − ŷ\| / \|y\|) | y=0 근처에서 폭발, 계측값이 0 근처면 금지 |
| Spec 이탈 예측 | ŷ가 USL/LSL 밖인 비율 vs 실제 | 회귀 결과를 분류로 번역할 때 |
| Baseline | 평균, 중앙값, 직전값, 같은 Recipe 평균 | 모델이 baseline을 못 이기면 보고에 그대로 적는다 |

## 7. 이상 탐지

| 방법 | 정의 | 함정 |
|---|---|---|
| Z-score | (x − μ) / σ | 이상값이 μ·σ 자체를 오염 |
| Robust z-score | (x − median) / (1.4826 × MAD) | MAD=0이면 분모 0. `group_compare` 사용 |
| Rolling / EWMA | 이동 평균·지수 가중 평균 대비 편차 | 창 길이, 초기 구간 |
| 그룹 기준선 | Tool·Chamber·Recipe별 기준선과 비교 | 전체 평균 하나로 비교하면 mix 효과 |
| 효과 크기 | (이상군 평균 − 정상군 평균) / 합동 표준편차 | 표본 수 5 미만은 표시만 하고 결론 보류 |
