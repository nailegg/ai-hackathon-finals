/**
 * validate_schedule: 스케줄 hard constraint 독립 검증기 + KPI.
 * 용도: 솔버·greedy 결과를 솔버와 무관하게 다시 검사한다.
 * 입력: Problem(jobs/steps/tools), Schedule(Assignment[])
 * 출력: { violations: Violation[], kpis }
 * 사용 예:
 *   import { validateSchedule } from "./validate_schedule";
 *   const r = validateSchedule(problem, schedule);
 *   if (r.violations.length) throw new Error(JSON.stringify(r.violations));
 */
export type Step = { id: string; eligibleTools: string[]; duration: number };
export type Job = { id: string; steps: Step[]; release: number; due: number; priority: number };
export type Tool = { id: string; unavailable: [number, number][] };
export type Problem = { jobs: Job[]; tools: Tool[] };
export type Assignment = { jobId: string; stepId: string; toolId: string; start: number; end: number };
export type Code = "MISSING_STEP" | "TOOL_NOT_ELIGIBLE" | "OVERLAP_ON_TOOL" | "PRECEDENCE"
  | "BEFORE_RELEASE" | "IN_MAINTENANCE" | "DURATION_MISMATCH";
export type Violation = { code: Code; jobId?: string; stepId?: string; toolId?: string; detail?: string };
export type Kpis = { makespan: number; totalTardiness: number; weightedTardiness: number; lateJobs: number };

export function computeKpis(problem: Problem, schedule: Assignment[]): Kpis {
  const makespan = schedule.reduce((m, a) => Math.max(m, a.end), 0);
  let total = 0, weighted = 0, late = 0;
  for (const job of problem.jobs) {
    const ends = schedule.filter((a) => a.jobId === job.id).map((a) => a.end);
    if (!ends.length) continue;
    const tard = Math.max(0, Math.max(...ends) - job.due);
    total += tard; weighted += tard * (job.priority ?? 1); if (tard > 0) late++;
  }
  return { makespan, totalTardiness: total, weightedTardiness: weighted, lateJobs: late };
}

export function validateSchedule(problem: Problem, schedule: Assignment[]): { violations: Violation[]; kpis: Kpis } {
  const violations: Violation[] = [];
  const tools = new Map(problem.tools.map((t) => [t.id, t]));
  const byKey = new Map<string, Assignment>();
  for (const a of schedule) if (!byKey.has(`${a.jobId}|${a.stepId}`)) byKey.set(`${a.jobId}|${a.stepId}`, a);

  for (const job of problem.jobs) {
    let prevEnd: number | null = null;
    for (const step of job.steps) {
      const a = byKey.get(`${job.id}|${step.id}`);
      if (!a) { violations.push({ code: "MISSING_STEP", jobId: job.id, stepId: step.id }); prevEnd = null; continue; }
      const base = { jobId: job.id, stepId: step.id, toolId: a.toolId };
      if (!step.eligibleTools.includes(a.toolId)) violations.push({ code: "TOOL_NOT_ELIGIBLE", ...base });
      if (a.end - a.start !== step.duration) violations.push({ code: "DURATION_MISMATCH", ...base, detail: `${a.end - a.start} != ${step.duration}` });
      if (a.start < (job.release ?? 0)) violations.push({ code: "BEFORE_RELEASE", ...base });
      if (prevEnd !== null && a.start < prevEnd) violations.push({ code: "PRECEDENCE", ...base, detail: `start ${a.start} < prev end ${prevEnd}` });
      for (const [ms, me] of tools.get(a.toolId)?.unavailable ?? []) {
        if (a.start < me && ms < a.end) violations.push({ code: "IN_MAINTENANCE", ...base, detail: `overlaps [${ms},${me})` });
      }
      prevEnd = a.end;
    }
  }
  const perTool = new Map<string, Assignment[]>();
  for (const a of schedule) perTool.set(a.toolId, [...(perTool.get(a.toolId) ?? []), a]);
  for (const [toolId, items] of perTool) {
    items.sort((x, y) => x.start - y.start);
    for (let i = 1; i < items.length; i++) {
      const p = items[i - 1], q = items[i];
      if (q.start < p.end) violations.push({ code: "OVERLAP_ON_TOOL", jobId: q.jobId, stepId: q.stepId, toolId, detail: `with ${p.jobId}/${p.stepId}` });
    }
  }
  return { violations, kpis: computeKpis(problem, schedule) };
}

if (process.argv[1] && process.argv[1].endsWith("validate_schedule.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const problem: Problem = {
    jobs: [
      { id: "L1", release: 0, due: 10, priority: 2, steps: [{ id: "s1", eligibleTools: ["T1"], duration: 4 }, { id: "s2", eligibleTools: ["T2"], duration: 3 }] },
      { id: "L2", release: 2, due: 8, priority: 1, steps: [{ id: "s1", eligibleTools: ["T1", "T2"], duration: 2 }] },
    ],
    tools: [{ id: "T1", unavailable: [[6, 8]] }, { id: "T2", unavailable: [] }],
  };
  const good: Assignment[] = [
    { jobId: "L1", stepId: "s1", toolId: "T1", start: 0, end: 4 },
    { jobId: "L1", stepId: "s2", toolId: "T2", start: 4, end: 7 },
    { jobId: "L2", stepId: "s1", toolId: "T1", start: 4, end: 6 },
  ];
  const r = validateSchedule(problem, good);
  assert(r.violations.length === 0, JSON.stringify(r.violations));
  assert(JSON.stringify(r.kpis) === JSON.stringify({ makespan: 7, totalTardiness: 0, weightedTardiness: 0, lateJobs: 0 }), "kpis");
  const bad: Assignment[] = [
    { jobId: "L1", stepId: "s1", toolId: "T2", start: 0, end: 4 },
    { jobId: "L1", stepId: "s2", toolId: "T2", start: 3, end: 6 },
    { jobId: "L2", stepId: "s1", toolId: "T1", start: 1, end: 2 },
  ];
  const codes = validateSchedule(problem, bad).violations.map((v) => v.code).sort();
  assert(codes.join() === "BEFORE_RELEASE,DURATION_MISMATCH,OVERLAP_ON_TOOL,PRECEDENCE,TOOL_NOT_ELIGIBLE", codes.join());
  const maint = validateSchedule(problem, [{ jobId: "L2", stepId: "s1", toolId: "T1", start: 7, end: 9 }]).violations.map((v) => v.code);
  assert(maint.includes("IN_MAINTENANCE") && maint.filter((c) => c === "MISSING_STEP").length === 2, maint.join());
  console.log("OK validate_schedule");
}
