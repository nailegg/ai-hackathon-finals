/**
 * greedy_assign: 항상 feasible한 baseline 두 가지.
 * (a) greedySchedule: 우선순위·납기 순으로 가장 빨리 비는 적격 설비에 배치(정비 구간 회피)
 * (b) greedyCapacityAssign: 수요 있는 항목을 용량 남은 bin에 비용 최소/여유 최대 순 배정
 * 사용 예:
 *   const sched = greedySchedule(problem);          // validate_schedule.ts 로 검증
 *   const res = greedyCapacityAssign(items, bins, cost);
 *   validateAssignment(items, bins, res.assignment); // [] 이면 통과
 */
type Step = { id: string; eligibleTools: string[]; duration: number };
type Job = { id: string; steps: Step[]; release: number; due: number; priority: number };
type Tool = { id: string; unavailable: [number, number][] };
export type Problem = { jobs: Job[]; tools: Tool[] };
export type Assignment = { jobId: string; stepId: string; toolId: string; start: number; end: number };
export type Item = { id: string; demand: number };
export type Bin = { id: string; capacity: number };
export type CostMatrix = Record<string, Record<string, number>>;

function earliestStart(busy: [number, number][], unavailable: [number, number][], ready: number, duration: number): number {
  const blocks = [...busy, ...unavailable].sort((a, b) => a[0] - b[0]);
  let t = ready, changed = true;
  while (changed) {
    changed = false;
    for (const [s, e] of blocks) if (t < e && s < t + duration) { t = e; changed = true; }
  }
  return t;
}

export function greedySchedule(problem: Problem, order: "priority_edd" | "edd" = "priority_edd"): Assignment[] {
  const tools = new Map(problem.tools.map((t) => [t.id, t]));
  const busy = new Map<string, [number, number][]>(problem.tools.map((t) => [t.id, []]));
  const jobs = [...problem.jobs].sort((a, b) =>
    order === "priority_edd" ? (b.priority - a.priority) || (a.due - b.due) || (a.release - b.release) : (a.due - b.due) || (a.release - b.release));
  const schedule: Assignment[] = [];
  for (const job of jobs) {
    let ready = job.release ?? 0;
    for (const step of job.steps) {
      let best: { st: number; tid: string } | null = null;
      for (const tid of step.eligibleTools) {
        const tool = tools.get(tid);
        if (!tool) continue;
        const st = earliestStart(busy.get(tid) ?? [], tool.unavailable, ready, step.duration);
        if (!best || st < best.st) best = { st, tid };
      }
      if (!best) throw new Error(`no eligible tool for ${job.id}/${step.id}`);
      const en = best.st + step.duration;
      busy.get(best.tid)!.push([best.st, en]);
      schedule.push({ jobId: job.id, stepId: step.id, toolId: best.tid, start: best.st, end: en });
      ready = en;
    }
  }
  return schedule;
}

export function greedyCapacityAssign(items: Item[], bins: Bin[], cost?: CostMatrix): { assignment: Record<string, string>; unassigned: string[] } {
  const remaining = new Map(bins.map((b) => [b.id, b.capacity]));
  const assignment: Record<string, string> = {}; const unassigned: string[] = [];
  for (const it of [...items].sort((a, b) => b.demand - a.demand)) {
    const cands = bins.filter((b) => (remaining.get(b.id) ?? 0) >= it.demand);
    if (!cands.length) { unassigned.push(it.id); continue; }
    cands.sort((a, b) => cost
      ? (cost[it.id]?.[a.id] ?? Infinity) - (cost[it.id]?.[b.id] ?? Infinity)
      : (remaining.get(b.id) ?? 0) - (remaining.get(a.id) ?? 0));
    assignment[it.id] = cands[0].id;
    remaining.set(cands[0].id, (remaining.get(cands[0].id) ?? 0) - it.demand);
  }
  return { assignment, unassigned };
}

export function validateAssignment(items: Item[], bins: Bin[], assignment: Record<string, string>): { code: string; detail: string }[] {
  const cap = new Map(bins.map((b) => [b.id, b.capacity]));
  const load = new Map(bins.map((b) => [b.id, 0]));
  const out: { code: string; detail: string }[] = [];
  for (const it of items) {
    const b = assignment[it.id];
    if (b === undefined) out.push({ code: "UNASSIGNED", detail: it.id });
    else if (!cap.has(b)) out.push({ code: "UNKNOWN_BIN", detail: `${it.id}->${b}` });
    else load.set(b, (load.get(b) ?? 0) + it.demand);
  }
  for (const [b, l] of load) if (l > (cap.get(b) ?? 0)) out.push({ code: "OVER_CAPACITY", detail: `${b} ${l}>${cap.get(b)}` });
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("greedy_assign.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const problem: Problem = {
    jobs: [
      { id: "L1", release: 0, due: 10, priority: 2, steps: [{ id: "s1", eligibleTools: ["T1"], duration: 4 }, { id: "s2", eligibleTools: ["T2"], duration: 3 }] },
      { id: "L2", release: 2, due: 8, priority: 1, steps: [{ id: "s1", eligibleTools: ["T1", "T2"], duration: 2 }] },
      { id: "L3", release: 0, due: 20, priority: 3, steps: [{ id: "s1", eligibleTools: ["T1"], duration: 5 }] },
    ],
    tools: [{ id: "T1", unavailable: [[5, 7]] }, { id: "T2", unavailable: [] }],
  };
  const sched = greedySchedule(problem);
  assert(sched.length === 4, "len");
  // 최소 검사(정식 검사는 validate_schedule.ts)
  const perTool = new Map<string, Assignment[]>();
  for (const a of sched) {
    const job = problem.jobs.find((j) => j.id === a.jobId)!, step = job.steps.find((s) => s.id === a.stepId)!;
    assert(step.eligibleTools.includes(a.toolId) && a.start >= job.release, "eligible/release");
    for (const [ms, me] of problem.tools.find((t) => t.id === a.toolId)!.unavailable) assert(!(a.start < me && ms < a.end), "maint");
    perTool.set(a.toolId, [...(perTool.get(a.toolId) ?? []), a]);
  }
  for (const items of perTool.values()) { items.sort((x, y) => x.start - y.start); for (let i = 1; i < items.length; i++) assert(items[i].start >= items[i - 1].end, "overlap"); }
  const l3 = sched.find((a) => a.jobId === "L3")!; assert(l3.start === 0 && l3.end === 5, "L3 first");
  const l1 = sched.find((a) => a.jobId === "L1" && a.stepId === "s1")!; assert(l1.start === 7, `L1 skips maintenance, got ${l1.start}`);

  const items: Item[] = [{ id: "a", demand: 3 }, { id: "b", demand: 2 }, { id: "c", demand: 4 }];
  const bins: Bin[] = [{ id: "B1", capacity: 5 }, { id: "B2", capacity: 5 }];
  const res = greedyCapacityAssign(items, bins);
  assert(res.unassigned.length === 0 && validateAssignment(items, bins, res.assignment).length === 0, "assign");
  assert(validateAssignment(items, bins, { a: "B2", b: "B2", c: "B2" }).map((v) => v.code).join() === "OVER_CAPACITY", "over");
  console.log("OK greedy_assign");
}
