# 사람 전용: 11/9~11/10 학습·준비 순서

> 읽는 순서와 공부할 개념 목록은 [READING_ORDER.md](READING_ORDER.md). 이 파일은 시간표만 둔다.

> 에이전트는 이 폴더를 읽지 않는다. 목표는 "입력 데이터, KPI, baseline, 검증 포인트를 각각 3분 안에 설명"이다. 총 학습 시간은 2시간을 넘기지 않는다. 나머지는 운영 연습이다.

## 11/9 (일)
| 시간 | 할 일 | 완료 기준 |
|---|---|---|
| 40분 | `domain/glossary.md` 전공정·후공정·보전·물류 절 읽기 | 체크 문제 1~4 답할 수 있음 |
| 30분 | `domain/kpi_formulas.md` | Yield·OEE·MTBF·tardiness 분모·분자 설명 가능 |
| 20분 | `domain/data_patterns.md` | 8개 테이블의 조인 키와 1:N 함정 설명 가능 |
| 30분 | 시나리오 카드 S01, S04, S07, S08 (예선과 닮은 OR+웹 계열) + S02·S11은 Baseline 절만 | 각 카드의 baseline·validator 한 줄 요약. **예선이 OR+웹이었다는 사전 확률은 시험장에서 README를 읽을 때 버린다** |
| 30분 | `RUNBOOK_330.md`를 처음부터 끝까지 읽고 프롬프트 P0~P6 훑기 | 시간표를 보지 않고 단계 순서를 말할 수 있음 |

## 11/10 (월)
| 시간 | 할 일 | 완료 기준 |
|---|---|---|
| 35분 | 시나리오 카드 S02, S03, S05, S06, S09, S10, S11 | 각 카드 1분 요약 |
| 30분 | 체크 문제 전체 (`check_questions.md`) | 10문항 중 8개 이상 답 스케치 |
| 45분 | **T+0~T+25 손 드라이런**: 빈 폴더에 장난감 README를 두고 clone → 세 파일 복사 → 해시·시각 → (P0 보고는 가정) → §10 경로 줄 먼저 저장 → P1 붙이기(CONTRACT 저장 금지) → README와 카드 차이 3개를 DECISIONS에 → 카드 발췌 명령 → 보조 세션 여부 결정. 타이머를 켜고 한다. 기계적 동작(명령·경로·복사·발췌·snippets)은 11/9에 가짜 과제 폴더에서 전부 확인했으므로 **손과 시간만 익힌다** | T+15~25 구간이 10분 안에 끝남, 걸린 시간 기록 |
| 10분 | `snippets/py/validate_schedule.py`와 `greedy_assign.py`를 열어 함수 시그니처와 반환 형식만 본다(자가 테스트 14개는 11/9 clone 사본에서 통과 확인) | 두 함수의 입력·출력을 말로 설명 가능 |
| 15분 | `checklists/grading_2h.md`, `submission.md`, `recovery.md` 읽기 | |
| 5분 | 드라이런에서 어긋난 문구가 있으면 고쳐 push, 없으면 동결 (push·clone URL 확인은 11/9 완료) | 이후 수정 금지 |

## 세 목록 일치 검사 (드라이런 직후)

형태 이름은 세 곳에 있다. `README.md` 판별표, `prompts/P0_contract.md`의 형태 목록 한 줄, `shapes/` 파일 이름. 셋이 어긋나면 P0가 제안한 형태를 사람이 README 표에서 못 찾거나 §10에 없는 파일 경로를 적게 된다.

```bash
cd ~/finals && diff <(ls shapes | sed 's/\.md$//' | sort) <(grep -oE '(web_fullstack|or_optimization|data_analysis_ml|rag_agent|etl_pipeline|simulation_whatif|code_repair|unknown)' prompts/P0_contract.md README.md | cut -d: -f2 | sort -u) && echo "형태 목록 일치"
```

차이가 나오면 shape 파일 이름을 기준으로 나머지 두 곳을 고친다.

## 시험 전날 밤
- 규정 메일 재확인: 모델, git, 인터넷, 제출 방식, 점심 시각.
- 노트북·충전기·필기구. 플랫폼 로그인 확인.
- 이 폴더 외에 외울 것은 없다. 시험장에서는 런북만 본다.
