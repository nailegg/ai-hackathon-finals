/**
 * time_split: 누수 없는 train/valid 분할과 누수 점검.
 * 용도: 시간순 분할(cutoff/비율), 그룹 분할(같은 lot 이 양쪽에 못 들어감),
 *       누수 의심 컬럼 탐지(예측 시점 이후 타임스탬프, 타깃과 완전 상관, 분할 간 중복 id).
 * 규칙: 비율 분할에서 같은 시각의 행은 양쪽에 나뉘지 않는다. groupSplit 은 FNV-1a 32bit 해시 기반이라
 *       seed 가 같으면 py/ts 가 같은 분할을 낸다.
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
  let k = Math.floor(ordered.length * (opt.frac ?? 0.8));
  // 같은 시각의 행이 train/valid 로 갈리지 않게 경계를 다음 시각으로 민다
  while (k > 0 && k < ordered.length && cmp(ordered[k][timeCol], ordered[k - 1][timeCol]) === 0) k++;
  return [ordered.slice(0, k), ordered.slice(k)];
}

/** FNV-1a 32bit (utf-8 바이트). py 버전 fnv1a32 와 같은 값. */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (const b of Buffer.from(text, "utf-8")) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** 그룹 키 해시로 결정론적 분할. valid 비율 ≈ 1-frac. py/ts 동일 결과. 한쪽 쏠림은 한 그룹을 옮겨 보정. */
export function groupSplit(rows: Row[], groupCol: string, frac = 0.8, seed = 0): [Row[], Row[]] {
  const groups = [...new Set(rows.map((r) => String(r[groupCol])))].sort();
  const validPermille = Math.round((1 - frac) * 1000);
  const hash = (g: string) => fnv1a32(`${seed}:${g}`);
  const validG = new Set(groups.filter((g) => hash(g) % 1000 < validPermille));
  if (groups.length > 1) {
    if (!validG.size) validG.add(groups.reduce((a, b) => (hash(a) <= hash(b) ? a : b)));
    else if (validG.size === groups.length) validG.delete(groups.reduce((a, b) => (hash(a) >= hash(b) ? a : b)));
  }
  return [rows.filter((r) => !validG.has(String(r[groupCol]))), rows.filter((r) => validG.has(String(r[groupCol])))];
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
  // 회귀: 고정 fixture 의 분할이 py 와 같다
  assert(fnv1a32("") === 0x811c9dc5 && fnv1a32("a") === 0xe40c292c, "fnv");
  const fx: Row[] = ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"].map((g) => ({ g }));
  const [, fva] = groupSplit(fx, "g", 0.75, 7);
  assert(fva.map((r) => r.g).sort().join() === "L1,L4,L6", fva.map((r) => r.g).join());
  // 회귀: 같은 시각의 행은 비율 분할에서 갈리지 않음
  const [dtr, dva] = timeSplit([1, 1, 2, 2, 2, 3].map((t) => ({ t })), "t", { frac: 0.5 });
  assert(dtr.length === 5 && dva[0].t === 3, `dup ts ${dtr.length}`);
  const rep = leakageReport(rows, { target: "y", idCol: "wafer_id", predTimeCol: "t", timeCols: ["measured_at"], train: rows.slice(0, 8), valid: rows.slice(6) });
  assert(rep.future_time_columns[0].column === "measured_at", "future col");
  assert(rep.target_proxy_columns.map((c) => c.column).sort().join() === "leak,t,x", rep.target_proxy_columns.map((c) => c.column).join());
  assert(rep.duplicate_ids_across_splits.join() === "W6,W7" && rep.warnings.length === 3, "dups");
  console.log("OK time_split");
}
