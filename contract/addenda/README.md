# 부록 (addenda)

CONTRACT.md는 모든 형태에 공통인 코어다. 형태별 세부는 여기 부록을 **과제 루트에 복사**해 채운다. P0 결과(§10 형태)에 따라 1~2개만 쓴다. 보조 세션(prompts/specialists)이 채우는 파일도 같은 템플릿을 쓴다.

| 부록 | 언제 | 채우는 주체 | 과제 루트 파일명 |
|---|---|---|---|
| `WEB.md` | 브라우저로 확인하는 웹 서비스 | 에이전트(P0 직후), 응시자 확정 | `WEB.md` |
| `RESULT_FILE.md` | 출력 파일·CLI가 채점 대상 | 에이전트(P0 직후) | `RESULT_FILE.md` |
| `DATA_CONTRACT.md` | 제공 데이터가 있을 때 (거의 항상) | 에이전트(P1) 또는 data specialist | `DATA_QUALITY.md` |
| `OR_SPEC.md` | 최적화·배정·스케줄 계산 | 응시자 5분 또는 OR specialist | `OR_SPEC.md` |
| `RAG_EVAL.md` | 문서 검색·질의응답·에이전트 | rag specialist 또는 에이전트 | `EVAL_SET.md` |
| `ML_EVAL.md` | 예측·분류·이상탐지 모델 | 에이전트(P2 전) | `ML_EVAL.md` |
| `REPAIR_MAP.md` | 기존 코드 수리 | 에이전트(R1) 또는 debug specialist | `REPAIR_MAP.md` |

복사 예: `cp ~/finals/contract/addenda/OR_SPEC.md ./OR_SPEC.md`
