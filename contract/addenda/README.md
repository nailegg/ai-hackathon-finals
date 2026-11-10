# 부록 (addenda)

CONTRACT.md는 모든 형태에 공통인 코어다. 형태별 세부는 여기 부록을 **과제 루트에 복사**해 채운다. 복사는 CONTRACT §10 '붙인 부록' 줄을 보고 에이전트가 P2 시작 시(DATA_CONTRACT는 P1에서) 아래 명령 블록의 해당 줄로 한다. 응시자는 파일명이 맞는지만 본다. CONTRACT §10 '붙인 부록' 줄에 적힌 것만 쓴다(보통 1~3개). 보조 세션(prompts/specialists)이 채우는 파일도 같은 템플릿을 쓴다.

| 부록 | 언제 | 채우는 주체 | 과제 루트 파일명 |
|---|---|---|---|
| `WEB.md` | 브라우저로 확인하는 웹 서비스 | 에이전트가 P2 시작 시 빈칸을 채우고 보고 | `WEB.md` |
| `RESULT_FILE.md` | 출력 파일·CLI가 채점 대상 | 에이전트가 P2 시작 시 | `RESULT_FILE.md` |
| `DATA_CONTRACT.md` | 제공 데이터가 있을 때 (거의 항상) | 에이전트(P1) 또는 data specialist | `DATA_QUALITY.md` |
| `OR_SPEC.md` | 최적화·배정·스케줄 계산 | 응시자 5분, 또는 OR specialist, 또는 에이전트가 P2 시작 시 | `OR_SPEC.md` |
| `RAG_EVAL.md` | 문서 검색·질의응답·에이전트 | rag specialist, 또는 에이전트가 P2 시작 시 | `EVAL_SET.md` |
| `ML_EVAL.md` | 예측·분류·이상탐지 모델 | 에이전트가 P2 시작 시 | `ML_EVAL.md` |
| `REPAIR_MAP.md` | 기존 코드 수리 | 에이전트가 P2 시작 시(코드 수정 전) 또는 debug specialist | `REPAIR_MAP.md` |

**복사와 이름 규칙 (에이전트가 P2 시작 시, DATA_CONTRACT는 P1에서, §10에 적힌 줄만 실행. 이 표가 유일한 기준):**
```bash
cp ~/finals/contract/addenda/WEB.md ./WEB.md                 # 필요한 것만
cp ~/finals/contract/addenda/RESULT_FILE.md ./RESULT_FILE.md
cp ~/finals/contract/addenda/OR_SPEC.md ./OR_SPEC.md
cp ~/finals/contract/addenda/ML_EVAL.md ./ML_EVAL.md
cp ~/finals/contract/addenda/REPAIR_MAP.md ./REPAIR_MAP.md
cp ~/finals/contract/addenda/DATA_CONTRACT.md ./DATA_QUALITY.md   # 이름이 바뀐다
cp ~/finals/contract/addenda/RAG_EVAL.md ./EVAL_SET.md            # 이름이 바뀐다
```
빈 템플릿은 P2 프롬프트 0)단계에서 에이전트가 채운다. 보조 세션이 채우는 경우는 그 파일을 읽기만 한다.
