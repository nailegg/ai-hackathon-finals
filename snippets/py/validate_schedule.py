"""validate_schedule: 스케줄 hard constraint 독립 검증기 + KPI.

용도: 솔버·greedy가 만든 스케줄이 제약을 지키는지 솔버와 무관하게 다시 검사한다.
입력:
  problem = {"jobs": [{"id", "steps": [{"id", "eligibleTools": [...], "duration"}],
                       "release", "due", "priority"}],
             "tools": [{"id", "unavailable": [[start, end], ...]}]}
  schedule = [{"jobId", "stepId", "toolId", "start", "end"}]
출력: {"violations": [{"code", "jobId", "stepId", "toolId", "detail"}], "kpis": {...}}
사용 예:
  from validate_schedule import validate_schedule
  r = validate_schedule(problem, schedule)
  assert not r["violations"], r["violations"]
"""

CODES = ("MISSING_STEP", "TOOL_NOT_ELIGIBLE", "OVERLAP_ON_TOOL", "PRECEDENCE",
         "BEFORE_RELEASE", "IN_MAINTENANCE", "DURATION_MISMATCH",
         "DUPLICATE_ASSIGNMENT", "UNKNOWN_JOB_STEP", "UNKNOWN_TOOL", "END_BEFORE_START")


def _v(code, job_id=None, step_id=None, tool_id=None, detail=""):
    return {"code": code, "jobId": job_id, "stepId": step_id, "toolId": tool_id, "detail": detail}


def validate_schedule(problem, schedule):
    violations = []
    tools = {t["id"]: t for t in problem["tools"]}
    known = {(j["id"], st["id"]) for j in problem["jobs"] for st in j["steps"]}
    by_key = {}
    for a in schedule:
        by_key.setdefault((a["jobId"], a["stepId"]), []).append(a)
    # 모든 배정을 개별 검사: 미등록 작업, 미등록 설비, 음수 길이, 중복
    for a in schedule:
        if (a["jobId"], a["stepId"]) not in known:
            violations.append(_v("UNKNOWN_JOB_STEP", a["jobId"], a["stepId"], a["toolId"]))
        if a["toolId"] not in tools:
            violations.append(_v("UNKNOWN_TOOL", a["jobId"], a["stepId"], a["toolId"]))
        if a["end"] < a["start"]:
            violations.append(_v("END_BEFORE_START", a["jobId"], a["stepId"], a["toolId"],
                                 f"end {a['end']} < start {a['start']}"))
    for (jid, sid), items in by_key.items():
        if len(items) > 1:
            violations.append(_v("DUPLICATE_ASSIGNMENT", jid, sid, None, f"{len(items)} assignments"))

    for job in problem["jobs"]:
        prev_end = None
        for step in job["steps"]:
            assigns = by_key.get((job["id"], step["id"]), [])
            if not assigns:
                violations.append(_v("MISSING_STEP", job["id"], step["id"]))
                prev_end = None
                continue
            for a in assigns:  # 중복 배정도 각각 검사
                if a["toolId"] not in step["eligibleTools"]:
                    violations.append(_v("TOOL_NOT_ELIGIBLE", job["id"], step["id"], a["toolId"]))
                if a["end"] - a["start"] != step["duration"]:
                    violations.append(_v("DURATION_MISMATCH", job["id"], step["id"], a["toolId"],
                                         f"{a['end'] - a['start']} != {step['duration']}"))
                if a["start"] < job.get("release", 0):
                    violations.append(_v("BEFORE_RELEASE", job["id"], step["id"], a["toolId"]))
                if prev_end is not None and a["start"] < prev_end:
                    violations.append(_v("PRECEDENCE", job["id"], step["id"], a["toolId"],
                                         f"start {a['start']} < prev end {prev_end}"))
                tool = tools.get(a["toolId"])
                for (ms, me) in (tool or {}).get("unavailable", []):
                    if a["start"] < me and ms < a["end"]:
                        violations.append(_v("IN_MAINTENANCE", job["id"], step["id"], a["toolId"],
                                             f"overlaps [{ms},{me})"))
            prev_end = max(x["end"] for x in assigns)

    per_tool = {}
    for a in schedule:
        per_tool.setdefault(a["toolId"], []).append(a)
    for tool_id, items in per_tool.items():
        items.sort(key=lambda x: x["start"])
        for p, q in zip(items, items[1:]):
            if q["start"] < p["end"]:
                violations.append(_v("OVERLAP_ON_TOOL", q["jobId"], q["stepId"], tool_id,
                                     f"with {p['jobId']}/{p['stepId']}"))

    return {"violations": violations, "kpis": compute_kpis(problem, schedule)}


