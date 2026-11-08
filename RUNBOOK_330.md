# 본선 런북 — 330분, T+0부터 제출까지

> **대상: 사람. 시험 당일 유일한 진입점이다.** 위에서부터 따른다. 프롬프트는 `prompts/P0~P6`에서 복사한다. 다른 문서는 이 런북이나 CONTRACT §10이 경로를 지정할 때만 연다.

**핵심 원칙 세 가지.**
1. **계약 먼저, 코드는 나중.** 에이전트가 기반 코드나 데이터 세부를 보기 전에 `CONTRACT.md`로 요구사항·제출물·채점 가설을 고정한다.
2. **상태는 파일에 있다.** 대화 기록은 사라질 수 있다. `CONTRACT.md` §0과 `DECISIONS.md`가 진실이다.
3. **검증기가 통과한 것만 완료다.** AC 상태는 `verify`가 바꾼다. 심사 2시간 안에 기계적으로 돌아가는 산출물이 점수다.

**시험 규정 (2차 예선 기준, 본선 안내가 다르면 안내 우선):** 제공된 에이전트만 사용, 개인 API 키·외부 AI 금지. 공개 Git clone 허용, **`git commit`·`git push` 금지.** 문제·결과 외부 반출 금지. 개인 파일 업로드 불가.

## 시간표 (9:30 시작 가정, 점심 1시간은 안내 시각에 맞춰 이동)

| T+ | 시각 | 누가 | 할 일 | 산출물 |
|---|---|---|---|---|
| 0~5 | 9:30 | 사람 | 준비 명령 5줄, 제출 방식 확인 | 과제 루트에 AGENTS·CONTRACT·DECISIONS |
| 5~15 | 9:35 | 에이전트 P0 ‖ 사람 | 계약 추출 ‖ 런타임 확인, 웹 가능성 있으면 boilerplate 반입 | CONTRACT §1~§3, §5~§10 |
| 15 | 9:45 | 사람 | 계약 검토·확정, shape·카드 경로를 §10에, 부록 복사 | `DECISIONS: 계약 확정` |
| 15~25 | 9:45 | 에이전트 P1 | 데이터 계약 (데이터 있을 때) | CONTRACT §4, DATA_QUALITY.md |
| 25~90 | 9:55 | 에이전트 P2 | AC1 수직 흐름 + verify | 첫 통과 (게이트 T+90 = 11:00) |
| 90~점심 | 11:00 | 에이전트 P3 | AC2, AC3… | |
| 점심 −5 | | 에이전트 P4 중단 | 체크포인트 | §0, DECISIONS 체크포인트 |
| 점심 +0 | | 에이전트 P4 재개 | verify 확인 후 이어서 | |
| ~T+255 | ~14:45 | 에이전트 P3 | 나머지 AC, 필수 AC 끝나면 품질 개선 1건 | |
| 120, 200 | | 사람 | 중간 보고 요청 (P3 하단) | 범위 조정 결정 |
| 255~285 | 14:45 | 에이전트 P5 | 제출 감사, 깨끗한 재현 | §7 확정, 감사 기록 |
| 285~305 | 15:15 | 에이전트 P6 ‖ 사람 | 제출 문서 ‖ 서술형 메모 | SUBMISSION.md |
| 305~330 | 15:35 | 사람 | 제출 (`checklists/submission.md`) | 제출 완료 확인 |

점심이 T+150(12:00) 근처면 AC2까지 통과한 상태로 들어가는 것이 목표다. 점심 시각이 다르면 "점심 −5 체크포인트"만 그 시각에 맞춘다.

**Stop-loss.** 같은 문제에 20분 넘게 막히면 더 단순한 baseline으로 후퇴. UI 디테일이나 모델 튜닝이 30분을 넘기면 검증·제출로 전환. 점수가 낮아도 **실행·제약·재현이 되는** 결과물이 먼저다.

## 터미널 배치

| 터미널 | 주인 | 용도 |
|---|---|---|
| Terminal 1 | 에이전트 (메인) | 과제 루트에서 시작. P0부터 끝까지 한 세션. 끊기면 P4 재개 |
| Terminal 2 | 사람 | 반입·설치·확인 명령, 보조 세션 (동시 1개, 10분) |
| Terminal 3 | 사람 또는 에이전트 | 개발 서버 하나 (`0.0.0.0:3000`). 닫지 않는다 |

서버는 하나만. 3000번이 응답하면 재사용하고 kill하지 않는다. 확인: `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/`

## T+0~5 · 사람: 준비

```bash
cd <과제 루트>
ls -la                                                     # 과제 원본 확인
git clone --depth 1 https://github.com/nailegg/ai-hackathon-finals.git ~/finals
cp ~/finals/contract/AGENTS.md ./AGENTS.md                 # 이미 있으면 cat >> 로 뒤에 붙인다
cp ~/finals/contract/CONTRACT.md ./CONTRACT.md
cp ~/finals/contract/DECISIONS.md ./DECISIONS.md
node -v; command -v pnpm || echo "no pnpm"; python3 -V; python3 -c "import pandas, sklearn; print('pandas ok')" 2>&1 | tail -1
```

- 과제 루트에 `AGENTS.md`가 이미 있으면 덮어쓰지 않고 `cat ~/finals/contract/AGENTS.md >> AGENTS.md`. 과제 지시가 앞에 오게 한다.
- `AGENTS.md`는 세션 시작 시 로드되므로 **복사를 끝낸 뒤** 에이전트를 시작한다.
- **제출 방식을 먼저 확인한다.** 폴더 전체 업로드인지, 특정 파일만인지, 용량 제한이 있는지. 플랫폼의 제출 화면 위치를 미리 찾아 둔다.
- `~`에 쓸 수 없으면 `/tmp/finals`를 쓰고 이후 경로를 바꿔 읽는다.

