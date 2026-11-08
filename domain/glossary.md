# 반도체 제조 용어집 (사람 학습 + 에이전트 참조)

> **대상: 사람(학습)과 에이전트(참조).** 각 용어는 "한 줄 정의 / 데이터에서 보이는 모습(컬럼 예)" 두 줄이다. 에이전트에게는 P1 데이터 계약(CONTRACT §4)을 채울 때 경로로 준다. 정의는 일반적인 업계 용법이며, 과제 README가 다르게 정의하면 README가 우선한다.

## 1. 전공정 (Front-end, Fab)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| Wafer | 반도체 회로가 새겨지는 원판 기판. 한 장에 수백~수천 개 칩이 들어간다 | `wafer_id`, Lot당 보통 25장, `slot_no` 1~25 |
| Die (칩) | Wafer 위 개별 칩 단위. 검사 후 양품/불량 판정의 최소 단위 | `die_x`, `die_y`, `die_count`, `good_die` |
| Lot | 함께 이동·처리되는 Wafer 묶음. 생산·추적의 기본 단위 | `lot_id`가 대부분 테이블의 조인 키 |
| Fab | 반도체 제조 공장(라인). 한 회사에 여러 Fab(M14, M16 등) | `fab_id`, `line_id` |
| Tool / Equipment (설비) | 공정을 수행하는 장비 한 대 | `tool_id`, `eqp_id`, `equipment_no` |
| Chamber | 설비 내부의 처리 단위. 한 Tool에 여러 Chamber가 있고 Chamber 간 편차가 흔하다 | `chamber_id`, `ch_no` (A/B/C) |
| Recipe | 공정 조건 설정값 묶음(온도·압력·시간·가스). 제품·Step마다 다르다 | `recipe_id`, 비교는 같은 Recipe끼리 |
| Step / Operation | 공정 흐름의 한 단계. Lot은 수백 Step을 순서대로 지난다 | `step_id`, `oper_no`, `step_seq` |
| Route / Flow | 제품별 Step 순서 정의 | `route_id`, `product_id` |
| 증착 (Deposition) | 막을 쌓는 공정(CVD, PVD, ALD) | 두께 `thickness`, 균일도 `uniformity` |
| 포토 (Photo, Lithography) | 감광막에 패턴을 노광 | 선폭 `cd`(critical dimension), 정렬 `overlay` |
| 식각 (Etch) | 패턴대로 막을 깎아냄 | 식각률 `etch_rate`, `rf_power`, `pressure` |
| 세정 (Clean) | 파티클·잔류물 제거 | 파티클 수 `particle_count` |
| 계측 (Metrology) | 공정 결과를 측정(두께·선폭·저항) | `measurement`, `target`, `lower_spec`, `upper_spec` |
| 검사 (Inspection) | 결함 유무·위치를 검출 | `defect_count`, `defect_code`, `defect_class` |
| MES | Manufacturing Execution System. Lot의 이동·이력·상태를 기록하는 실행 시스템 | lot_history 테이블의 출처 |
| FDC | Fault Detection and Classification. 설비 센서 데이터를 수집해 이상을 탐지 | tool_sensor 시계열, `trace_id`, 초 단위 |
| SPC | Statistical Process Control. 관리도(평균·범위)로 공정 산포를 감시 | `ucl`, `lcl`, `ooc_flag`(out of control) |
| APC | Advanced Process Control. 이전 결과로 다음 Recipe를 자동 보정 | `offset`, `feedback_value` |
| EAP | Equipment Automation Program. 설비와 MES를 연결하는 자동화 계층 | 설비 이벤트 로그 |
| SOP | Standard Operating Procedure. 표준 작업·조치 절차 문서 | `doc_id`, `step`, `precondition`, `warning` |
| OCAP | Out of Control Action Plan. SPC 이탈 시 조치 절차 | SOP의 한 종류 |

