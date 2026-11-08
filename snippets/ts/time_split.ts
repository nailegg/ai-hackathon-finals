/**
 * time_split: 누수 없는 train/valid 분할과 누수 점검.
 * 용도: 시간순 분할(cutoff/비율), 그룹 분할(같은 lot 이 양쪽에 못 들어감),
 *       누수 의심 컬럼 탐지(예측 시점 이후 타임스탬프, 타깃과 완전 상관, 분할 간 중복 id).
 * 사용 예:
 *   const [train, valid] = timeSplit(rows, "t", { frac: 0.8 });
 *   const [tr, va] = groupSplit(rows, "lot_id", 0.8, 0);
 *   leakageReport(rows, { target: "y", idCol: "wafer_id", predTimeCol: "t", timeCols: ["measured_at"], train, valid });
 */
export type Row = Record<string, unknown>;

const cmp = (a: unknown, b: unknown) => (a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0;

export function timeSplit(rows: Row[], timeCol: string, opt: { cutoff?: unknown; frac?: number } = {}): [Row[], Row[]] {
  const ordered = [...rows].sort((a, b) => cmp(a[timeCol], b[timeCol]));
  if (opt.cutoff !== undefined) return [ordered.filter((r) => cmp(r[timeCol], opt.cutoff) < 0), ordered.filter((r) => cmp(r[timeCol], opt.cutoff) >= 0)];
  const k = Math.floor(ordered.length * (opt.frac ?? 0.8));
  return [ordered.slice(0, k), ordered.slice(k)];
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = (seed >>> 0) || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function groupSplit(rows: Row[], groupCol: string, frac = 0.8, seed = 0): [Row[], Row[]] {
  const groups = seededShuffle([...new Set(rows.map((r) => String(r[groupCol])))].sort(), seed);
  const trainG = new Set(groups.slice(0, Math.max(1, Math.floor(groups.length * frac))));
  return [rows.filter((r) => trainG.has(String(r[groupCol]))), rows.filter((r) => !trainG.has(String(r[groupCol])))];
}

function corr(xs: number[], ys: number[]): number {
  const n = xs.length; if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

export type LeakageReport = {
  future_time_columns: { column: string; rows_after_prediction_time: number }[];
  target_proxy_columns: { column: string; corr: number }[];
  duplicate_ids_across_splits: string[];
  warnings: string[];
};

export function leakageReport(rows: Row[], opt: { target: string; idCol?: string; predTimeCol?: string; timeCols?: string[]; corrThreshold?: number; train?: Row[]; valid?: Row[] }): LeakageReport {
  const rep: LeakageReport = { future_time_columns: [], target_proxy_columns: [], duplicate_ids_across_splits: [], warnings: [] };
  if (opt.predTimeCol) for (const c of opt.timeCols ?? []) {
    const bad = rows.filter((r) => r[c] != null && r[opt.predTimeCol!] != null && cmp(r[c], r[opt.predTimeCol!]) > 0).length;
    if (bad) rep.future_time_columns.push({ column: c, rows_after_prediction_time: bad });
  }
  const ys = rows.map((r) => r[opt.target]);
  if (rows.length && ys.every((y) => typeof y === "number")) {
    for (const c of Object.keys(rows[0])) {
      if (c === opt.target || !rows.every((r) => typeof r[c] === "number")) continue;
      const rho = corr(rows.map((r) => r[c] as number), ys as number[]);
      if (Math.abs(rho) >= (opt.corrThreshold ?? 0.99)) rep.target_proxy_columns.push({ column: c, corr: Math.round(rho * 1e4) / 1e4 });
    }
  }
  if (opt.idCol && opt.train && opt.valid) {
    const t = new Set(opt.train.map((r) => String(r[opt.idCol!])));
    rep.duplicate_ids_across_splits = [...new Set(opt.valid.map((r) => String(r[opt.idCol!])).filter((id) => t.has(id)))].sort();
  }
  if (rep.future_time_columns.length) rep.warnings.push("예측 시점 이후 값이 있는 컬럼은 feature 에서 제외");
  if (rep.target_proxy_columns.length) rep.warnings.push("타깃과 거의 완전 상관인 컬럼은 라벨 누수 의심");
  if (rep.duplicate_ids_across_splits.length) rep.warnings.push("같은 id 가 train/valid 양쪽에 있음. groupSplit 사용");
  return rep;
}

if (process.argv[1] && process.argv[1].endsWith("time_split.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const rows: Row[] = Array.from({ length: 12 }, (_, i) => ({ t: i, lot_id: `L${Math.floor(i / 3)}`, wafer_id: `W${i}`, x: i, leak: i * 2 + 1, y: i * 2 + 1, measured_at: i + (i % 4 === 0 ? 5 : -1) }));
  const [tr, va] = timeSplit(rows, "t", { frac: 0.75 });
  assert(tr.length === 9 && Math.max(...tr.map((r) => r.t as number)) < Math.min(...va.map((r) => r.t as number)), "time split");
  const [tr2, va2] = timeSplit(rows, "t", { cutoff: 6 });
  assert(tr2.length === 6 && va2[0].t === 6, "cutoff");
  const [gtr, gva] = groupSplit(rows, "lot_id", 0.5, 1);
  const gset = new Set(gtr.map((r) => r.lot_id));
  assert(gtr.length > 0 && gva.length > 0 && !gva.some((r) => gset.has(r.lot_id)), "group split");
  const rep = leakageReport(rows, { target: "y", idCol: "wafer_id", predTimeCol: "t", timeCols: ["measured_at"], train: rows.slice(0, 8), valid: rows.slice(6) });
  assert(rep.future_time_columns[0].column === "measured_at", "future col");
  assert(rep.target_proxy_columns.map((c) => c.column).sort().join() === "leak,t,x", rep.target_proxy_columns.map((c) => c.column).join());
  assert(rep.duplicate_ids_across_splits.join() === "W6,W7" && rep.warnings.length === 3, "dups");
  console.log("OK time_split");
}