## T+5~15 · P0 ‖ 사람 병렬 작업

Terminal 1에 `prompts/P0_contract.md`를 붙여 넣는다. 도는 동안 Terminal 2에서:

**웹 서비스 가능성이 조금이라도 있으면** boilerplate를 반입해 둔다(아니면 나중에 `rm -rf web`):
```bash
cd <과제 루트>
git clone --depth 1 https://github.com/nailegg/web_boilerplate.git web   # 대상 이름 web 필수
bash web/scripts/exam-init.sh --install
```
Terminal 3에서 `cd <과제 루트>/web && pnpm dev`, 내부 Browser에서 `/login` → `admin@example.com` / `admin12345` → `/admin` 확인. 로그인 후 `/login`으로 되돌아오면 `web/.env`에 `COOKIE_SAMESITE="none"`, `COOKIE_SECURE="true"` 추가 후 재시작.
- 설치가 5분 넘게 실패하면 `rm -rf web`, 지정 스택이나 결과물 경로로 간다.
- P0 결과가 "boilerplate 아니오"면 `rm -rf web`, DECISIONS 반입 줄을 지운다.

**결과물·CLI 가능성이 높으면** 런타임 확인 결과(python, pandas, 솔버 유무)를 메모해 §10에 적게 한다. `~/finals/snippets/`가 py·ts 둘 다 있으므로 어느 쪽이든 간다.

## T+15 · 사람: 계약 확정 (3분)

`prompts/P0_contract.md` 하단 체크. 끝나면:
- §10에 `~/finals/shapes/<형태>.md`와(선택) `~/finals/domain/scenarios/S0n.md` 경로를 적는다. shape 선택은 `README.md`의 판별표.
- 부록 복사: `cp ~/finals/contract/addenda/<부록>.md ./` (DATA_CONTRACT는 `DATA_QUALITY.md`로).
- `DECISIONS.md`에 `T+15 | 계약 | 확정 | shape=<이름>` 한 줄.
- 보조 세션이 필요하면(shape 문서의 조건) Terminal 2에서 `prompts/specialists/` 프롬프트로 띄운다. 10분 뒤 결과 파일만 남기고 닫는다.

## T+15~255 · P1 → P2 → P3 반복

프롬프트 파일을 순서대로 쓴다. 사람이 할 일:
- P2 첫 결과가 나오면 **직접 실행하거나 화면을 연다.** 에이전트 보고만 믿지 않는다.
- T+120, T+200에 중간 보고를 요청하고, 시간이 부족하면 어떤 AC를 줄일지 결정해 CONTRACT §7·§8을 고치고 DECISIONS에 남긴다.
- 점심 5분 전 P4 중단, 복귀 후 P4 재개. 서버와 플랫폼 세션을 확인한다.
- 접속이 끊기면 `prompts/P4_checkpoint.md` 하단과 `checklists/recovery.md`.

## T+255~330 · 감사 → 문서 → 제출

P5, P6 순서. 사람은 `checklists/grading_2h.md`로 대조하고 `checklists/submission.md`로 제출한다. T+305(15:35)에는 제출 절차에 들어간다. 마지막 25분은 버퍼다.

## 흔한 꼬임과 즉시 처방

| 증상 | 처방 |
|---|---|
| 에이전트가 boilerplate 화면·Item·Job을 과제 기능처럼 확장 | "CONTRACT §7에 없는 기능이다. 삭제하고 check-placeholders 결과를 보고해라." |
| git commit·push·init 시도 | "시험 규정상 git 쓰기 명령은 금지다. 진행 기록은 CONTRACT §0·§7과 DECISIONS.md로 남겨라." |
| `~/finals`나 `web/docs` 전체를 읽으며 토큰 소모 | "§10에 적힌 파일 외의 참고 문서는 내가 지정할 때만 읽는다." |
| 계약과 다른 역할·권한 | "CONTRACT §5 역할표와 현재 권한 검사 코드를 대조해 불일치만 고쳐라." |
| 데이터 값 하드코딩 | "seed·로더가 제공 파일을 읽도록 바꾸고 하드코딩 값을 grep으로 찾아 제거해라." |
| 출력 파일이 sample과 다름 | "RESULT_FILE.md 스키마와 diff해 컬럼 순서·형식·행 수를 맞춰라. 계산은 바꾸지 마라." |
| `EADDRINUSE` / 3000번 사용 중 | "3000번 서버는 실행 중이다. 재사용하고 종료하지 마라." |
| 화면 전체 500, `Cannot find module './NNN.js'` | Terminal 3에서 Ctrl+C → `rm -rf .next` → `pnpm dev` |
| 새 모델 API만 500 (`reading 'create'`) | 스키마 변경 후 서버 미재시작. Ctrl+C 후 `pnpm dev` |
| 로그인 후 계속 `/login` | `web/.env`에 `COOKIE_SAMESITE="none"`, `COOKIE_SECURE="true"` 후 재시작 |
| AC를 "통과"로 표시했는데 명령이 없다 | "검증 명령 없이 상태를 바꾸지 마라. 명령을 적고 실행한 뒤 결과대로 표시해라." |
| 모델 capacity·API 오류, 접속 끊김 | `checklists/recovery.md`. 세션이 바뀌면 `prompts/P4_checkpoint.md` 재개 프롬프트 |
| 과제 README가 커밋을 명시적으로 요구 | README 우선. 요구 범위에서만 커밋, push는 하지 않음, DECISIONS 기록 |
