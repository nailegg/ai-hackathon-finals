# 프롬프트 (복사용)

> 사람이 런북의 시각에 맞춰 Terminal 1(메인 세션)에 붙여 넣는다. 모든 프롬프트는 `CONTRACT.md`의 절 번호를 가리킨다. 형태별 차이는 프롬프트가 아니라 CONTRACT §10에 적힌 `shapes/` 문서가 맡는다.

| 파일 | 언제 | 산출물 | 사람이 같은 시간에 할 일 |
|---|---|---|---|
| `P0_contract.md` | T+5~15 | CONTRACT §1~§3, §5~§10 초안, 부록 복사 | 런타임 확인, 웹 가능성 있으면 boilerplate 병렬 반입 |
| `P1_data_profile.md` | T+15~25 (데이터가 있을 때) | CONTRACT §4, `DATA_QUALITY.md`, 프로파일 스크립트 | 계약 검토·확정 |
| `P2_slice.md` | T+25~90 | AC1 수직 흐름 + `verify` | 첫 결과 확인, 모호함 질문 |
| `P3_next_ac.md` | T+90~255 (AC마다 반복) | ACn + verify check 추가 | 중간 보고 요청 (T+120, T+200) |
| `P4_checkpoint.md` | 점심 직전, 재접속·세션 교체 직후 | §0 갱신, DECISIONS 체크포인트 | 서버·터미널 상태 메모 |
| `P5_audit.md` | T+255~285 | AC 상태 확정, 깨끗한 재현, 체크리스트 | `checklists/grading_2h.md` 대조 |
| `P6_submission.md` | T+285~305 | README 또는 SUBMISSION.md | 서술형 메모 |
| `specialists/` | 해당 shape의 "보조 세션" 조건일 때만 | 과제 루트 결과 파일 1개 | Terminal 2에서 띄우고 10분 뒤 닫음 |
