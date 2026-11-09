# 반도체 제조 용어집 — 공장이 어떻게 돌아가는지부터

> **대상: 사람(학습)이 먼저, 에이전트(참조)는 나중.** 절마다 "이 일이 무엇인지" 짧은 설명을 먼저 두고, 그다음 용어 표를 둔다. 표의 세 번째 열은 그 용어가 데이터 파일에서 어떤 컬럼으로 보이는지다. 에이전트에게는 기본으로 주지 않고, 용어가 막힐 때만 `CONTRACT.md` §10에 경로를 적어 준다. 정의는 일반적인 업계 용법이며, 과제 README가 다르게 정의하면 README가 우선한다.

---

## 큰 그림: 반도체 공장은 이렇게 돌아간다

**만드는 것.** 반도체 칩은 지름 300mm짜리 둥근 실리콘 원판(**Wafer**) 위에 아주 작은 회로를 수백 층 쌓아 만든다. 한 장의 Wafer 위에 똑같은 칩(**Die**)이 수백~수천 개 바둑판처럼 찍히고, 마지막에 잘라서 하나씩 포장하면 우리가 아는 메모리 칩이 된다.

**어떻게 만드나.** 회로 한 층을 만드는 일은 대략 "막을 입힌다(증착) → 빛으로 패턴을 그린다(포토) → 패턴대로 깎는다(식각) → 씻는다(세정) → 잘 됐는지 잰다(계측·검사)"의 반복이다. 이 한 바퀴가 한 층이고, 메모리 칩은 이런 층을 수십 번 쌓는다. 그래서 Wafer 한 장은 **수백 개의 공정 단계(Step)**를 순서대로 지나고, 전체가 끝나는 데 두세 달이 걸린다.

**어떤 단위로 움직이나.** Wafer는 한 장씩 다니지 않는다. 25장을 한 통(**FOUP**)에 담아 한 묶음(**Lot**)으로 움직인다. 전공정 공장 건물 하나를 **Fab**이라 부른다(M14, M16처럼 이름이 붙는다). Fab은 증착·포토·식각·세정·계측 장비를 전부 자기 안에 한 세트씩 갖추고 있어서, Lot은 전공정 내내 **한 Fab 안에서만** 돈다. 큰 Fab은 층·구역으로 나뉘고, 한 제품 흐름을 처음부터 끝까지 처리할 수 있는 장비 묶음 하나를 **라인**이라 부른다(현장에서는 Fab 자체를 "M14 라인"처럼 부르기도 한다). 라인 안에는 같은 일을 하는 장비(**Tool**)가 수십 대씩 있고, Lot은 천장 레일을 달리는 운반차(**OHT**)를 타고 다음 장비로 간다. 정리하면 **Fab(건물) ⊃ 라인(생산 흐름 한 벌) ⊃ Tool(장비 한 대) ⊃ Chamber(장비 안의 방)** 순서다. 어느 Lot이 지금 어느 Step에 있고 어느 장비를 지났는지는 **MES**라는 시스템이 전부 기록한다. 그래서 데이터 파일의 거의 모든 표는 `lot_id`로 이어진다.

**무엇이 문제가 되나.** 공장의 관심사는 네 가지로 압축된다.

| 관심사 | 질문 | 이 용어집에서 |
|---|---|---|
| 품질(수율) | 만든 칩 중 몇 %가 양품인가, 왜 떨어졌나 | 1절 계측·검사·SPC, 2절 테스트·Bin, 5절 KPI |
| 설비 | 장비가 고장 없이 돌아가나, 언제 정비하나, 부품은 있나 | 3절 보전 |
| 흐름 | Lot이 어디서 막히나, 어느 순서로 처리하나, 언제 끝나나 | 4절 반송·디스패칭, 5절 WIP·Cycle time |
| 안전 | 위험한 작업을 허가·통제하고 있나 | 6절 |

해커톤 과제는 이 네 관심사 중 하나를 **데이터와 웹·최적화·예측**으로 다루게 한다. 7절의 AX 용어는 SK하이닉스가 이 네 관심사에 AI를 어떻게 붙이겠다고 공개했는지다.

**앞뒤 공정의 구분.** Wafer 위에 회로를 다 만들 때까지를 **전공정(Front-end)**, 그 뒤 Wafer를 검사하고 자르고 포장하고 완제품을 테스트하는 것을 **후공정(Back-end)**이라고 부른다. 전공정은 Fab에서, 후공정은 별도 라인(SK하이닉스는 청주 등)에서 한다.