def compute_kpis(problem, schedule):
    makespan = max((a["end"] for a in schedule), default=0)
    total = weighted = 0.0
    late = 0
    for job in problem["jobs"]:
        ends = [a["end"] for a in schedule if a["jobId"] == job["id"]]
        if not ends:
            continue
        tard = max(0, max(ends) - job.get("due", float("inf")))
        total += tard
        weighted += tard * job.get("priority", 1)
        late += 1 if tard > 0 else 0
    return {"makespan": makespan, "totalTardiness": total,
            "weightedTardiness": weighted, "lateJobs": late}


if __name__ == "__main__":
    problem = {
        "jobs": [
            {"id": "L1", "release": 0, "due": 10, "priority": 2,
             "steps": [{"id": "s1", "eligibleTools": ["T1"], "duration": 4},
                       {"id": "s2", "eligibleTools": ["T2"], "duration": 3}]},
            {"id": "L2", "release": 2, "due": 8, "priority": 1,
             "steps": [{"id": "s1", "eligibleTools": ["T1", "T2"], "duration": 2}]},
        ],
        "tools": [{"id": "T1", "unavailable": [[6, 8]]}, {"id": "T2", "unavailable": []}],
    }
    good = [
        {"jobId": "L1", "stepId": "s1", "toolId": "T1", "start": 0, "end": 4},
        {"jobId": "L1", "stepId": "s2", "toolId": "T2", "start": 4, "end": 7},
        {"jobId": "L2", "stepId": "s1", "toolId": "T1", "start": 4, "end": 6},
    ]
    r = validate_schedule(problem, good)
    assert r["violations"] == [], r["violations"]
    assert r["kpis"] == {"makespan": 7, "totalTardiness": 0, "weightedTardiness": 0, "lateJobs": 0}

    bad = [
        {"jobId": "L1", "stepId": "s1", "toolId": "T2", "start": 0, "end": 4},   # not eligible
        {"jobId": "L1", "stepId": "s2", "toolId": "T2", "start": 3, "end": 6},   # precedence + overlap
        {"jobId": "L2", "stepId": "s1", "toolId": "T1", "start": 1, "end": 2},   # before release, duration
    ]
    codes = sorted(v["code"] for v in validate_schedule(problem, bad)["violations"])
    assert codes == ["BEFORE_RELEASE", "DURATION_MISMATCH", "OVERLAP_ON_TOOL", "PRECEDENCE", "TOOL_NOT_ELIGIBLE"], codes

    maint = [{"jobId": "L2", "stepId": "s1", "toolId": "T1", "start": 7, "end": 9}]
    codes = sorted(v["code"] for v in validate_schedule(problem, maint)["violations"])
    assert "IN_MAINTENANCE" in codes and codes.count("MISSING_STEP") == 2, codes
    # 회귀: 중복 배정 + 미등록 작업(GHOST) + 미등록 설비(T9) + end<start
    ghost = good + [
        {"jobId": "L1", "stepId": "s1", "toolId": "T1", "start": 8, "end": 12},   # duplicate
        {"jobId": "GHOST", "stepId": "s1", "toolId": "T9", "start": 5, "end": 3},  # unknown job/tool, end<start
    ]
    codes = [v["code"] for v in validate_schedule(problem, ghost)["violations"]]
    for c in ("DUPLICATE_ASSIGNMENT", "UNKNOWN_JOB_STEP", "UNKNOWN_TOOL", "END_BEFORE_START"):
        assert c in codes, (c, codes)
    print("OK validate_schedule")
