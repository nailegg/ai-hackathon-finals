# Shape: 데이터 분석 / 표 데이터 ML / 예측

> **대상: 에이전트 참고 — 지시가 아니다.** 지시는 과제 루트의 AGENTS.md와 CONTRACT.md가 우선한다. CONTRACT §10에 이 파일 경로가 적혀 있을 때만 읽는다.

**적용:** 원인 분석, 이상 탐지, 집단 비교, 수율·계측값 예측, 분류, 보고서·대시보드. 출력이 웹이면 화면은 `web_fullstack.md`.

## 판별 신호
- `train.csv`/`test.csv`/`sample_submission.csv` 또는 "예측", "탐지", "원인", "영향 요인" 문구
- 라벨 컬럼(불량 여부, 수율, 계측값)과 센서·공정 컬럼이 함께 있음
- 채점이 MAE/RMSE/F1/PR-AUC/Recall@K 같은 지표로 설명되거나 "분석 보고서" 요구
- "어떤 설비/조건이 문제인지 찾아라" 류의 의사결정 질문

## 산출물 형태
- 채점자가 먼저 볼 것: 제출 파일(`sample_submission` 형식 그대로) 또는 보고서 첫 장의 결론 표
- 재현 명령 한 줄 → 지표 출력 → 예측 파일/그림 저장(`MPLBACKEND=Agg`)
- 보고서는 질문 → 데이터 → 방법 → 결과 → 한계 순서

## 붙일 부록
- `contract/addenda/DATA_CONTRACT.md` (필수), `ML_EVAL.md` (예측 과제) 또는 `RESULT_FILE.md` (보고서·결과 파일)

## 330분 단계
| 구간 | 이 형태에서 할 일 |
|---|---|
| T+0~15 계약(P0) | 타깃, 관측 단위(wafer/lot/시간), 지표, 제출 형식을 §2·§6에. 채점 지표가 없으면 §3에 가설 |
| T+15~25 데이터(P1) | 스키마·결측·중복·시간 순서·**사용 금지 컬럼(미래 정보, 라벨 파생)** 을 §4에 |
| T+25~90 AC1(P2) | 누수 없는 분할(시간/그룹) → 단순 baseline(평균·다수 클래스·고정 임계값) → 지표 → 제출 파일 형식 통과 |
| T+90~점심 / 점심후~T+255 (P3, P4) | 모델 1~2개 비교(Ridge/트리), 그룹별 성능, 오류 분석. 보고서형이면 집단 비교 표와 그림 2~3개 |
| T+255~285 감사(P5) | seed 고정 재실행 동일, 제출 파일 행 수·ID 일치, 누수 검사 재확인 |
| T+285~305 제출문서(P6) | baseline 대비 지표 표, 가정, 한계, "원인 후보이며 인과 확정 아님" 명시 |
| T+305~330 제출 | 파일명·컬럼·행 수 바이트 단위 확인 |

## Baseline
- 회귀: 전체 평균 또는 그룹(설비·Recipe) 평균. 분류: 다수 클래스, 또는 단일 변수 임계값
- 이상 탐지: 설비·Recipe별 robust z-score(중앙값·MAD), 상위 K
- 원인 분석: 이상군 vs 같은 Recipe 정상군의 컬럼별 차이·효과크기·표본 수 표

## 독립 검증
- 분할 검사: 같은 lot이 train/valid에 동시에 없음, valid 시각이 train 이후
- 제출 파일: ID 집합과 순서가 sample과 같음, 결측 없음
- 예시 AC 검증 명령: `python check_submission.py out/submission.csv data/sample_submission.csv`; `python -c "import leakage; leakage.check('data/train.csv', target='y')"`; `python eval.py --pred out/valid_pred.csv` → 지표 출력

## 지표
- 주: 과제가 지정한 지표. 없으면 회귀 MAE/RMSE, 희소 분류 PR-AUC·Recall@K
- 보조: 그룹별 worst-case, baseline 대비 개선폭, 실행 시간
- 함정 지표: 불균형 데이터의 Accuracy, train 점수

## 흔한 함정
- 라벨 이후에 생성된 컬럼(검사 결과, 조치 이력)을 feature로 사용
- 같은 Lot의 wafer가 train/valid에 섞임
- 전체 평균만 비교해 Recipe/제품 mix 변화를 무시
- 상관을 인과로 서술
- 범주형을 숫자로 그대로 넣음, 결측을 0으로 채움
- 검증 세트 점수만 보고 재학습 없이 제출
- 그림에 30분 이상 사용

## 쓸 snippets
- `time_split`: 시간·그룹 누수 없는 분할
- `group_compare`: 집단 비교, robust z-score, 효과크기 표
- `metrics`: MAE/RMSE/PR-AUC/F1/Recall@K
- `csv_load`: 인코딩·타입 추론

## 참고 시나리오 카드
S01 공정 이상 분석·대응, S03 가상 계측·품질 예측, S09 후공정 테스트 저수율 분석, S06 실험 설계·조건 추천

## 만들지 않을 것
- 딥러닝 학습, 대규모 하이퍼파라미터 탐색, 검증 없는 leaderboard 튜닝
- causal discovery 라이브러리 도입
- 요구되지 않은 대시보드

## 보조 세션 (선택)
데이터가 여러 파일이거나 누수·결측·키 불일치가 결론을 바꿀 수 있을 때만. 사람이 Terminal 2에서 `prompts/specialists/specialist-data.md`로 띄운다. 동시 1개, 10분, 읽기 전용, 결과는 과제 루트 `DATA_QUALITY.md` 한 파일.