---

## 1. 전공정 (Front-end, Fab)

**이 일이 무엇인가.** Wafer 위에 회로를 쌓는 단계다. 한 층마다 증착 → 포토 → 식각 → 세정을 반복하고, 중간중간 계측(두께·선폭을 잰다)과 검사(결함을 찾는다)를 끼워 넣어 잘못되면 바로 잡는다. 장비마다 수백 개의 센서가 온도·압력·가스 유량을 초 단위로 기록하고(FDC), 측정값이 통계적 범위를 벗어나면 경보가 뜬다(SPC). 같은 종류의 장비라도 대수가 많고 장비 안에도 방(Chamber)이 여럿이라, "어느 장비의 어느 방을 지난 Lot이 나빴나"를 찾는 것이 품질 분석의 기본이다.

**데이터에서 자주 하는 실수.** 같은 장비라도 처리하는 제품·Recipe가 다르면 결과가 다르다. 그래서 장비끼리 비교할 때는 같은 Recipe끼리 묶어서 봐야 한다. 또 Lot 한 줄과 Wafer 25줄을 조인하면 Lot 수량이 25배로 부풀어 보인다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| Wafer | 회로를 새기는 둥근 원판. 한 장에 칩 수백~수천 개 | `wafer_id`, Lot당 보통 25장, `slot_no` 1~25 |
| Die (칩) | Wafer 위의 칩 하나. 양품/불량을 판정하는 최소 단위 | `die_x`, `die_y`, `die_count`, `good_die` |
| Lot | 함께 움직이는 Wafer 25장 묶음. 생산·추적의 기본 단위 | `lot_id`가 대부분 표의 조인 키 |
| Fab | 전공정 공장 **건물** 하나. 장비 전 세트를 자기 안에 갖추며, Lot은 한 Fab을 벗어나지 않는다. Fab마다 장비 세대·제품이 달라 Fab 간 수율 비교는 의미가 없다 | `fab_id`. 값이 하나면 무시, 둘 이상이면 비교는 같은 Fab 안에서만 |
| Line (라인) | Fab 안에서 한 제품 흐름을 끝까지 처리할 수 있는 장비 묶음. Fab 아래 중첩되며, 현장에서는 Fab과 같은 뜻으로도 쓴다 | `line_id`. 같은 값이 다른 Fab에 또 나올 수 있어 조인 키는 `(fab_id, line_id)` |
| Tool / Equipment (설비) | 공정을 수행하는 장비 한 대. 한 라인에 같은 종류가 수십 대 | `tool_id`, `eqp_id`, `equipment_no` |
| Chamber | 장비 안의 처리 방. 한 장비에 여러 방이 있고 방끼리 미세하게 다르다 | `chamber_id`, `ch_no` (A/B/C) |
| Recipe | 장비에 설정하는 조건 묶음(온도·압력·시간·가스). 제품·Step마다 다르다 | `recipe_id`. 비교는 같은 Recipe끼리 |
| Step / Operation | 공정 흐름의 한 칸. Lot은 수백 Step을 순서대로 지난다 | `step_id`, `oper_no`, `step_seq` |
| Route / Flow | 제품별로 정해진 Step의 순서표 | `route_id`, `product_id` |
| 증착 (Deposition) | 막을 한 겹 입히는 공정(CVD, PVD, ALD) | 두께 `thickness`, 균일도 `uniformity` |
| 포토 (Photo, Lithography) | 빛으로 회로 패턴을 그리는 공정. 가장 비싸고 정밀하다 | 선폭 `cd`, 층간 정렬 `overlay` |
| 식각 (Etch) | 그린 패턴대로 막을 깎아내는 공정 | 식각률 `etch_rate`, `rf_power`, `pressure` |
| 세정 (Clean) | 먼지(파티클)와 찌꺼기를 씻어내는 공정 | 파티클 수 `particle_count` |
| 계측 (Metrology) | 공정이 잘 됐는지 숫자로 재는 것(두께·선폭·저항). 전부 재지 않고 일부만 샘플링 | `measurement`, `target`, `lower_spec`, `upper_spec` |
| 검사 (Inspection) | 결함이 있는지, 어디 있는지 찾는 것 | `defect_count`, `defect_code`, `defect_class` |
| MES | 공장 실행 시스템. Lot이 언제 어느 Step·장비를 지났는지 전부 기록 | `lot_history` 표의 출처 |
| FDC | 장비 센서 데이터를 모아 이상을 찾는 시스템 | `tool_sensor` 시계열, `trace_id`, 초 단위 |
| SPC | 측정값을 관리도에 찍어 통계적 범위(±3σ)를 벗어나면 경보 | `ucl`, `lcl`, `ooc_flag`(out of control) |
| APC | 이전 결과를 보고 다음 Recipe를 자동으로 조금씩 보정 | `offset`, `feedback_value` |
| EAP | 장비와 MES를 연결하는 자동화 소프트웨어 층 | 장비 이벤트 로그 |
| SOP | 표준 작업 절차서. "이럴 때 이렇게 하라"를 적은 문서 | `doc_id`, `step`, `precondition`, `warning` |
| OCAP | SPC 경보가 떴을 때 따르는 조치 절차. SOP의 한 종류 | |

