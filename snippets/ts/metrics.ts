/**
 * metrics: 회귀·분류·랭킹·스케줄 지표 (외부 라이브러리 없음).
 * 용도: baseline 과 개선안을 같은 분할에서 같은 지표로 비교한다. py 버전과 같은 정의.
 *       Python 환경에 sklearn 이 있으면 채점기와 맞추기 위해 sklearn.metrics 를 우선 쓴다.
 *       prAuc 는 sklearn average_precision_score 와 같은 정의(동점은 한 블록).
 * 입력 길이가 다르면 throw.
 * 사용 예:
 *   regressionReport(y, yhat);              // mae, rmse, mape, mape_skipped_zero, r2
 *   classificationReport(y, score, 0.5, 10); // precision, recall, f1, confusion, pr_auc, roc_auc, recall@10
 *   scheduleKpis(jobs, schedule);
 */
function check(y: unknown[], p: unknown[], name: string): void {
  if (y.length !== p.length) throw new Error(`${name}: 길이 불일치 ${y.length} != ${p.length}`);
  if (y.length === 0) throw new Error(`${name}: 빈 입력`);
}
export function mae(y: number[], p: number[]): number { check(y, p, "mae"); return y.reduce((s, a, i) => s + Math.abs(a - p[i]), 0) / y.length; }
export function rmse(y: number[], p: number[]): number { check(y, p, "rmse"); return Math.sqrt(y.reduce((s, a, i) => s + (a - p[i]) ** 2, 0) / y.length); }
/** y == 0 이라 MAPE 에서 제외된 행 수 */
export function mapeSkipped(y: number[], p: number[]): number { check(y, p, "mape"); return y.filter((a) => a === 0).length; }
export function mape(y: number[], p: number[]): number {
  check(y, p, "mape");
  const idx = y.map((_, i) => i).filter((i) => y[i] !== 0);
  return idx.length ? (idx.reduce((s, i) => s + Math.abs((y[i] - p[i]) / y[i]), 0) / idx.length) * 100 : NaN;
}
export function r2(y: number[], p: number[]): number {
  check(y, p, "r2");
  const m = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((s, a) => s + (a - m) ** 2, 0) || 1e-12;
  return 1 - y.reduce((s, a, i) => s + (a - p[i]) ** 2, 0) / ssTot;
}
export const regressionReport = (y: number[], p: number[]) => ({ mae: mae(y, p), rmse: rmse(y, p), mape: mape(y, p), mape_skipped_zero: mapeSkipped(y, p), r2: r2(y, p), n: y.length });

export type Confusion = { tp: number; fp: number; fn: number; tn: number };
export function confusion(y: number[], pred: number[]): Confusion {
  check(y, pred, "confusion");
  const c: Confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  y.forEach((a, i) => { const b = pred[i]; if (a === 1 && b === 1) c.tp++; else if (a === 0 && b === 1) c.fp++; else if (a === 1 && b === 0) c.fn++; else c.tn++; });
  return c;
}
export function precisionRecallF1(y: number[], pred: number[]) {
  const c = confusion(y, pred);
  const precision = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0, recall = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
  return { precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, ...c };
}
/** 점수 내림차순, 동점은 원래 인덱스 순(결정론적) */
const byScoreDesc = (score: number[]) => score.map((_, i) => i).sort((a, b) => score[b] - score[a] || a - b);

/** Average precision (sklearn 정의). 동점은 한 블록으로 처리해 입력 순서에 무관. */
export function prAuc(y: number[], score: number[]): number {
  check(y, score, "prAuc");
  const totalPos = y.filter((t) => t === 1).length;
  if (!totalPos) return NaN;
  const order = byScoreDesc(score);
  let tp = 0, fp = 0, ap = 0, i = 0;
  while (i < order.length) {
    let j = i, pos = 0, neg = 0;
    while (j < order.length && score[order[j]] === score[order[i]]) { if (y[order[j]] === 1) pos++; else neg++; j++; }
    tp += pos; fp += neg;
    if (pos) ap += (pos / totalPos) * (tp / (tp + fp));
    i = j;
  }
  return ap;
}
export function rocAuc(y: number[], score: number[]): number {
  check(y, score, "rocAuc");
  const pos = score.filter((_, i) => y[i] === 1), neg = score.filter((_, i) => y[i] === 0);
  if (!pos.length || !neg.length) return NaN;
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}
export function recallAtK(y: number[], score: number[], k: number): number { check(y, score, "recallAtK"); return byScoreDesc(score).slice(0, k).reduce((s, i) => s + y[i], 0) / (y.reduce((a, b) => a + b, 0) || 1); }
export function precisionAtK(y: number[], score: number[], k: number): number { check(y, score, "precisionAtK"); return byScoreDesc(score).slice(0, k).reduce((s, i) => s + y[i], 0) / k; }

export function classificationReport(y: number[], score: number[], threshold = 0.5, k?: number): Record<string, number> {
  check(y, score, "classificationReport");
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
  assert(Math.abs(rr.mae - 0.15) < 1e-9 && rr.r2 > 0.95 && rr.mape > 0 && rr.mape < 10 && rr.mape_skipped_zero === 0, "regression");
  const yt = [1, 0, 1, 0, 0, 1], sc = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1];
  const cr = classificationReport(yt, sc, 0.5, 2);
  assert(cr.tp === 2 && cr.fp === 1 && cr.fn === 1 && cr.tn === 2, "confusion");
  assert(Math.abs(cr.roc_auc - 5 / 9) < 1e-9 && Math.abs(cr.pr_auc - (1 + 2 / 3 + 0.5) / 3) < 1e-9, `auc ${cr.roc_auc} ${cr.pr_auc}`);
  assert(Math.abs(cr["recall@2"] - 1 / 3) < 1e-9 && cr["precision@2"] === 0.5, "at k");
  assert(prAuc([1, 1, 0, 0], [0.9, 0.8, 0.2, 0.1]) === 1 && rocAuc([1, 0], [0.2, 0.9]) === 0, "edge");
  // 회귀 1: 길이 불일치
  let threw = false; try { mae([1, 2, 3], [1]); } catch { threw = true; } assert(threw, "length mismatch");
  // 회귀 2: mape 제외 수
  const rr0 = regressionReport([0, 2, 4], [0, 2, 3]);
  assert(rr0.mape_skipped_zero === 1 && Math.abs(rr0.mape - 12.5) < 1e-9, "mape skipped");
  // 회귀 3: AP 정의와 동점 순서 무관
  assert(Math.abs(prAuc([0, 1], [0.9, 0.1]) - 0.5) < 1e-12, `ap ${prAuc([0, 1], [0.9, 0.1])}`);
  const tieA = prAuc([1, 0, 0, 0, 0, 0, 0, 0], Array(8).fill(0.5)), tieB = prAuc([0, 0, 0, 0, 0, 0, 0, 1], Array(8).fill(0.5));
  assert(Math.abs(tieA - tieB) < 1e-12 && Math.abs(tieA - 1 / 8) < 1e-12, `ties ${tieA} ${tieB}`);
  assert(Number.isNaN(prAuc([0, 0], [0.1, 0.2])), "no positives");
  const k = scheduleKpis([{ id: "A", due: 5, priority: 2 }, { id: "B", due: 3 }], [{ jobId: "A", end: 7 }, { jobId: "B", end: 2 }]);
  assert(JSON.stringify(k) === JSON.stringify({ makespan: 7, totalTardiness: 2, weightedTardiness: 4, lateJobs: 1 }), JSON.stringify(k));
  console.log("OK metrics");
}