## 2. 후공정·테스트 (Back-end, Test)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| 후공정 (Back-end) | Wafer 완성 이후 조립·패키지·테스트 단계. SK하이닉스는 청주 후공정 라인에 AI 에이전트를 단계 도입 중 | `site=Cheongju`, `process_stage=ASSY/TEST` |
| Wafer Test / EDS / Probe | 패키지 전 Wafer 상태에서 Die마다 전기 검사. Probe card로 접촉 | `probe_card_id`, `tester_id`, Die별 `bin` |
| Package | Die를 기판·몰딩으로 감싼 완제품 형태. HBM은 Die를 수직 적층(TSV) | `package_id`, `stack_count` |
| Final Test (FT) | 패키지 완제품 전기·기능 검사 | `test_program`, `tester_id`, `handler_id`, `site_no` |
| Burn-in | 고온·고전압으로 초기 불량을 미리 걸러내는 스트레스 테스트 | `burn_in_hours`, `bi_board_id` |
| Bin | 테스트 결과 분류 코드. Bin 1이 양품, 나머지는 불량 유형 | `hard_bin`, `soft_bin`, `bin_code` |
| 저수율 (Low yield) | 특정 Lot·Tester·Program에서 양품률이 기준보다 낮은 상태 | `yield < threshold`, 기준은 제품별 |
| SSD Test | SSD 완제품의 기능·성능·신뢰성 검사. 그룹 해커톤 하이닉스 수상작 주제 | `fw_version`, `test_item`, `fail_code` |
| Tester / Handler | 테스트 장비와, 제품을 넣고 빼는 자동화 장비. 둘 다 편차 원인 | `tester_id`, `handler_id`, `site_no`(동시 테스트 위치) |

## 3. 설비 보전 (Maintenance)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| PM (Preventive Maintenance) | 주기·사용량 기준 예방 정비. 계획된 다운타임 | `pm_type`, `pm_cycle_days`, `pm_due_date`, `wafer_count_since_pm` |
| BM (Breakdown Maintenance) | 고장 후 수리. 비계획 다운타임 | `event_type=BM`, `fail_code`, `down_start`, `down_end` |
| CM (Corrective Maintenance) | 이상 징후 발견 후 교정 정비 | `event_type=CM` |
| PdM (Predictive) | 센서·이력 기반 고장 예측 정비. AX 핵심 영역 | 예측 점수 `risk_score` |
| MTBF | Mean Time Between Failures. 고장 간 평균 가동 시간 | BM 이벤트 간격 평균 |
| MTTR | Mean Time To Repair. 고장당 평균 수리 시간 | `down_end - down_start` 평균 |
| 시간가동률 (Availability, Uptime) | 전체 시간 중 설비가 고장 없이 쓸 수 있었던 비율. 실제로 일한 비율인 Utilization(가동률·활용률)과 구분 | `(total - downtime)/total`, Utilization은 `busy_time/available_time` |
| Work order | 정비 작업 지시서. 담당자·부품·소요시간·승인 | `wo_id`, `assigned_to`, `status`, `approved_by` |
| 부품 BOM / 예비품 (Spare parts) | 설비 구성 부품 목록과 교체용 재고. 재고 30% 감축이 공개된 목표 | `part_id`, `qty_on_hand`, `lead_time_days`, `reorder_point` |
| 정비 창 (Maintenance window) | 생산 영향이 적은 정비 가능 시간대 | `window_start`, `window_end` |

## 4. 물류·반송 (AMHS)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| AMHS | Automated Material Handling System. Fab 내 자동 반송 체계 전체 | transport_log의 출처 |
| OHT | Overhead Hoist Transport. 천장 레일로 FOUP(Wafer 운반 용기)을 나르는 차량 | `vehicle_id`, `from_port`, `to_port`, `travel_sec` |
| FOUP | Wafer 25장을 담는 밀폐 운반 용기 | `carrier_id` ≈ `lot_id` 1:1 |
| Stocker | Lot을 임시 보관하는 자동 창고 | `stocker_id`, `shelf_no`, `in_time`, `out_time` |
| AMR | Autonomous Mobile Robot. 바닥을 달리는 자율 반송 로봇. Physical AI 축 | `robot_id`, `battery`, `task_id` |
| 반송 (Transport) | Lot을 다음 설비로 옮기는 작업. 대기·이동 시간이 Cycle time에 포함 | `request_time`, `pickup_time`, `delivery_time` |
| 디스패칭 (Dispatching) | 설비 앞 대기 Lot 중 다음 처리 순서를 고르는 규칙 | FIFO(도착순), EDD(납기순), CR(Critical Ratio = 남은시간/남은작업시간), SPT(짧은 작업 먼저) |
| 병목 (Bottleneck) | 처리 능력이 가장 부족한 설비군. 전체 Throughput을 결정 | 가장 긴 대기열 `queue_length` |

