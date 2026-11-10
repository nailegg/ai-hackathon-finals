# 프롬프트 (복사용)

> **P0~P6의 코드 블록은 `RUNBOOK_330.md`의 해당 절에 글자까지 같게 실려 있다.** 시험장에서는 런북의 블록을 붙이고, 사람이 확인할 항목도 런북에만 있다. 이 폴더는 원본이다. 본문을 고치면 런북의 블록도 같이 고치고 `study/README.md`의 "프롬프트 일치 검사"를 돌린다. `specialists/`만 런북에 없고 여기서 복사한다.
>
> 사람이 런북의 시각에 맞춰 Terminal 1(메인 세션)에 붙여 넣는다. P0~P4의 첫 줄은 에이전트에게 `AGENTS.md`를 먼저 읽으라고 한다(자동 로드가 없는 에이전트 대비). 과제에 `README.md`가 없으면 `TASK_SPEC.md`가 그 자리다(런북 3절). 모든 프롬프트는 `CONTRACT.md`의 절 번호를 가리킨다. 형태별 차이는 프롬프트가 아니라 CONTRACT §10에 적힌 `shapes/` 문서가 맡는다.

| 파일 | 언제 | 산출물 | 사람이 같은 시간에 할 일 |
|---|---|---|---|
| `P0_contract.md` | T+5~15 | CONTRACT §1~§3, §5~§10 초안 (§10에 주 shape 제안과 카드 제안 포함) | 런타임 확인, 웹 가능성 있으면 boilerplate 병렬 반입 |
| `P1_data_profile.md` | T+15~25 (데이터가 있을 때, 사람 검토와 병렬) | CONTRACT §4, `DATA_QUALITY.md`, 프로파일 스크립트 | §10 경로 먼저 저장 → 계약 검토·확정(최대 10분, P1 중 CONTRACT 저장 금지), 카드 제안 수락 시 발췌 |
| `P2_slice.md` | T+25~90 (예측 파일·ETL은 T+45 게이트) | 부록 빈칸 채우기, AC1 수직 흐름 + `verify_fast.sh` | 첫 결과 확인, 모호함 질문 |
| `P3_next_ac.md` | T+90~255 (AC마다 반복) | ACn + verify check 추가. 하단에 "중간 보고", "요구사항 추가·변경"(시험 중 새 요구가 왔을 때, 코드 금지·§7에 AC 추가), "품질 개선" 블록 | 중간 보고 요청 (T+120, T+200). 요구가 바뀌면 원문을 `TASK_SPEC.md`에 붙이고 확정 뒤 P3 재개 |
| `P4_checkpoint.md` | 점심 직전, 재접속·세션 교체 직후 | §0 갱신, DECISIONS 체크포인트 | 서버·터미널 상태 메모 |
| `P5_audit.md` | T+255~285 | AC 상태 확정, 깨끗한 재현, 체크리스트 | `checklists/grading_2h.md` 대조 |
| `P6_submission.md` | T+285~305 | README 또는 SUBMISSION.md | 서술형 메모 |
| `specialists/` | 해당 shape의 "보조 세션" 조건일 때만 | 과제 루트 결과 파일 1개 | Terminal 2에서 띄우고 10분 뒤 닫음 |
