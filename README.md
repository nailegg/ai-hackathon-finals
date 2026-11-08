# AI Hackathon Finals Kit — 330분

> **시험 당일에는 [RUNBOOK_330.md](RUNBOOK_330.md) 하나만 열고 위에서부터 따른다.** 이 저장소는 과제 폴더 **밖**(`~/finals`)에 clone한다. 에이전트는 `CONTRACT.md` §10에 적힌 파일만 읽는다.

SK하이닉스 AI 해커톤 본선(2026-11-11, 330분) 대비 운영 자료. 과제 정답이 아니라 **어떤 형태의 과제가 와도 같은 운영 문서(CONTRACT)로 굴러가게 하는 절차·템플릿·참고 자료**다. 기존 `ai-hackathon-playbook`(180분)을 재편하고 도메인 층과 코드 스니펫을 더했다.

## T+0 명령 (과제 루트에서)

```bash
git clone --depth 1 https://github.com/nailegg/ai-hackathon-finals.git ~/finals
cp ~/finals/contract/AGENTS.md ./AGENTS.md && cp ~/finals/contract/CONTRACT.md ./CONTRACT.md && cp ~/finals/contract/DECISIONS.md ./DECISIONS.md
node -v; command -v pnpm || echo "no pnpm"; python3 -V
```

## 형태 판별표 (P0 결과 §10을 확정할 때)

| 과제 README의 신호 | shape | 부록 | 보조 세션 (선택) | 코드 기반 |
|---|---|---|---|---|
| 로그인·역할·저장·화면 명시, 스택 미지정 | `web_fullstack` | WEB (+OR_SPEC) | OR specialist | web_boilerplate 반입 |
| 웹이지만 스택·스타터 지정, 또는 로그인·저장 없는 화면 | `web_fullstack` (지정 스택 절) | WEB | 없음 | 지정 스택, lib/auth만 이식 |
| 배정·스케줄·경로·생산계획, 결과 파일 또는 웹 안의 계산 | `or_optimization` | OR_SPEC, RESULT_FILE | OR specialist | snippets validate_schedule·greedy_assign |
| 예측·분류·이상탐지·분석 보고 | `data_analysis_ml` | DATA_CONTRACT, ML_EVAL, RESULT_FILE | data specialist | snippets time_split·group_compare·metrics |
| 문서 검색·질의응답·인용·승인·에이전트 | `rag_agent` | RAG_EVAL (+WEB) | rag specialist | snippets fts_search |
| CSV·JSON 변환·정제·집계 | `etl_pipeline` | DATA_CONTRACT, RESULT_FILE | 없음 | snippets csv_load |
| 시나리오 재생·what-if·KPI 비교 | `simulation_whatif` | OR_SPEC 또는 RESULT_FILE | OR specialist | snippets validate_schedule·metrics |
| 기존 소스 + 실패 테스트 | `code_repair` | REPAIR_MAP | debug specialist | 제공 코드 |
| 어디에도 깔끔히 맞지 않음 | `unknown` | 산출물에 따라 | research specialist | 표준 라이브러리 |

판별 원칙: 혼합 과제는 **채점자가 직접 확인할 산출물**이 속한 형태를 주로 한다. 도메인(최적화, RAG)과 출력 형태(웹, 파일)를 분리해서 본다. 10분이 지나도 애매하면 분류를 멈추고 산출물·입력·검증 방법 세 가지로 결정한다.

## 문서 지도

| 경로 | 대상 | 언제 |
|---|---|---|
| [RUNBOOK_330.md](RUNBOOK_330.md) | 사람 | 시험 내내 |
| [contract/](contract) | 에이전트 | T+0 복사. `CONTRACT.md`(코어 + §0 상태판), `AGENTS.md`, `DECISIONS.md`, `addenda/`(형태별 부록 7종) |
| [prompts/](prompts) | 사람이 복사 | P0 계약 → P1 데이터 → P2 AC1 → P3 반복 → P4 체크포인트 → P5 감사 → P6 제출. `specialists/`는 보조 세션 |
| [shapes/](shapes) | 에이전트 | 형태별 작업 명세 8장. §10에 1장만 경로 지정 |
| [domain/](domain) | 사람 학습 + 에이전트 참조 | 용어집, KPI 공식, 데이터 패턴, 시나리오 카드 S01~S10 |
| [snippets/](snippets) | 에이전트가 복사 | 의존성 없는 py/ts 7종, 각각 자가 테스트 |
| [checklists/](checklists) | 사람 | `grading_2h.md`(2시간 심사 대비), `submission.md`, `recovery.md` |
| [study/](study) | 사람 전용 | 11/9~10 학습 순서, 체크 문제 |

## 규칙 요약

- 에이전트에게 주는 참고 문서는 **shape 1장 + 시나리오 카드 0~1장 + 과제 루트 부록**뿐이다. 폴더 전체를 읽히지 않는다.
- `CONTRACT.md` §1~§8 본문은 사람이 확정한다. 에이전트는 §0, §7 상태, §9 행 추가만 한다.
- AC 상태는 검증 명령이 통과할 때만 바뀐다. 모든 검증을 모은 `verify` 한 줄이 채점자용 명령이다.
- 공개 자료로 확인된 하이닉스 AX 방향은 `domain/`에 출처와 함께 있고, 출제 예측은 모두 **가설**이다.

> 시험 안내와 운영진의 최신 지침이 언제나 우선한다. 이 자료는 SK하이닉스/크래프톤의 공식 문서가 아니다.
