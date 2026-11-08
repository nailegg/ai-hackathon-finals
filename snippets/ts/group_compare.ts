/**
 * group_compare: 이상 점수와 집단 비교 표.
 * 용도: 그룹별 robust z-score(median/MAD), rolling z-score, EWMA 경보,
 *       이상군 vs 정상군 비교 표(Cohen's d, rank-biserial)로 원인 "후보" 랭킹.
 * 사용 예:
 *   robustZByGroup(rows, "tool_id", "temp");
 *   ewmaAlarm(values, 0.3, 3);
 *   compareGroups(abnormal, normal, ["temp", "pressure"]);
 */
export type Row = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pstdev = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
const variance = (a: number[]) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };

export type ScaleSource = "mad" | "std_fallback" | "constant";
/** 1.4826*MAD. MAD=0 이면 표준편차로 대체, 그것도 0 이면 상수 그룹. */
export function robustScale(vals: number[]): { med: number; scale: number; source: ScaleSource } {
  const med = median(vals), mad = median(vals.map((v) => Math.abs(v - med)));
  if (mad > 0) return { med, scale: 1.4826 * mad, source: "mad" };
  const sd = vals.length > 1 ? pstdev(vals) : 0;
  return sd > 0 ? { med, scale: sd, source: "std_fallback" } : { med, scale: 0, source: "constant" };
}

export type ScoredRow = Row & { robust_z: number; scale_source: ScaleSource; constant_group: boolean; evidence: string };
/** MAD=0 그룹이 상위 K 를 독식하지 않도록 scale 을 보정한다. */
export function robustZByGroup(rows: Row[], key: string, value: string, minN = 3): ScoredRow[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) if (num(r[value]) !== null) groups.set(String(r[key]), [...(groups.get(String(r[key])) ?? []), r]);
  const out: ScoredRow[] = [];
  for (const [g, items] of groups) {
    const vals = items.map((r) => num(r[value]) as number);
    const { med, scale, source } = robustScale(vals);
    for (const r of items) {
      const z = vals.length < minN || scale === 0 ? 0 : ((num(r[value]) as number) - med) / scale;
      out.push({ ...r, robust_z: Math.round(z * 1000) / 1000, scale_source: source, constant_group: source === "constant", evidence: `${key}=${g} ${value}=${String(r[value])} median=${med.toPrecision(3)} scale=${scale.toPrecision(3)}(${source}) n=${vals.length}` });
    }
  }
  return out.sort((a, b) => Math.abs(b.robust_z) - Math.abs(a.robust_z));
}

/** 직전 구간이 상수(sd=0)면 같은 값은 0, 다른 값은 ±cap (무한대 방지). */
export function rollingZ(values: number[], window = 10, cap = 10): number[] {
  return values.map((v, i) => {
    const hist = values.slice(Math.max(0, i - window), i);
    if (hist.length < 2) return 0;
    const mu = mean(hist), sd = pstdev(hist);
    if (sd === 0) return v === mu ? 0 : v > mu ? cap : -cap;
    return Math.max(-cap, Math.min(cap, (v - mu) / sd));
  });
}

export function ewmaAlarm(values: number[], lam = 0.3, k = 3, warmup = 5): { i: number; value: number; ewma: number; alarm: boolean }[] {
  if (values.length < warmup + 1) return values.map((v, i) => ({ i, value: v, ewma: v, alarm: false }));
  const base = values.slice(0, warmup), mu = mean(base), sd = pstdev(base) || 1e-9;
  const limit = k * sd * Math.sqrt(lam / (2 - lam));
  let ewma = mu;
  return values.map((v, i) => { ewma = lam * v + (1 - lam) * ewma; return { i, value: v, ewma: Math.round(ewma * 1e4) / 1e4, alarm: i >= warmup && Math.abs(ewma - mu) > limit }; });
}

function cohensD(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 0;
  const sp = Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / (a.length + b.length - 2)) || 1e-9;
  return (mean(a) - mean(b)) / sp;
}
function rankBiserial(a: number[], b: number[]): number {
  let wins = 0;
  for (const x of a) for (const y of b) wins += x > y ? 1 : x < y ? -1 : 0;
  return a.length && b.length ? wins / (a.length * b.length) : 0;
}