## 5. 품질·생산 KPI (정의식은 kpi_formulas.md)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| Yield (수율) | 투입 대비 양품 비율. Wafer 수율과 Die 수율을 구분 | `good/total`, 분모 확인 필수 |
| Defect density | 단위 면적당 결함 수 | `defects / area_cm2` |
| Scrap | 폐기 처리된 Wafer/Lot | `scrap_flag`, `scrap_reason` |
| Rework | 재작업. 원래 흐름을 벗어나 다시 처리 | `rework_flag`, 같은 Step이 2번 나옴 |
| OEE | 설비종합효율. 가동률 × 성능 × 품질 | 세 요소를 따로 계산 후 곱 |
| WIP | Work In Process. 라인에 머무는 재공 Lot 수 | 시점별 `status in (WAIT, RUN)` 개수 |
| Cycle time | Lot 투입부터 완료까지 걸린 시간 | `end_at - start_at` |
| Throughput | 단위 시간당 완료 수량 | 일/시간당 완료 Lot 수 |
| Cp / Cpk | 공정능력지수. 규격 폭 대비 산포, Cpk는 중심 치우침 반영 | `usl`, `lsl`, 측정값 평균·표준편차 |
| Spec / Control limit | 규격 한계(고객 요구)와 관리 한계(통계적 ±3σ)는 다르다 | `usl/lsl` vs `ucl/lcl` |

## 6. 안전 (EHS)

| 용어 | 정의 | 데이터에서 |
|---|---|---|
| 작업허가 (PTW, Permit To Work) | 위험 작업 전 승인받는 절차. 신청 → 검토 → 승인 → 작업 → 종료 | `permit_id`, `status`, `requested_by`, `approved_by`, `valid_from/to` |
| 위험성평가 (Risk assessment) | 작업의 위험 요인·빈도·강도를 평가해 등급 부여 | `hazard`, `likelihood`, `severity`, `risk_level` |
| TBM (Tool Box Meeting) | 작업 전 짧은 안전 회의·점검 | `tbm_id`, `attendees`, `checklist` |
| LOTO (Lock Out Tag Out) | 정비 중 에너지원을 잠그고 표시해 오작동을 막는 절차 | `loto_applied`, `energy_source` |
| 고소작업 / 밀폐공간 | 대표적 고위험 작업 유형. VLM 드론·안전 감시 로봇이 거론되는 영역 | `work_type` |

## 7. AX·AI 용어 (SK하이닉스 공개 자료 기준)

| 용어 | 정의 | 데이터·과제에서 |
|---|---|---|
| 자율형 팹 (Autonomous Fab) | 2030년 목표. Operational AI(운영 판단), Physical AI(로봇·물류), Digital Twin(가상 공장) 3축 | 과제가 세 축 중 어디에 속하는지 분류 |
| Operational AI | 설비 유지보수·결함 분석 등 운영 판단 자동화. 처리시간 50% 이상 단축 발표 | S01, S07, S09 |
| Physical AI | OHT·AMR·비전 로봇. 부품 재고 약 30% 감축 기대 | S07, S08 |
| Digital Twin | 생산 흐름·물류·공정 조건을 가상에서 사전 검증(NVIDIA Omniverse 기반) | S04, S08의 what-if |
| Virtual Metrology (VM) | 센서값으로 계측하지 않은 Wafer의 품질을 추정. Gauss Labs와 공동 연구 | S03 |
| GaiA | SK하이닉스 사내 생성형 AI 플랫폼(2025.8). 첫 에이전트 4종 중 하나가 장비 보전 | S02, S07 |
| MADA | 연구소의 데이터 통합·이상 탐지·원인 분석·리포트 자동화 시스템 | S01 |
| SOP 기반 재설계 | AX Advance: 라인 이상 시 AI가 원인·대책 제안, 사람이 최종 판단 | S01, S02의 승인 흐름 |
| 제안 → 승인 → 실행 | SK AX 모델: AI는 제안, 현장 담당자가 승인·조정, 권한별 접근 제어와 감사 로그 | S02, S10의 상태 머신 |
| RAG | 문서 검색 후 근거와 함께 답변. 검색 누락과 환각은 별개의 실패 | S02, S05 |
| Allowlist tool | 에이전트가 호출할 수 있는 함수 목록을 서버가 제한 | `tool_name in allowlist` |

## 8. 10분 자가 점검

1. Wafer 수율 97%→92% 하락을 Tool 탓으로 단정하면 안 되는 이유 세 가지(제품 mix, Recipe, 시간)를 말할 수 있는가.
2. SPC 관리 한계와 Spec 규격 한계의 차이를 말할 수 있는가.
3. PM과 BM의 차이, MTBF와 MTTR의 분모를 말할 수 있는가.
4. 1:N 조인(Lot 1 : Wafer 25) 후 수량을 합치면 왜 25배가 되는지 설명할 수 있는가.
5. FIFO, EDD, CR 디스패칭 규칙을 한 줄씩 말할 수 있는가.
