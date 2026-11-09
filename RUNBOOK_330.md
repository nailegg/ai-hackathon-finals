# 본선 런북 — 330분, T+0부터 제출까지

> **이 문서는 사람이 읽는다. 시험 당일 여는 유일한 문서다.** 위에서부터 순서대로 따라가면 된다. 에이전트에게 줄 글은 모두 `prompts/P0~P6` 파일에 있고, 여기서는 "언제 어느 파일을 붙여 넣는지"만 말한다. 다른 문서는 이 런북이 열라고 하거나 `CONTRACT.md` §10에 경로를 적을 때만 연다.

---

## 0. 처음 읽는 사람을 위한 개요 (시험장에서는 건너뛴다)

### 하루가 어떻게 흘러가나

1. **준비(5분).** 과제 폴더에 세 파일(`AGENTS.md`, `CONTRACT.md`, `DECISIONS.md`)을 복사하고, 원본 파일의 해시를 떠 둔다.
2. **계약(20분).** 에이전트가 과제 README를 읽고 `CONTRACT.md` 초안을 쓴다(P0). 데이터가 있으면 데이터 프로파일도 쓴다(P1). 사람은 초안을 검토하고 "확정"한다. 이때 어떤 **형태(shape)**의 과제인지 정하고, 에이전트가 참고할 문서 경로를 §10에 적는다.
3. **구현(약 230분).** 에이전트가 수용 기준(AC)을 하나씩 수직으로 완성한다(P2, P3). AC 하나가 끝날 때마다 검증 스크립트를 돌려 통과한 것만 "통과"로 표시한다. 점심 전후로 상태를 파일에 저장하고 복구한다(P4).
4. **감사와 제출(75분).** 기능 추가를 멈추고 제출물을 감사한다(P5). 제출 문서를 쓴다(P6). 마지막 25분에 제출한다.

### 누가 무엇을 하나

| | 사람(응시자) | 에이전트(Terminal 1) |
|---|---|---|
| 결정 | 계약 확정, 형태 선택, 범위 조정, 카드 사용 여부 | 결정하지 않는다. 모호하면 §9 가정으로 등록하고 진행 |
| 쓰기 | `CONTRACT.md` §1~§8 본문, §10의 참고 문서 경로 | `CONTRACT.md` 초안 전체(P0·P1), 확정 뒤에는 §0·§4·§7 상태·§9·§10 런타임 줄만. 코드 전부 |
| 검증 | T+120·T+200에 `bash verify_fast.sh`를 직접 실행 | AC마다 `bash verify_fast.sh`, P5에서 `bash verify_full.sh` |
| 기록 | `DECISIONS.md`에 결정 한 줄씩 | `DECISIONS.md`에 AC 완료·가정 한 줄씩, §0 상태판 갱신 |

### 이 런북에 나오는 말