export type CompareRow = { feature: string; n_abnormal: number; n_normal: number; mean_abnormal: number; mean_normal: number; median_abnormal: number; median_normal: number; std_abnormal: number; std_normal: number; diff: number; cohens_d: number; rank_biserial: number; evidence: string };

export function compareGroups(abnormal: Row[], normal: Row[], features: string[]): CompareRow[] {
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
  const rows: CompareRow[] = [];
  for (const f of features) {
    const a = abnormal.map((r) => num(r[f])).filter((v): v is number => v !== null);
    const b = normal.map((r) => num(r[f])).filter((v): v is number => v !== null);
    if (!a.length || !b.length) continue;
    const d = cohensD(a, b), rb = rankBiserial(a, b);
    rows.push({ feature: f, n_abnormal: a.length, n_normal: b.length, mean_abnormal: r4(mean(a)), mean_normal: r4(mean(b)), median_abnormal: r4(median(a)), median_normal: r4(median(b)), std_abnormal: r4(pstdev(a)), std_normal: r4(pstdev(b)), diff: r4(mean(a) - mean(b)), cohens_d: Math.round(d * 1000) / 1000, rank_biserial: Math.round(rb * 1000) / 1000,
      evidence: `${f}: 이상군 평균 ${mean(a).toPrecision(3)} vs 정상군 ${mean(b).toPrecision(3)} (d=${d.toFixed(2)}, n=${a.length}/${b.length}). 원인 후보이며 인과 확정 아님` });
  }
  return rows.sort((x, y) => Math.abs(y.cohens_d) - Math.abs(x.cohens_d));
}

if (process.argv[1] && process.argv[1].endsWith("group_compare.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const rows: Row[] = [...[10, 10.2, 9.9, 10.1, 15.0].map((v) => ({ tool: "T1", v })), ...[20, 20.1, 19.9, 20.2].map((v) => ({ tool: "T2", v }))];
  const scored = robustZByGroup(rows, "tool", "v");
  assert(scored[0].v === 15.0 && scored[0].tool === "T1" && scored[0].robust_z > 3, "robust z");
  const rz = rollingZ([1, 1, 1, 1, 1, 1, 9], 5);
  assert(rz[rz.length - 1] > 3 && rz[0] === 0, "rolling z");
  const al = ewmaAlarm([1, 1.1, 0.9, 1.0, 1.05, 1.0, 1.0, 3.0, 3.0, 3.0], 0.3, 3);
  assert(al.some((a) => a.alarm) && !al.slice(0, 7).some((a) => a.alarm), "ewma");
  const abn: Row[] = [{ temp: 110, pres: 5.0 }, { temp: 112, pres: 5.1 }, { temp: 111, pres: 4.9 }];
  const nor: Row[] = [{ temp: 100, pres: 5.0 }, { temp: 101, pres: 5.05 }, { temp: 99, pres: 4.95 }, { temp: 100, pres: 5.0 }];
  const tbl = compareGroups(abn, nor, ["temp", "pres"]);
  assert(tbl[0].feature === "temp" && tbl[0].rank_biserial === 1 && tbl[0].evidence.length > 0, "compare");
  // 회귀: MAD=0 그룹이 상위 독식하지 않음, 상수 그룹 z=0 + 플래그, rolling cap
  const rows2: Row[] = [...[5, 5, 5, 5, 6].map((v) => ({ tool: "A", v })), ...[10, 10.5, 9.5, 10.2, 30].map((v) => ({ tool: "B", v })), ...[7, 7, 7, 7].map((v) => ({ tool: "C", v }))];
  const sc2 = robustZByGroup(rows2, "tool", "v");
  assert(sc2[0].tool === "B" && sc2[0].v === 30, `top ${JSON.stringify(sc2[0])}`);
  const aRows = sc2.filter((r) => r.tool === "A");
  assert(aRows.every((r) => Math.abs(r.robust_z) < 5) && aRows[0].scale_source === "std_fallback", "std fallback");
  assert(sc2.filter((r) => r.tool === "C").every((r) => r.robust_z === 0 && r.constant_group), "constant group");
  const rz2 = rollingZ([2, 2, 2, 2, 2, 7], 5);
  assert(rz2[rz2.length - 1] === 10 && rz2[rz2.length - 2] === 0, "rolling cap");
  console.log("OK group_compare");
}