---

## 2. 후공정·테스트 (Back-end, Test)

**이 일이 무엇인가.** 전공정이 끝난 Wafer는 먼저 Die마다 전기 검사를 받는다(Wafer Test). 여기서 불량 Die는 표시해 두고, Wafer를 잘라 양품 Die만 기판에 붙이고 포장한다(Package). 포장된 완제품은 다시 전기·기능 검사(Final Test)를 받고, 일부는 고온·고전압으로 일부러 스트레스를 줘 초기 불량을 미리 걸러낸다(Burn-in). 검사 결과는 숫자 코드(Bin)로 분류되는데, Bin 1이 양품이고 나머지 번호가 불량 유형이다.

**왜 과제로 나올 수 있나.** 테스트 장비(Tester)와 제품을 넣고 빼는 장비(Handler)가 많고, 같은 제품인데 특정 장비·프로그램·위치에서만 수율이 낮은 일이 생긴다. "어느 Lot·Tester·Program 조합에서 저수율이 나는지 자동으로 찾아라"가 전형적인 분석 과제다. SK하이닉스는 청주 후공정 라인에 AI 에이전트를 도입 중이고, 그룹 해커톤 수상작도 SSD 테스트 저수율 분석이었다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| 후공정 (Back-end) | Wafer 완성 이후 검사·절단·포장·완제품 테스트 단계 | `site=Cheongju`, `process_stage=ASSY/TEST` |
| Wafer Test / EDS / Probe | 자르기 전 Wafer 상태에서 Die마다 바늘(Probe card)을 대고 전기 검사 | `probe_card_id`, `tester_id`, Die별 `bin` |
| Package | Die를 기판에 붙이고 감싼 완제품 형태. HBM은 Die를 수직으로 쌓는다(TSV) | `package_id`, `stack_count` |
| Final Test (FT) | 포장된 완제품의 전기·기능 검사 | `test_program`, `tester_id`, `handler_id`, `site_no` |
| Burn-in | 고온·고전압 스트레스로 초기 불량을 미리 터뜨려 걸러내는 검사 | `burn_in_hours`, `bi_board_id` |
| Bin | 테스트 결과 분류 번호. Bin 1 양품, 나머지는 불량 유형. Hard bin(큰 분류)과 Soft bin(세부 분류)이 있다 | `hard_bin`, `soft_bin`, `bin_code` |
| 저수율 (Low yield) | 특정 Lot·Tester·Program에서 양품률이 기준보다 낮은 상태 | `yield < threshold`, 기준은 제품별 |
| SSD Test | SSD 완제품의 기능·성능·신뢰성 검사 | `fw_version`, `test_item`, `fail_code` |
| Tester / Handler | 검사 장비와, 제품을 넣고 빼는 자동화 장비. 둘 다 편차의 원인이 된다 | `tester_id`, `handler_id`, `site_no`(동시에 검사하는 자리 번호) |

---

## 3. 설비 보전 (Maintenance)

**이 일이 무엇인가.** 장비는 쓰면 닳고, 닳으면 품질이 흔들리다 멈춘다. 그래서 고장 나기 전에 주기적으로 부품을 갈고 청소한다(PM, 예방 정비). 그래도 고장이 나면 수리한다(BM, 고장 정비). 정비에는 사람(기술자)과 부품과 시간이 들고, 정비하는 동안 장비는 생산을 못 하므로 **언제, 누가, 어느 장비를, 어떤 부품으로** 정비할지 계획하는 것이 보전 업무의 핵심이다. 부품은 미리 사 두면 돈이 묶이고 없으면 수리가 늦어지므로 재고 관리도 함께 간다.

