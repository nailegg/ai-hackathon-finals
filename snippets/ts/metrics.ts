/**
 * metrics: 회귀·분류·랭킹·스케줄 지표 (외부 라이브러리 없음).
 * 용도: baseline 과 개선안을 같은 분할에서 같은 지표로 비교한다.
 * 사용 예:
 *   regressionReport(y, yhat);              // mae, rmse, mape, r2
 *   classificationReport(y, score, 0.5, 10); // precision, recall, f1, confusion, pr_auc, roc_auc, recall@10
 *   scheduleKpis(jobs, schedule);
 */
export const mae = (y: number[], p: number[]) => y.reduce((s, a, i) => s + Math.abs(a - p[i]), 0) / y.length;
export const rmse = (y: number[], p: number[]) => Math.sqrt(y.reduce((s, a, i) => s + (a - p[i]) ** 2, 0) / y.length);
export function mape(y: number[], p: number[]): number {
  const idx = y.map((_, i) => i).filter((i) => y[i] !== 0);
  return idx.length ? (idx.reduce((s, i) => s + Math.abs((y[i] - p[i]) / y[i]), 0) / idx.length) * 100 : NaN;
}
export function r2(y: number[], p: number[]): number {
  const m = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((s, a) => s + (a - m) ** 2, 0) || 1e-12;
  return 1 - y.reduce((s, a, i) => s + (a - p[i]) ** 2, 0) / ssTot;
}
export const regressionReport = (y: number[], p: number[]) => ({ mae: mae(y, p), rmse: rmse(y, p), mape: mape(y, p), r2: r2(y, p), n: y.length });

export type Confusion = { tp: number; fp: number; fn: number; tn: number };
export function confusion(y: number[], pred: number[]): Confusion {
  const c: Confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  y.forEach((a, i) => { const b = pred[i]; if (a === 1 && b === 1) c.tp++; else if (a === 0 && b === 1) c.fp++; else if (a === 1 && b === 0) c.fn++; else c.tn++; });
  return c;
}
export function precisionRecallF1(y: number[], pred: number[]) {
  const c = confusion(y, pred);
  const precision = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0, recall = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
  return { precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, ...c };
}
const byScoreDesc = (score: number[]) => score.map((_, i) => i).sort((a, b) => score[b] - score[a]);

export function prAuc(y: number[], score: number[]): number {
  const totalPos = y.reduce((a, b) => a + b, 0) || 1;
  let tp = 0, fp = 0; const pts: [number, number][] = [[0, 1]];
  for (const i of byScoreDesc(score)) { if (y[i] === 1) tp++; else fp++; pts.push([tp / totalPos, tp / (tp + fp)]); }
  let area = 0;
  for (let i = 1; i < pts.length; i++) area += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2;
  return area;
}
export function rocAuc(y: number[], score: number[]): number {
  const pos = score.filter((_, i) => y[i] === 1), neg = score.filter((_, i) => y[i] === 0);
  if (!pos.length || !neg.length) return NaN;
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}
export const recallAtK = (y: number[], score: number[], k: number) => byScoreDesc(score).slice(0, k).reduce((s, i) => s + y[i], 0) / (y.reduce((a, b) => a + b, 0) || 1);
export const precisionAtK = (y: number[], score: number[], k: number) => byScoreDesc(score).slice(0, k).reduce((s, i) => s + y[i], 0) / k;

export function classificationReport(y: number[], score: number[], threshold = 0.5, k?: number): Record<string, number> {
  const rep: Record<string, number> = { ...precisionRecallF1(y, score.map((s) => (s >= threshold ? 1 : 0))), pr_auc: prAuc(y, score), roc_auc: rocAuc(y, score), positives: y.reduce((a, b) => a + b, 0), n: y.length };
  if (k) { rep[`recall@${k}`] = recallAtK(y, score, k); rep[`precision@${k}`] = precisionAtK(y, score, k); }
  return rep;
}

export function scheduleKpis(jobs: { id: string; due: number; priority?: number }[], schedule: { jobId: string; end: number }[]) {
  const makespan = schedule.reduce((m, a) => Math.max(m, a.end), 0);
  let totalTardiness = 0, weightedTardiness = 0, lateJobs = 0;
  for (const j of jobs) {
    const ends = schedule.filter((a) => a.jobId === j.id).map((a) => a.end); if (!ends.length) continue;
    const t = Math.max(0, Math.max(...ends) - j.due); totalTardiness += t; weightedTardiness += t * (j.priority ?? 1); if (t > 0) lateJobs++;
  }
  return { makespan, totalTardiness, weightedTardiness, lateJobs };
}

if (process.argv[1] && process.argv[1].endsWith("metrics.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const rr = regressionReport([1, 2, 3, 4], [1.1, 1.9, 3.2, 3.8]);
  assert(Math.abs(rr.mae - 0.15) < 1e-9 && rr.r2 > 0.95 && rr.mape > 0 && rr.mape < 10, "regression");
  const yt = [1, 0, 1, 0, 0, 1], sc = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1];
  const cr = classificationReport(yt, sc, 0.5, 2);
  assert(cr.tp === 2 && cr.fp === 1 && cr.fn === 1 && cr.tn === 2, "confusion");
  assert(Math.abs(cr.roc_auc - 5 / 9) < 1e-9 && cr.pr_auc > 0.6 && cr.pr_auc < 0.9, `auc ${cr.roc_auc} ${cr.pr_auc}`);
  assert(Math.abs(cr["recall@2"] - 1 / 3) < 1e-9 && cr["precision@2"] === 0.5, "at k");
  assert(prAuc([1, 1, 0, 0], [0.9, 0.8, 0.2, 0.1]) === 1 && rocAuc([1, 0], [0.2, 0.9]) === 0, "edge");
  const k = scheduleKpis([{ id: "A", due: 5, priority: 2 }, { id: "B", due: 3 }], [{ jobId: "A", end: 7 }, { jobId: "B", end: 2 }]);
  assert(JSON.stringify(k) === JSON.stringify({ makespan: 7, totalTardiness: 2, weightedTardiness: 4, lateJobs: 1 }), JSON.stringify(k));
  console.log("OK metrics");
}