| 말 | 뜻 |
|---|---|
| **과제 루트** | 플랫폼이 준 과제 폴더. README와 데이터가 있는 곳. 에이전트는 여기서 시작한다 |
| **`~/finals`** | 이 저장소를 clone한 곳. 과제 루트 **밖**이다. 제출물에 섞이지 않는다 |
| **CONTRACT, §n** | 과제 루트의 `CONTRACT.md`와 그 절 번호. §0 상태판, §4 데이터 계약, §7 수용 기준, §9 가정, §10 구현 기반 결정이 자주 나온다 |
| **AC** | 수용 기준(Acceptance Criteria). §7에 5~8개. "채점자가 명령이나 화면으로 확인할 수 있는 문장" 하나가 AC 하나다. AC1이 가장 중요한 사용자 여정이다 |
| **shape(형태)** | 과제의 작업 형태 8가지(웹 풀스택, 최적화, 데이터 분석·ML, RAG, ETL, 시뮬레이션, 코드 수리, unknown). 형태마다 산출물·검증·시간 배분이 다르므로 `~/finals/shapes/<이름>.md`에 절차가 적혀 있다. **주 shape**는 채점자가 확인할 산출물을 결정하는 형태, **계산 shape**는 그 안의 계산·검색 형태다(예: 역할 웹 + 일정 최적화 = `web_fullstack` + `or_optimization`) |
| **카드** | `~/finals/domain/scenarios/S01~S11.md`. 출제될 법한 도메인 시나리오의 **가설** 11장. 사람이 공부용으로 읽는다. 에이전트에게는 원본을 주지 않고, Baseline·독립 검증·KPI·함정 절만 뽑은 **`CARD_REF.md`**를 과제 루트에 만들어 준다 |
| **부록** | `WEB.md`, `OR_SPEC.md`, `DATA_QUALITY.md` 같은 형태별 세부 문서. 템플릿은 `~/finals/contract/addenda/`에 있고, §10에 적힌 것만 에이전트가 P2 시작 때 과제 루트로 복사해 채운다 |
| **P0~P6** | 단계별 프롬프트 파일 `~/finals/prompts/P?_*.md`. 사람이 열어서 코드 블록 안의 글을 Terminal 1에 붙여 넣는다 |
| **`verify_fast.sh`, `verify_full.sh`** | 에이전트가 P2에서 과제 루트에 만드는 검증 스크립트. fast는 검증기·curl·테스트만 모아 AC마다 수십 초 안에 돈다. full은 fast에 빌드와 깨끗한 재현을 더한 것으로 P5와 제출 전에만 돈다 |
| **보조 세션** | Terminal 2에서 사람이 띄우는 두 번째 에이전트. 읽기 전용, 결과 파일 1개, 동시 1개, 10분. 프롬프트는 `~/finals/prompts/specialists/` |
| **T+n** | 시작 후 n분. **사람만 쓰는 표기**다. 에이전트는 시작 시각을 모르므로 `CONTRACT.md`와 `DECISIONS.md`에는 실제 시계 시각(HH:MM)만 쓴다 |

### 핵심 원칙 세 가지

1. **계약 먼저, 코드는 나중.** 에이전트가 기반 코드나 데이터 세부를 보기 전에 `CONTRACT.md`로 요구사항·제출물·채점 가설을 고정한다. 이유: 먼저 코드를 보면 코드에 맞춰 요구사항을 해석한다.
2. **상태는 파일에 있다.** 대화 기록은 끊기면 사라진다(2차 예선 실제 사례). `CONTRACT.md` §0 상태판과 `DECISIONS.md`가 진실이고, 새 세션은 그 둘만 읽고 이어 간다.
3. **검증기가 통과한 것만 완료다.** AC 상태는 `bash verify_fast.sh`가 통과할 때만 바뀌고, 제출 전 `bash verify_full.sh`로 한 번 더 확인한다. 심사는 종료 후 2시간 안에 끝나므로, 기계적으로 돌아가는 산출물이 점수다.

### 시험 규정 (2차 예선 기준. 본선 안내가 다르면 안내가 우선)

제공된 에이전트만 사용한다. 개인 API 키와 외부 AI는 금지. 공개 Git 저장소 clone은 허용되지만 **`git commit`·`git push`는 금지**다. 문제와 결과를 외부로 보내지 않는다. 개인 파일 업로드는 불가(그래서 clone으로 가져온다).

---

## 1. 시간표

9:30 시작을 가정했다. 점심 1시간은 당일 안내 시각에 맞춰 옮긴다.