**어떤 숫자로 평가하나.** 고장이 얼마나 드문가(MTBF: 고장과 고장 사이 평균 가동 시간), 고장 나면 얼마나 빨리 고치나(MTTR: 평균 수리 시간), 전체 시간 중 쓸 수 있었던 비율(Availability). PM을 기한 안에 했는지(PM 준수율)도 본다.

**왜 과제로 나올 수 있나.** 예선 두 번이 모두 "역할이 있는 웹 + 배정 최적화"였고, PM 일정 짜기는 정확히 그 형태다(정비 작업을 기술자·시간대·부품에 배정). SK하이닉스는 설비 보전을 Operational AI의 첫 적용 분야로, 부품 재고 30% 감축을 Physical AI의 목표로 공개했다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| PM (Preventive Maintenance) | 고장 나기 전에 주기적으로 하는 예방 정비. 계획된 다운타임 | `pm_type`, `pm_cycle_days`, `pm_due_date`, `wafer_count_since_pm` |
| BM (Breakdown Maintenance) | 고장 난 뒤 하는 수리. 계획에 없던 다운타임 | `event_type=BM`, `fail_code`, `down_start`, `down_end` |
| CM (Corrective Maintenance) | 이상 징후를 보고 고장 전에 손보는 정비 | `event_type=CM` |
| PdM (Predictive) | 센서·이력으로 고장을 예측해 미리 하는 정비. AX의 핵심 영역 | 예측 점수 `risk_score` |
| MTBF | 고장과 고장 사이의 평균 가동 시간. 클수록 좋다 | BM 이벤트 간격의 평균 |
| MTTR | 고장 한 번당 평균 수리 시간. 작을수록 좋다 | `down_end - down_start`의 평균 |
| 시간가동률 (Availability) | 전체 시간 중 장비를 쓸 수 있었던 비율. "실제로 일한 비율"인 Utilization과 다르다 | `(total - downtime)/total`. Utilization은 `busy_time/available_time` |
| Work order | 정비 작업 지시서. 누가, 어느 장비를, 어떤 부품으로, 언제 | `wo_id`, `assigned_to`, `status`, `approved_by` |
| 부품 BOM / 예비품 (Spare parts) | 장비를 이루는 부품 목록과 교체용 재고 | `part_id`, `qty_on_hand`, `lead_time_days`, `reorder_point` |
| 정비 창 (Maintenance window) | 생산에 피해가 적은 정비 가능 시간대 | `window_start`, `window_end` |

---

## 4. 물류·반송 (AMHS)

**이 일이 무엇인가.** Fab 안에서 Lot은 사람이 들고 다니지 않는다. 천장 레일을 달리는 운반차(OHT)가 Wafer 통(FOUP)을 집어 다음 장비로 나르고, 바로 처리할 수 없으면 자동 창고(Stocker)에 잠시 넣어 둔다. 이 전체 자동 운반 체계를 AMHS라고 한다. 장비 앞에는 여러 Lot이 줄을 서는데, 그중 어느 것을 먼저 처리할지 고르는 규칙이 **디스패칭**이다. 어느 운반차가 어느 요청을 맡을지 정하는 것이 **배차**다.

**왜 과제로 나올 수 있나.** "요청 목록과 차량 목록이 있을 때 총 이동 시간을 줄이면서 납기를 지키는 배차"는 전형적인 최적화 문제다. 예선의 통근버스 경로·배정 과제와 같은 계열이다. 바닥을 달리는 자율 로봇(AMR)은 SK하이닉스가 Physical AI 축으로 공개한 분야다.

**디스패칭 규칙 네 가지는 외워 둔다.** FIFO는 먼저 온 것부터, EDD는 납기가 급한 것부터, SPT는 짧게 끝나는 것부터, CR은 "납기까지 남은 시간 ÷ 남은 작업 시간"이 작은(위험한) 것부터다. 20분 안에 만드는 baseline은 이 중 하나를 greedy로 적용한 것이다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| AMHS | Fab 안의 자동 운반 체계 전체 | `transport_log`의 출처 |
| OHT | 천장 레일을 달리며 FOUP을 나르는 운반차 | `vehicle_id`, `from_port`, `to_port`, `travel_sec` |
| FOUP | Wafer 25장을 담는 밀폐 통. Lot 하나가 보통 FOUP 하나 | `carrier_id` ≈ `lot_id` 1:1 |
| Stocker | Lot을 잠시 보관하는 자동 창고 | `stocker_id`, `shelf_no`, `in_time`, `out_time` |
| AMR | 바닥을 달리는 자율 이동 로봇 | `robot_id`, `battery`, `task_id` |
| 반송 (Transport) | Lot을 다음 장비로 옮기는 일. 기다리고 이동하는 시간이 전부 Cycle time에 들어간다 | `request_time`, `pickup_time`, `delivery_time` |
| 디스패칭 (Dispatching) | 장비 앞에 줄 선 Lot 중 다음 것을 고르는 규칙 | FIFO(도착순), EDD(납기순), CR(남은시간/남은작업시간), SPT(짧은 작업 먼저) |
| 병목 (Bottleneck) | 처리 능력이 가장 모자란 장비군. 공장 전체 산출량을 이것이 정한다 | 가장 긴 대기열 `queue_length` |

