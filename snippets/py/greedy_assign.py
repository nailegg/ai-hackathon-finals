"""greedy_assign: 항상 feasible한 baseline 두 가지.

용도: (a) list scheduling greedy: 작업을 우선순위·납기 순으로 가장 빨리 비는 적격 설비에 배치
      (b) 용량 제약 배정: 수요가 있는 항목을 용량이 남은 bin에 비용 최소/가까운 순으로 배정
입력 (a): validate_schedule 과 같은 problem 형식. 출력: schedule 리스트
입력 (b): items=[{"id","demand"}], bins=[{"id","capacity"}], cost[item_id][bin_id] (선택)
출력 (b): {"assignment": {item_id: bin_id}, "unassigned": [...]}
사용 예:
  sched = greedy_schedule(problem)              # 그 다음 validate_schedule 로 검증
  res = greedy_capacity_assign(items, bins, cost)
  assert validate_assignment(items, bins, res["assignment"]) == []
"""


def _earliest_start(tool_busy, unavailable, ready, duration):
    """tool_busy: [(start,end)] 정렬 무관. ready 이후 duration 만큼 비는 가장 이른 시각."""
    blocks = sorted(list(tool_busy) + [tuple(u) for u in unavailable])
    t = ready
    changed = True
    while changed:
        changed = False
        for s, e in blocks:
            if t < e and s < t + duration:
                t = e
                changed = True
    return t


def greedy_schedule(problem, order="priority_edd"):
    tools = {t["id"]: t for t in problem["tools"]}
    busy = {tid: [] for tid in tools}
    jobs = list(problem["jobs"])
    if order == "priority_edd":
        jobs.sort(key=lambda j: (-j.get("priority", 1), j.get("due", 0), j.get("release", 0)))
    else:
        jobs.sort(key=lambda j: (j.get("due", 0), j.get("release", 0)))
    schedule = []
    for job in jobs:
        ready = job.get("release", 0)
        for step in job["steps"]:
            best = None
            for tid in step["eligibleTools"]:
                if tid not in tools:
                    continue
                st = _earliest_start(busy[tid], tools[tid].get("unavailable", []), ready, step["duration"])
                if best is None or st < best[0]:
                    best = (st, tid)
            if best is None:
                raise ValueError(f"no eligible tool for {job['id']}/{step['id']}")
            st, tid = best
            en = st + step["duration"]
            busy[tid].append((st, en))
            schedule.append({"jobId": job["id"], "stepId": step["id"], "toolId": tid, "start": st, "end": en})
            ready = en
    return schedule


def greedy_capacity_assign(items, bins, cost=None):
    remaining = {b["id"]: b["capacity"] for b in bins}
    assignment, unassigned = {}, []
    for it in sorted(items, key=lambda x: -x["demand"]):   # 큰 수요부터 (first-fit decreasing)
        cands = [b for b in bins if remaining[b["id"]] >= it["demand"]]
        if not cands:
            unassigned.append(it["id"])
            continue
        if cost:
            cands.sort(key=lambda b: cost.get(it["id"], {}).get(b["id"], float("inf")))
        else:
            cands.sort(key=lambda b: -remaining[b["id"]])   # 가장 여유 있는 bin
        chosen = cands[0]["id"]
        assignment[it["id"]] = chosen
        remaining[chosen] -= it["demand"]
    return {"assignment": assignment, "unassigned": unassigned}


def validate_assignment(items, bins, assignment):
    """위반 목록 반환: OVER_CAPACITY, UNKNOWN_BIN, UNASSIGNED."""
    cap = {b["id"]: b["capacity"] for b in bins}
    load = {b["id"]: 0 for b in bins}
    out = []
    for it in items:
        b = assignment.get(it["id"])
        if b is None:
            out.append({"code": "UNASSIGNED", "item": it["id"]})
        elif b not in cap:
            out.append({"code": "UNKNOWN_BIN", "item": it["id"], "bin": b})
        else:
            load[b] += it["demand"]
    for b, l in load.items():
        if l > cap[b]:
            out.append({"code": "OVER_CAPACITY", "bin": b, "load": l, "capacity": cap[b]})
    return out


def _check_schedule_min(problem, schedule):
    """자가 테스트용 최소 검사(정식 검사는 validate_schedule.py)."""
    tools = {t["id"]: t for t in problem["tools"]}
    for job in problem["jobs"]:
        prev = job.get("release", 0)
        for step in job["steps"]:
            a = next(x for x in schedule if x["jobId"] == job["id"] and x["stepId"] == step["id"])
            assert a["toolId"] in step["eligibleTools"] and a["start"] >= prev
            for ms, me in tools[a["toolId"]].get("unavailable", []):
                assert not (a["start"] < me and ms < a["end"])
            prev = a["end"]
    per = {}
    for a in schedule:
        per.setdefault(a["toolId"], []).append((a["start"], a["end"]))
    for v in per.values():
        v.sort()
        for p, q in zip(v, v[1:]):
            assert q[0] >= p[1]


if __name__ == "__main__":
    problem = {
        "jobs": [
            {"id": "L1", "release": 0, "due": 10, "priority": 2,
             "steps": [{"id": "s1", "eligibleTools": ["T1"], "duration": 4},
                       {"id": "s2", "eligibleTools": ["T2"], "duration": 3}]},
            {"id": "L2", "release": 2, "due": 8, "priority": 1,
             "steps": [{"id": "s1", "eligibleTools": ["T1", "T2"], "duration": 2}]},
            {"id": "L3", "release": 0, "due": 20, "priority": 3,
             "steps": [{"id": "s1", "eligibleTools": ["T1"], "duration": 5}]},
        ],
        "tools": [{"id": "T1", "unavailable": [[5, 7]]}, {"id": "T2", "unavailable": []}],
    }
    sched = greedy_schedule(problem)
    assert len(sched) == 4
    _check_schedule_min(problem, sched)
    l3 = next(a for a in sched if a["jobId"] == "L3")
    assert l3["start"] == 0 and l3["end"] == 5          # 최우선, 정비 전 완료
    l1 = next(a for a in sched if a["jobId"] == "L1" and a["stepId"] == "s1")
    assert l1["start"] == 7                               # 정비 구간 건너뜀

    items = [{"id": "a", "demand": 3}, {"id": "b", "demand": 2}, {"id": "c", "demand": 4}]
    bins = [{"id": "B1", "capacity": 5}, {"id": "B2", "capacity": 5}]
    res = greedy_capacity_assign(items, bins)
    assert res["unassigned"] == [] and validate_assignment(items, bins, res["assignment"]) == []
    bad = {"a": "B2", "b": "B2", "c": "B2"}
    assert [v["code"] for v in validate_assignment(items, bins, bad)] == ["OVER_CAPACITY"]
    print("OK greedy_assign")