| T+ | 시각 | 누가 | 할 일 | 끝났을 때 있어야 할 것 |
|---|---|---|---|---|
| 0~5 | 9:30 | 사람 | 준비 명령(3절), 제출 방식 확인 | 과제 루트에 `AGENTS.md`·`CONTRACT.md`·`DECISIONS.md`, `/tmp/orig.sha` |
| 5~15 | 9:35 | 에이전트 P0 ‖ 사람 | 계약 초안 ‖ 런타임 확인, 웹 가능성 있으면 boilerplate 반입(4절) | CONTRACT §1~§3, §5~§10 초안 |
| 15~25 | 9:45 | 에이전트 P1 ‖ 사람 | 데이터 계약(데이터 있을 때) ‖ 계약 검토·확정(5절, 최대 10분) | CONTRACT §4, `DATA_QUALITY.md`, `DECISIONS`에 "계약 확정" |
| 25~90 | 9:55 | 에이전트 P2 | AC1 수직 흐름 + `verify_fast.sh` 작성 | AC1 첫 통과. **게이트**: 웹·최적화는 T+90(11:00), 예측 파일·ETL은 T+45(10:15)에 baseline 제출 파일 |
| 90~점심 | 11:00 | 에이전트 P3 | AC2, AC3… 한 번에 하나 | |
| 120 | 11:30 | 사람 | 중간 보고 요청 + `bash verify_fast.sh` 직접 실행 | 범위 조정 결정 |
| 점심 −5 | | 에이전트 P4 중단 | 체크포인트 | §0 갱신, DECISIONS 체크포인트 줄 |
| 점심 +0 | | 에이전트 P4 재개 | `verify_fast.sh` 확인 후 이어서 | |
| 200 | 12:50 | 사람 | 중간 보고 요청 + `bash verify_fast.sh` 직접 실행 | 범위 조정 결정 |
| ~255 | ~14:45 | 에이전트 P3 | 나머지 AC. 필수 AC가 다 끝나면 품질 개선 1건 | |
| 255~285 | 14:45 | 에이전트 P5 | 제출 감사, `bash verify_full.sh`, 깨끗한 재현 | §7 확정, 감사 기록, 증거표 초안 |
| 285~305 | 15:15 | 에이전트 P6 ‖ 사람 | 제출 문서 ‖ 서술형 답 메모 | `SUBMISSION.md` |
| 305~330 | 15:35 | 사람 | 제출(`~/finals/checklists/submission.md`) | 제출 완료 확인 |

- 점심이 T+150(12:00) 근처라면 AC2까지 통과한 상태로 들어가는 것이 목표다. 점심 시각이 다르면 "점심 −5 체크포인트"만 그 시각에 맞춘다.
- 사람이 T+0에 `CONTRACT.md` §0 첫 줄에 시작·점심·종료 시각을 적는다. 에이전트는 그 줄을 보고 남은 시간을 안다.
- **Stop-loss.** 같은 문제에 20분 넘게 막히면 더 단순한 baseline으로 물러난다. UI 디테일이나 모델 튜닝이 30분을 넘기면 검증·제출로 전환한다. 점수가 낮아도 **실행되고, 제약을 지키고, 재현되는** 결과물이 먼저다.

---

## 2. 터미널 배치

| 터미널 | 주인 | 용도 |
|---|---|---|
| Terminal 1 | 에이전트(메인) | 과제 루트에서 시작한다. P0부터 P6까지 한 세션. 끊기면 새 세션에서 P4 재개 프롬프트 |
| Terminal 2 | 사람 | 반입·설치·확인 명령. 보조 세션도 여기서(동시 1개, 10분) |
| Terminal 3 | 사람 또는 에이전트 | 개발 서버 하나(`0.0.0.0:3000`). 한 번 띄우면 닫지 않는다 |