---

## 5. 품질·생산 KPI (정의식은 `kpi_formulas.md`)

**이 숫자들이 왜 있나.** 공장은 "얼마나 많이(Throughput), 얼마나 빨리(Cycle time), 얼마나 좋게(Yield), 장비를 얼마나 잘 써서(OEE)" 만들었는지를 매일 본다. 과제에서 대시보드나 보고서를 만들라고 하면 거의 이 숫자들이다. 정의식과 분모·분자의 함정은 `kpi_formulas.md`에 있고, 여기서는 뜻만 잡는다.

**가장 흔한 함정 두 개.** 수율은 분모가 무엇인지(투입 Wafer인지, 폐기를 뺀 것인지)에 따라 달라진다. 규격 한계(Spec, 고객이 정한 합격선)와 관리 한계(Control limit, 통계적으로 "평소와 다르다"는 선)는 다른 것이다. 관리 한계를 벗어났다고 불량은 아니고, 규격 안이라고 공정이 정상인 것도 아니다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| Yield (수율) | 투입한 것 중 양품 비율. Wafer 단위 수율과 Die 단위 수율은 다른 숫자 | `good/total`, 분모 확인 필수 |
| Defect density | 단위 면적당 결함 개수 | `defects / area_cm2` |
| Scrap | 못 쓰게 되어 폐기한 Wafer/Lot | `scrap_flag`, `scrap_reason` |
| Rework | 잘못되어 같은 Step을 다시 한 것 | `rework_flag`, 같은 Step이 2번 나옴 |
| OEE | 설비종합효율. 쓸 수 있었던 시간 비율 × 속도 비율 × 양품 비율 | 세 요소를 따로 계산한 뒤 곱한다 |
| WIP | 지금 라인 안에 있는(아직 안 끝난) Lot의 수. 어느 시점의 사진 같은 숫자 | 시점별 `status in (WAIT, RUN)` 개수 |
| Cycle time | Lot이 들어가서 나올 때까지 걸린 시간 | `end_at - start_at` |
| Throughput | 단위 시간당 완성한 수량 | 일/시간당 완료 Lot 수 |
| Cp / Cpk | 공정능력지수. 규격 폭에 비해 산포가 얼마나 작은가. Cpk는 중심이 치우친 것까지 반영 | `usl`, `lsl`, 측정값 평균·표준편차 |
| Spec / Control limit | 규격 한계(고객 합격선)와 관리 한계(통계적 ±3σ 경보선)는 다르다 | `usl/lsl` vs `ucl/lcl` |

---

## 6. 안전 (EHS)

**이 일이 무엇인가.** 공장에는 전기·가스·화학물질·높은 곳·밀폐 공간 같은 위험이 있다. 위험한 작업은 하기 전에 신청서를 내고, 위험을 평가하고, 책임자가 승인해야 시작할 수 있다(작업허가). 정비 중 누가 장비를 켜지 못하게 전원을 잠그고 표시하는 절차(LOTO), 작업 직전 짧은 안전 회의(TBM)도 있다.

**왜 과제로 나올 수 있나.** "신청 → 검토 → 승인 → 작업 → 종료"의 상태가 있고, 역할마다 할 수 있는 일이 다르고, 모든 변경이 기록되어야 한다. 역할 기반 웹 + 승인 워크플로 + 감사 로그라는 예선 형태와 정확히 맞는다.

