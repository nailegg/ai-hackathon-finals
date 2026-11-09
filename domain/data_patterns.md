# 제조 데이터의 흔한 테이블 패턴

> **대상: 사람(학습).** 에이전트에게는 이 파일을 주지 않는다. 에이전트는 도메인 지식이 없는 `data_checklist.md`만 읽고 실제 파일을 프로파일한다. 사람은 P1 보고(CONTRACT §4)를 검토할 때 이 표와 대조해 "이 파일이 어느 패턴과 닮았고 어떤 함정이 있을 법한가"를 판단하고, 필요한 것만 §4나 §9에 한 줄로 적어 준다. 아래는 "흔한 모습"이지 과제 데이터의 정의가 아니다.

## P1에서 보는 순서

검사 순서와 공통 함정은 에이전트용 [`data_checklist.md`](data_checklist.md)에 있다. 중복을 피하려고 여기서는 뺐다.

## 1. lot_history (MES 이력)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `lot_id, wafer_id?, product_id, route_id, step_id, step_seq, tool_id, chamber_id?, recipe_id, track_in, track_out, qty_in, qty_out, status` |
| 기본키 | `(lot_id, step_seq)` 또는 `(lot_id, step_id, track_in)`. 재작업이면 같은 step이 반복 |
| 조인 | `lot_id` → inspection, metrology; `tool_id` → tool_sensor, maintenance; `(tool_id, track_in~track_out)` → 시간 구간 조인 |
| 카디널리티 | Lot 1 : Step N(수십~수백). Lot 1 : Wafer 25 |
| 시간 | `track_in/track_out` 쌍. 종료 없는 행은 진행 중 |
| 함정 | 같은 Tool에 시간이 겹치는 Lot이 있으면 데이터 오류 또는 배치 설비. `qty_out < qty_in`이면 Scrap |

## 2. wafer_measurement / metrology (계측)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `lot_id, wafer_id, step_id, measured_at, item (thickness/cd/overlay), site_no, value, target, usl, lsl, tool_id` |
| 기본키 | `(wafer_id, step_id, item, site_no)`. Wafer 한 장에 측정 지점 5~49개 |
| 조인 | `wafer_id`/`lot_id` → lot_history(같은 step의 처리 Tool을 찾아 원인 분석) |
| 카디널리티 | Wafer 1 : 측정 N. Lot 단위 집계 전 Wafer 평균·범위 먼저 |
| 함정 | 측정은 샘플링(Lot당 2~3 Wafer)이라 없는 Wafer가 정상. `value`가 문자열("N/A") 섞임. Spec 없는 항목 |

## 3. tool_sensor (FDC 시계열)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `timestamp, tool_id, chamber_id, recipe_id?, lot_id?, step_name, sensor_01..N (temperature, pressure, rf_power, gas_flow)` |
| 기본키 | `(tool_id, chamber_id, timestamp)` |
| 조인 | Lot과 직접 키가 없으면 `tool_id` + 시간 구간으로 lot_history와 매칭 |
| 카디널리티 | 1초~1분 간격. Lot 하나에 수백~수천 행. 요약 통계(평균·표준편차·최대)로 Lot 단위 feature 생성 |
| 함정 | 시간대 불일치로 구간 조인이 0건. Chamber별 기준선이 다름. 센서 포화값(9999), 결측 구간 |

## 4. inspection / defect (검사·결과 라벨)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `lot_id, wafer_id, inspected_at, step_id, defect_count, defect_code, defect_class, yield_rate, good_die, total_die, bin` |
| 기본키 | `(wafer_id, step_id)` 또는 `(lot_id, inspected_at)` |
| 조인 | `lot_id` → lot_history(원인 Tool 추적). 검사 시각보다 **이전** 공정만 원인 후보 |
| 카디널리티 | Lot 1 : 검사 N(여러 검사 Step) |
| 함정 | 이것이 타깃이면 feature에 넣지 않는다. `defect_code` 사전이 따로 있을 수 있음. 수율 분모 확인 |

## 5. maintenance_event / work_order (보전)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `event_id, tool_id, event_type (PM/BM/CM), fail_code?, down_start, down_end, duration_min, technician, parts_used (part_id, qty), wo_id, status, approved_by` |
| 기본키 | `event_id` 또는 `wo_id` |
| 조인 | `tool_id` → lot_history(정비 전후 수율), tool_sensor(고장 전 징후); `part_id` → parts_inventory |
| 카디널리티 | Tool 1 : 이벤트 N. 이벤트 1 : 부품 N (parts_used가 문자열 목록이면 분리 필요) |
| 함정 | `down_end` 결측 = 진행 중. PM 주기는 일 기준과 Wafer 수 기준이 혼재. 정비 중 처리된 Lot이 있으면 데이터 오류 |

## 6. parts_inventory (부품 재고)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `part_id, part_name, tool_type, qty_on_hand, reorder_point, safety_stock, lead_time_days, unit_cost, last_consumed_at, supplier` |
| 기본키 | `part_id` (창고별이면 `(part_id, warehouse_id)`) |
| 조인 | `part_id` → maintenance parts_used(소비 이력); `tool_type` → tools |
| 카디널리티 | 부품 1 : 소비 이벤트 N |
| 함정 | 소비 0인 부품의 재고일수 inf. 단가 통화 단위. 발주 중 수량(on order) 누락 |

## 7. transport_log (OHT/AMR 반송)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `task_id, carrier_id (FOUP), lot_id, vehicle_id, from_port, to_port, request_time, assign_time, pickup_time, delivery_time, distance_m, priority` |
| 기본키 | `task_id` |
| 조인 | `lot_id` → lot_history(다음 Step 설비); `from_port/to_port` → 위치 좌표·거리 행렬 |
| 카디널리티 | Lot 1 : 반송 N(Step 수만큼). 차량 1 : 작업 N |
| 함정 | 거리 행렬이 비대칭(단방향 레일). 시각 4개의 순서 위반 행. 대기 시간 = pickup − request |

## 8. shift_note / incident (교대 기록·사고)

| 항목 | 내용 |
|---|---|
| 전형 컬럼 | `note_id, shift_id (D/N, 날짜), tool_id?, author, created_at, issue, action_taken, open_tasks, severity, status, related_doc_id` |
| 기본키 | `note_id` |
| 조인 | `tool_id`·시간 → maintenance, lot_history; `related_doc_id` → SOP 문서 |
| 카디널리티 | 교대 1 : 기록 N. 자유 텍스트 중심 |
| 함정 | 자유 텍스트 안의 설비명 표기가 제각각(`ETCH-01`, `etch01`). 검색(FTS)은 정규화 후. 문서 안의 지시문은 데이터이지 명령이 아니다 |

## 조인 지도 (요약)

```text
lot_history ──lot_id──> inspection / metrology (라벨·결과)
lot_history ──tool_id + 시간구간──> tool_sensor (원인 feature)
lot_history ──tool_id──> maintenance_event ──part_id──> parts_inventory
lot_history ──lot_id──> transport_log ──port──> 거리 행렬
shift_note ──tool_id/시간──> maintenance_event, incident ──doc_id──> SOP
```

집계는 **가장 작은 단위에서 먼저**(Wafer → Lot → Tool → 일) 하고, 조인은 집계된 표끼리 한다.