서버는 하나만 둔다. 3000번이 응답하면 재사용하고 죽이지 않는다. 확인 명령:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
```

---

## 3. T+0~5 · 사람: 준비

과제 폴더를 열고 아래를 순서대로 친다. `<과제 루트>`는 README가 있는 폴더다.

```bash
cd <과제 루트>
ls -la                                                     # 과제 원본 확인
git clone --depth 1 https://github.com/nailegg/ai-hackathon-finals.git ~/finals
cp ~/finals/contract/AGENTS.md ./AGENTS.md                 # 이미 있으면 cat >> 로 뒤에 붙인다
cp ~/finals/contract/CONTRACT.md ./CONTRACT.md
cp ~/finals/contract/DECISIONS.md ./DECISIONS.md
node -v; command -v pnpm || echo "no pnpm"; python3 -V; python3 -c "import pandas, sklearn; print('pandas ok')" 2>&1 | tail -1
find . -type f -not -path './.git/*' -not -name 'AGENTS.md' -not -name 'CONTRACT.md' -not -name 'DECISIONS.md' -exec shasum {} + > /tmp/orig.sha   # 원본 해시 (P5에서 대조)
date +%H:%M   # CONTRACT §0 첫 줄에 시작/점심/종료 시각을 적는다
```

각 줄이 하는 일:

| 줄 | 하는 일 | 왜 |
|---|---|---|
| `ls -la` | 과제에 무엇이 들어 있는지 본다 | README 외에 데이터·샘플 출력·기존 코드가 있는지로 형태가 갈린다 |
| `git clone … ~/finals` | 이 키트를 홈 아래에 받는다 | 과제 루트 밖이어야 제출물에 섞이지 않는다 |
| `cp … AGENTS.md` | 에이전트 규칙 파일을 과제 루트에 둔다 | 에이전트는 세션 시작 때 과제 루트의 `AGENTS.md`를 읽는다 |
| `cp … CONTRACT.md`, `DECISIONS.md` | 빈 계약서와 결정 기록을 둔다 | P0가 CONTRACT를 채우고, 모든 결정이 DECISIONS에 쌓인다 |
| `node -v …` | 런타임과 라이브러리 유무를 본다 | 웹(node)인지 분석(python·pandas)인지 갈 수 있는 길을 미리 안다 |
| `find … > /tmp/orig.sha` | 원본 파일의 해시를 떠 둔다 | P5에서 "원본 데이터를 건드리지 않았다"를 증명한다 |
| `date +%H:%M` | 지금 시각을 본다 | 이 시각을 `CONTRACT.md` §0 첫 줄에 적는다 |

주의할 점:

- 과제 루트에 `AGENTS.md`가 **이미 있으면** 덮어쓰지 않는다. `cat ~/finals/contract/AGENTS.md >> AGENTS.md`로 뒤에 붙여 과제 지시가 앞에 오게 한다.
- `AGENTS.md`는 세션 시작 때 읽히므로, **복사를 끝낸 뒤** Terminal 1에서 에이전트를 시작한다.
- **제출 방식을 지금 확인한다.** 폴더 전체 업로드인지, 특정 파일만인지, 용량 제한이 있는지. 플랫폼의 제출 화면이 어디 있는지 찾아 둔다. 마지막 25분에 찾기 시작하면 늦다.
- 홈(`~`)에 쓸 수 없으면 `/tmp/finals`에 clone하고 이후 경로를 그에 맞춰 읽는다.

---

## 4. T+5~15 · 에이전트 P0 ‖ 사람 병렬 작업

**Terminal 1**에서 에이전트를 시작하고 `~/finals/prompts/P0_contract.md`의 코드 블록을 붙여 넣는다. P0는 과제 README만 읽고 `CONTRACT.md` 초안을 쓴다(코드 금지, §4 제외). 약 10분 걸린다.

그동안 사람은 **Terminal 2**에서 다음 둘 중 하나를 한다.

**(가) 웹 서비스 가능성이 조금이라도 있으면** boilerplate를 미리 받아 둔다. 안 쓰게 되면 나중에 지우면 된다.

```bash
cd <과제 루트>
git clone --depth 1 https://github.com/nailegg/web_boilerplate.git web   # 대상 이름 web 필수
bash web/scripts/exam-init.sh --install
```

`exam-init.sh`는 boilerplate의 개발 이력과 유지보수 문서를 지우고, 의존성 설치와 DB 초기화까지 한다. 끝나면 **Terminal 3**에서 `cd <과제 루트>/web && pnpm dev`를 띄우고, 플랫폼 내부 브라우저에서 `/login` → `admin@example.com` / `admin12345` → `/admin`이 열리는지 본다.

- 로그인 뒤 다시 `/login`으로 돌아오면 쿠키 문제다. `web/.env`에 `COOKIE_SAMESITE="none"`, `COOKIE_SECURE="true"`를 추가하고 서버를 재시작한다.
- 설치가 5분 넘게 실패하면 `rm -rf web`. 지정 스택이나 결과물 경로로 간다.
- P0 보고의 §10이 "Boilerplate 사용: 아니오"면 `rm -rf web`, `DECISIONS.md`의 "web/ 반입" 줄을 지운다.

**(나) 결과물·CLI 과제일 가능성이 높으면** 3절에서 본 런타임 확인 결과(python, pandas, 솔버 유무)를 메모해 둔다. 5절에서 §10 런타임 줄에 적게 한다. `~/finals/snippets/`는 py·ts 둘 다 있으므로 어느 런타임이든 간다.

---

## 5. T+15~25 · 사람: 계약 확정 (최대 10분, P1과 병렬)

P0 보고가 오면 아래 순서대로 한다. **순서가 중요하다.** 특히 1번을 2번보다 먼저 해야 에이전트와 같은 파일을 동시에 고치는 일이 없다.

**1. §10에 참고 문서 경로를 적고 저장한다.**
P0 보고의 §10 "형태" 항목을 보고, `~/finals/README.md`의 판별표에서 shape를 고른다. `CONTRACT.md` §10의 다음 줄을 채운다.
- 주 shape: `~/finals/shapes/<이름>.md`
- 계산 shape(있을 때만): 주 shape 안에 다른 형태의 계산·검색이 있으면 하나 더. 예: `web_fullstack` + `or_optimization`, `web_fullstack` + `rag_agent`. 최대 2장. 어느 형태에도 1:1로 맞지 않으면 `unknown` 하나만 적고 계산 shape는 비운다.
- 데이터 체크리스트(데이터 파일이 있을 때): `~/finals/domain/data_checklist.md`. P1이 읽는다. 도메인 지식 없이 검사 순서와 함정만 있어 어떤 데이터에도 해가 없다.
- KPI는 경로를 주지 않는다. README가 지표를 요구하면 `~/finals/domain/kpi_formulas.md`에서 그 행을 찾아 §6 "지표 정의" 줄에 분자·분모·집계 단위를 직접 옮겨 적는다. 이유: 카탈로그를 통째로 받은 에이전트는 요구에 없는 지표까지 만든다. `data_patterns.md`도 사람용이다. P1 보고를 검토할 때 대조만 한다.
저장한다.

**2. 데이터가 있으면 P1을 붙여 넣는다.**
Terminal 1에 `~/finals/prompts/P1_data_profile.md`의 코드 블록을 붙인다. P1은 데이터를 프로파일해 §4와 `DATA_QUALITY.md`를 쓴다. **P1이 도는 동안 `CONTRACT.md`를 저장하지 않는다.** 에이전트가 같은 파일의 §4를 쓰는 중이라 서로 덮어쓴다. 검토하며 고칠 것이 보이면 `DECISIONS.md`나 종이에 적어 두고, P1 보고가 온 뒤 한 번에 반영한다. 데이터가 없으면 이 단계를 건너뛰고 3번으로 간다.

**3. 초안을 검토한다(3분).**
`~/finals/prompts/P0_contract.md` 하단의 "사람 검토 체크"를 따라간다. 요점은 셋이다. §5 역할표가 README와 맞는가. §7 AC1이 정말 가장 중요한 여정인가. §8 "범위 밖"에 필요한 기능이 들어가 있지 않은가. 담당자에게 물을 것이 있으면 지금 묻는다.

**4. 카드를 줄지 정한다.**
카드는 선택이다. 안 줘도 된다.
- 먼저 README와 가장 닮은 카드 하나를 떠올리고, **둘의 차이 3개**(입력 단위, 산출물, 채점 방식)를 `DECISIONS.md`에 한 줄로 적는다. 셋 중 하나라도 핵심적인 차이면 카드를 주지 않는다.
- "닮았다"는 **입력 형식(표·텍스트·이미지·코드)과 산출물이 둘 다 같을 때**만이다.
- 준다면 아래 명령으로 카드의 Baseline·독립 검증·KPI·함정 절만 뽑아 과제 루트에 `CARD_REF.md`를 만들고, §10 "참고 카드 발췌" 줄에 `./CARD_REF.md`를 적는다. `S0n`을 카드 번호로 바꾼다. 카드 원본 경로는 §10에 적지 않는다.

```bash
{ echo '> 카드 발췌. 숫자·상태명·컬럼명·도구명은 예시다. 과제 README와 다르면 README가 맞고, 차이는 CONTRACT §9에 A번호로 적는다.'; echo; sed -n '/^## Baseline/,/^## 화면/{/^## 화면/!p;}' ~/finals/domain/scenarios/S0n.md; } > ./CARD_REF.md
```

**5. 부록 파일명을 확인한다.**
부록은 사람이 복사하지 않는다. P2가 §10 "붙인 부록" 줄을 보고 복사하고 채운다. 사람은 그 줄의 파일명이 `~/finals/contract/addenda/README.md`의 규칙과 맞는지만 본다. 규칙은 "DATA_CONTRACT → `DATA_QUALITY.md`, RAG_EVAL → `EVAL_SET.md`, 나머지는 같은 이름"이다.

**6. "확정"이라고 답한다.**
P1 보고가 왔으면(또는 데이터가 없으면) 메모해 둔 수정을 `CONTRACT.md`에 반영해 저장하고, Terminal 1에 "확정"이라고 답한다. 이 순간부터 에이전트는 §1~§8 본문을 고치지 못한다(머리말 규칙). `DECISIONS.md`에 한 줄 남긴다.

```
HH:MM | 계약 | 확정 | shape=<이름>
```

**7. 보조 세션이 필요하면 띄운다.**
shape 문서의 "보조 세션" 절에 조건이 있다(예: 최적화에서 목적함수가 모호하거나 hard constraint가 3개 이상). 조건에 맞을 때만 Terminal 2에서 `~/finals/prompts/specialists/` 프롬프트로 띄운다. §0 "보조 결과 파일" 칸을 "반영 대기"로 적어 메인이 그 파일을 건드리지 않게 한다. 10분 뒤 결과 파일만 남기고 닫는다.

이 절이 10분을 넘기면, 남은 검토는 §9 가정으로 넘기고 확정한다. 완벽한 계약보다 AC1 첫 통과가 먼저다.

---

## 6. T+25~255 · 에이전트 P2 → P3 반복

확정 직후 Terminal 1에 `~/finals/prompts/P2_slice.md`를 붙인다. P2는 부록을 복사·작성하고, 런타임을 확인하고, AC1 하나를 끝까지(화면 → API → 저장/계산 → 결과) 만들고, `verify_fast.sh`·`verify_full.sh`를 만든다. AC1이 통과하면 `~/finals/prompts/P3_next_ac.md`를 AC마다 반복해서 붙인다.

사람이 이 구간에 하는 일:

- **P2 첫 결과가 나오면 직접 확인한다.** 웹이면 내부 브라우저로 화면을 열고, 결과물이면 명령을 직접 친다. 에이전트의 "통과했다"는 보고만 믿지 않는다.
- **게이트를 지킨다.** 예측 파일·ETL 과제는 T+45(10:15)에 형식이 맞는 baseline 제출 파일이 있어야 한다. 웹·최적화는 T+90(11:00)에 AC1이 통과해야 한다. 못 지키면 범위를 줄인다(§7의 AC를 빼고 §8로 옮긴 뒤 DECISIONS에 기록).
- **T+120, T+200에 중간 점검.** Terminal 1에 중간 보고를 요청한다(`P3_next_ac.md`의 "중간 보고" 문구). 동시에 **Terminal 2에서 `bash verify_fast.sh`를 직접 돌려** 보고와 대조한다. 다르면 §7을 사실대로 고치게 한다. 남은 시간 대비 AC가 많으면 어느 AC를 줄일지 결정한다.
- **점심 5분 전** `~/finals/prompts/P4_checkpoint.md`의 "중단 전" 프롬프트를 붙인다. 서버 터미널은 그대로 둔다. **복귀 후** 플랫폼 접속과 3000번 서버를 확인하고 "재개" 프롬프트를 붙인다.
- **접속이 끊기면** 같은 P4 "재개" 프롬프트를 새 세션에 붙인다. 모델 오류·반복 장애는 `~/finals/checklists/recovery.md`.
- 필수 AC가 모두 통과했고 T+255 전이면, `P3_next_ac.md` 하단의 "품질 개선 1건" 프롬프트를 한 번만 쓴다.

---

## 7. T+255~330 · 감사 → 문서 → 제출

- **T+255(14:45)** Terminal 1에 `~/finals/prompts/P5_audit.md`. 기능 추가를 멈추고 제출물 경로·형식, 깨끗한 재현, `bash verify_full.sh`, 원본 해시 대조, 증거표 초안을 만든다. 사람은 `~/finals/checklists/grading_2h.md`를 열고 보고와 대조한다.
- **T+285(15:15)** `~/finals/prompts/P6_submission.md`. `SUBMISSION.md`를 쓴다. 사람은 서술형 답에 들어갈 내용을 메모한다(무엇을 만들었고, 어떤 가정을 했고, 무엇을 검증했는가).
- **T+305(15:35)** `~/finals/checklists/submission.md`를 따라 제출한다. 마지막 25분은 버퍼다. 이 시점 이후에는 코드를 고치지 않는다.

---

## 8. 흔한 꼬임과 즉시 처방

따옴표 안은 Terminal 1에 그대로 붙여 넣는 말이다.

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
| 새 모델 API만 500 (`reading 'create'`) | 스키마 변경 후 서버를 재시작하지 않은 것. Ctrl+C 후 `pnpm dev` |
| 로그인 후 계속 `/login` | `web/.env`에 `COOKIE_SAMESITE="none"`, `COOKIE_SECURE="true"` 추가 후 재시작 |
| AC를 "통과"로 표시했는데 명령이 없다 | "검증 명령 없이 상태를 바꾸지 마라. 명령을 적고 실행한 뒤 결과대로 표시해라." |
| 에이전트가 AC마다 `pnpm build`를 돌려 느리다 | "AC마다는 verify_fast.sh(검증기·curl·테스트)만. build는 verify_full.sh로 P5에서." |
| 에이전트가 §1~§8 본문을 고쳤다 | "CONTRACT 머리말의 수정 권한 규칙을 읽어라. 그 변경은 되돌리고 DECISIONS에 제안으로 적어라." |
| 에이전트가 CARD_REF의 스키마·상태명을 README보다 우선시 | "CARD_REF.md의 값은 예시다. README와 데이터가 정한 값으로 바꾸고 차이를 §9에 등록해라." |
| 모델 capacity·API 오류, 접속 끊김 | `~/finals/checklists/recovery.md`. 세션이 바뀌면 `~/finals/prompts/P4_checkpoint.md`의 재개 프롬프트 |
| 과제 README가 커밋을 명시적으로 요구 | README 우선. 요구 범위에서만 커밋하고 push는 하지 않는다. DECISIONS에 기록 |