| 용어 | 쉬운 정의 | 데이터에서 |
|---|---|---|
| 작업허가 (PTW, Permit To Work) | 위험 작업 전에 승인받는 절차. 신청 → 검토 → 승인 → 작업 → 종료 | `permit_id`, `status`, `requested_by`, `approved_by`, `valid_from/to` |
| 위험성평가 (Risk assessment) | 작업의 위험 요인을 "일어날 가능성 × 심각도"로 따져 등급을 매기는 것 | `hazard`, `likelihood`, `severity`, `risk_level` |
| TBM (Tool Box Meeting) | 작업 직전 현장에서 하는 짧은 안전 회의·점검 | `tbm_id`, `attendees`, `checklist` |
| LOTO (Lock Out Tag Out) | 정비 중 전원·가스 같은 에너지원을 잠그고 표찰을 붙여 오작동을 막는 절차 | `loto_applied`, `energy_source` |
| 고소작업 / 밀폐공간 | 대표적인 고위험 작업 유형 | `work_type` |

---

## 7. AX·AI 용어 (SK하이닉스 공개 자료 기준)

**배경.** SK하이닉스는 2030년까지 "사람이 판단하던 공장 운영을 AI가 제안하고 사람이 결정하는" 자율형 팹을 목표로 공개했다. 세 축은 운영 판단(Operational AI), 로봇·물류(Physical AI), 가상 공장(Digital Twin)이다. 사내 생성형 AI 플랫폼 GaiA 위에 설비 보전 등 에이전트를 올리고 있고, SK AX(그룹 IT 회사)는 "AI는 제안만 하고 사람이 승인하며, 권한별 접근 제어와 감사 로그를 남긴다"는 운영 모델을 공개했다. 과제 README에 "제안", "승인", "역할", "감사 로그" 같은 말이 보이면 이 모델을 따르는 것이다.

| 용어 | 쉬운 정의 | 과제에서 |
|---|---|---|
| 자율형 팹 (Autonomous Fab) | 2030년 목표. Operational AI, Physical AI, Digital Twin 3축 | 과제가 세 축 중 어디에 속하는지 분류 |
| Operational AI | 설비 유지보수·결함 분석 같은 운영 판단을 AI가 돕는 것. 처리시간 50% 이상 단축 발표 | S01, S07, S09 |
| Physical AI | OHT·AMR·비전 로봇 등 물리적 자동화. 부품 재고 약 30% 감축 기대 | S07, S08 |
| Digital Twin | 생산 흐름·물류·공정 조건을 가상 공장에서 미리 돌려 보는 것(NVIDIA Omniverse 기반) | S04, S08의 what-if |
| Virtual Metrology (VM) | 실제로 재지 않은 Wafer의 품질을 센서값으로 추정하는 것 | S03 |
| GaiA | SK하이닉스 사내 생성형 AI 플랫폼(2025.8). 첫 에이전트 4종 중 하나가 장비 보전 | S02, S07 |
| MADA | 연구소의 데이터 통합·이상 탐지·원인 분석·보고서 자동화 시스템 | S01 |
| SOP 기반 재설계 | 라인에 이상이 생기면 AI가 원인과 대책을 제안하고 사람이 최종 판단 | S01, S02의 승인 흐름 |
| 제안 → 승인 → 실행 | AI는 제안만, 현장 담당자가 승인·조정. 권한별 접근 제어와 감사 로그 | S02, S10의 상태 머신 |
| RAG | 문서를 검색해 근거와 함께 답하는 방식. "못 찾음"과 "지어냄"은 다른 실패 | S02, S05 |
| Allowlist tool | 에이전트가 부를 수 있는 함수 목록을 서버가 제한하는 것 | `tool_name in allowlist` |

---

## 8. 10분 자가 점검

1. Wafer 수율이 97%에서 92%로 떨어졌다. 특정 Tool 탓으로 단정하면 안 되는 이유 세 가지(제품 mix, Recipe, 시간)를 말할 수 있는가.
2. SPC 관리 한계와 Spec 규격 한계의 차이를 말할 수 있는가.
3. PM과 BM의 차이, MTBF와 MTTR의 분모를 말할 수 있는가.
4. Lot 1줄과 Wafer 25줄을 조인한 뒤 수량을 합치면 왜 25배가 되는지 설명할 수 있는가.
5. FIFO, EDD, CR 디스패칭 규칙을 한 줄씩 말할 수 있는가.
6. 전공정과 후공정의 경계가 어디인지, 각각 어떤 데이터가 나오는지 말할 수 있는가.
7. Fab·라인·Tool·Chamber의 포함 관계와, 왜 Fab이 다르면 수율을 그냥 비교하면 안 되는지 말할 수 있는가.
