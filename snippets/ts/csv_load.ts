/**
 * csv_load: 인코딩·구분자 자동 감지 CSV 로더와 프로파일.
 * 용도: 한글 CSV(utf-8/cp949)를 안전하게 읽고 헤더 정규화, 컬럼 단위 타입 추론, 결측·중복 키 요약.
 *       데이터 계약(CONTRACT §4) 작성용. py 버전과 같은 규칙.
 * 규칙:
 *   - 타입은 컬럼 단위. 숫자와 문자열이 섞이면 전부 문자열.
 *   - 정규화 컬럼명이 `_id`, `_no`, `_code`, `code`, `id` 로 끝나면 항상 문자열(조인 키 보호).
 *   - 앞자리 0 숫자("007")가 하나라도 있으면 그 컬럼은 문자열.
 *   - 날짜는 전부 파싱될 때만 Date. 일부만 파싱되면 문자열 유지 + warnings.
 *   - 날짜·시각은 모두 **로컬 벽시계**로 해석한다(날짜만 있어도 UTC 로 바꾸지 않는다). 뒤의 'Z' 는 떼고
 *     같은 벽시계로 읽는다. 시간대 변환은 호출자가 한다.
 *   - 따옴표 안의 줄바꿈·구분자·"" 이스케이프를 처리한다.
 *   - 정규화 후 헤더가 겹치면 throw.
 * 사용 예:
 *   const { rows, meta } = loadCsv("data/lots.csv", { parseDates: true, keepAsText: ["serial"] });
 *   const prof = profile(rows, meta.warnings);
 *   const dups = duplicateKeys(rows, ["lot_id", "wafer_id"]);
 */
import { readFileSync } from "node:fs";

export type Cell = number | Date | string | null;
export type Row = Record<string, Cell>;
export type Meta = { header: string[]; delimiter: string; encoding: string; warnings: string[] };
export type LoadOptions = { parseDates?: boolean; keepAsText?: string[] };

const MISSING = new Set(["", "na", "nan", "null", "none", "-"]);
const ID_SUFFIXES = ["_id", "_no", "_code", "code", "id"];
const DATE_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?Z?$/;

export function decodeBuffer(buf: Buffer): { text: string; encoding: string } {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return { text: text.replace(/^﻿/, ""), encoding: "utf-8" };
  } catch {
    try { return { text: new TextDecoder("euc-kr").decode(buf), encoding: "euc-kr" }; }
    catch { return { text: buf.toString("latin1"), encoding: "latin1(fallback, ICU 없음)" }; }
  }
}

export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/-/g, " ").split(/\s+/).join("_").replace(/^_+|_+$/g, "") || "col";
}

const isMissing = (s: string) => MISSING.has(s.trim().toLowerCase());

function toNumber(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(t)) { const n = Number(t); return Number.isFinite(n) ? n : null; }
  return null;
}

/** 로컬 벽시계 Date. 날짜만 있어도 로컬 자정. */
export function parseLocalDate(s: string): Date | null {
  const m = DATE_RE.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, hh = "0", mi = "0", ss = "0", frac = "0"] = m;
  const ms = Number((frac + "000").slice(0, 3));
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi), Number(ss), ms);
  return isNaN(dt.getTime()) || dt.getMonth() !== Number(mo) - 1 ? null : dt;
}

function inferColumn(name: string, values: string[], opts: Required<LoadOptions>, warnings: string[]): Cell[] {
  const asText: Cell[] = values.map((v) => (isMissing(v) ? null : v.trim()));
  const present = values.filter((v) => !isMissing(v)).map((v) => v.trim());
  if (!present.length || opts.keepAsText.includes(name) || ID_SUFFIXES.some((suf) => name.endsWith(suf))) return asText;
  if (present.some((v) => /^0\d+$/.test(v))) { warnings.push(`${name}: 앞자리 0 값이 있어 문자열로 유지`); return asText; }
  const nums = present.map(toNumber);
  if (nums.every((n) => n !== null)) return asText.map((v) => (v === null ? null : (toNumber(v as string) as number)));
  if (opts.parseDates) {
    const dates = present.map(parseLocalDate);
    const ok = dates.filter((d) => d !== null).length;
    if (ok === present.length) return asText.map((v) => (v === null ? null : (parseLocalDate(v as string) as Date)));
    if (ok > 0) warnings.push(`${name}: 날짜 ${ok}건 파싱, ${present.length - ok}건 실패 → 문자열 유지`);
  }
  return asText;
}

export function sniffDelimiter(sample: string): string {
  const cands = [",", ";", "\t", "|"];
  const first = sample.split(/\r?\n/)[0] ?? "";
  return cands.map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
}

/** RFC4180 식 파서: 따옴표 안 줄바꿈·구분자·"" 처리. */
export function parseRecords(text: string, d: string): string[][] {
  const records: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === d) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); records.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); records.push(row); }
  return records.filter((r) => r.some((c) => c.trim() !== ""));
}

export function loadText(text: string, options: LoadOptions = {}): { rows: Row[]; meta: Omit<Meta, "encoding"> } {
  const opts: Required<LoadOptions> = { parseDates: options.parseDates ?? true, keepAsText: options.keepAsText ?? [] };
  const delimiter = sniffDelimiter(text.slice(0, 4096));
  const records = parseRecords(text, delimiter);
  const rawHeader = records[0] ?? [];
  const header = rawHeader.map(normalizeHeader);
  if (new Set(header).size !== header.length) {
    const dup = [...new Set(header.filter((h, i) => header.indexOf(h) !== i))];
    throw new Error(`정규화 후 헤더 충돌: ${dup.join(",")} (원본: ${rawHeader.join(",")})`);
  }
  const body = records.slice(1);
  const warnings: string[] = [];
  const columns = header.map((h, i) => inferColumn(h, body.map((r) => r[i] ?? ""), opts, warnings));
  const rows = body.map((_, k) => { const r: Row = {}; header.forEach((h, i) => (r[h] = columns[i][k])); return r; });
  return { rows, meta: { header, delimiter, warnings } };
}

export function loadCsv(path: string, options: LoadOptions = {}): { rows: Row[]; meta: Meta } {
  const { text, encoding } = decodeBuffer(readFileSync(path));
  const { rows, meta } = loadText(text, options);
  return { rows, meta: { ...meta, encoding } };
}

export type ColProfile = { type: string; missing: number; unique: number; min?: Cell; max?: Cell };
export function profile(rows: Row[], warnings: string[] = []): { rows: number; cols: number; columns: Record<string, ColProfile>; warnings: string[] } {
  if (!rows.length) return { rows: 0, cols: 0, columns: {}, warnings: [...warnings] };
  const columns: Record<string, ColProfile> = {};
  for (const c of Object.keys(rows[0])) {
    const vals = rows.map((r) => r[c]), present = vals.filter((v): v is Exclude<Cell, null> => v !== null);
    const types = new Set(present.map((v) => (v instanceof Date ? "datetime" : typeof v === "number" ? (Number.isInteger(v) ? "int" : "float") : "str")));
    const type = types.size === 0 ? "empty" : types.size === 1 ? [...types][0] : [...types].every((t) => t === "int" || t === "float") ? "float" : "mixed";
    const info: ColProfile = { type, missing: vals.length - present.length, unique: new Set(present.map(String)).size };
    if (["int", "float", "datetime"].includes(type)) { const sorted = [...present].sort((a, b) => (a as number) - (b as number)); info.min = sorted[0]; info.max = sorted[sorted.length - 1]; }
    columns[c] = info;
  }
  return { rows: rows.length, cols: Object.keys(columns).length, columns, warnings: [...warnings] };
}

export function duplicateKeys(rows: Row[], keyCols: string[]): string[] {
  const seen = new Set<string>(), dups: string[] = [];
  for (const r of rows) { const k = keyCols.map((c) => String(r[c])).join("|"); if (seen.has(k)) dups.push(k); seen.add(k); }
  return dups;
}

if (process.argv[1] && process.argv[1].endsWith("csv_load.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const { rows, meta } = loadText("Lot ID;설비;측정 시각;수율;비고\nL1;T1;2026-01-01 10:00:00;97.5;\nL2;T2;2026-01-01 11:00:00;92;NA\nL1;T1;2026-01-02 09:30:00;\"1,234.5\";메모\n");
  assert(meta.delimiter === ";" && meta.header.join() === "lot_id,설비,측정_시각,수율,비고", meta.header.join());
  assert(rows[0]["수율"] === 97.5 && rows[1]["수율"] === 92 && rows[2]["수율"] === 1234.5, "numbers");
  assert(rows[0]["측정_시각"] instanceof Date && rows[1]["비고"] === null, "date/missing");
  const prof = profile(rows, meta.warnings);
  assert(prof.rows === 3 && prof.columns["수율"].type === "float" && prof.columns["비고"].missing === 2 && prof.columns["측정_시각"].type === "datetime", JSON.stringify(prof));
  assert(duplicateKeys(rows, ["lot_id"]).join() === "L1", "dups");
  const utf = decodeBuffer(Buffer.from("﻿a,b\n1,x\n", "utf-8"));
  assert(utf.encoding === "utf-8" && utf.text.startsWith("a,b"), "bom");
  // 회귀 1: ID 컬럼·앞자리 0 문자열 유지
  const r1 = loadText("tool_id,qty,serial\n007,3,0012\n8,4,99\n");
  assert(r1.rows[0].tool_id === "007" && r1.rows[1].tool_id === "8" && r1.rows[0].qty === 3, "id as text");
  assert(r1.rows[0].serial === "0012" && r1.rows[1].serial === "99" && r1.meta.warnings.some((w) => w.includes("serial")), "leading zero");
  // 회귀 2: 날짜만 vs 시각 모두 로컬 벽시계, Z 제거, 혼합 컬럼은 문자열
  const r2 = loadText("d,t,z,mix\n2026-01-01,2026-01-01 00:00,2026-01-01T00:00:00Z,2026-01-01\n2026-01-02,2026-01-02 11:30,2026-01-02T00:00:00Z,oops\n");
  const d0 = r2.rows[0].d as Date, t0 = r2.rows[0].t as Date, z0 = r2.rows[0].z as Date;
  assert(d0.getTime() === t0.getTime() && t0.getTime() === z0.getTime() && d0.getHours() === 0, "local wall-clock");
  assert((r2.rows[1].t as Date).getMinutes() === 30 && r2.rows[0].mix === "2026-01-01" && r2.rows[1].mix === "oops" && r2.meta.warnings.some((w) => w.includes("mix")), "mixed col");
  // 회귀 3: 따옴표 안 줄바꿈과 구분자
  const r3 = loadText('id,note\n1,"line1\nline2, with comma"\n2,"say ""hi"""\n');
  assert(r3.rows.length === 2 && r3.rows[0].note === "line1\nline2, with comma" && r3.rows[1].note === 'say "hi"', JSON.stringify(r3.rows));
  // 회귀 4: 옵션
  const r4 = loadText("d,v\n2026-01-01,5\n", { parseDates: false, keepAsText: ["v"] });
  assert(r4.rows[0].d === "2026-01-01" && r4.rows[0].v === "5", "options");
  // 회귀 5: 헤더 충돌
  let threw = false; try { loadText("Lot ID,lot_id\n1,2\n"); } catch (e) { threw = String(e).includes("헤더 충돌"); }
  assert(threw, "header collision");
  // 회귀 6: 8자리 숫자는 숫자 (날짜 아님), 숫자·문자 혼합은 문자열
  const r6 = loadText("n,x\n20260101,1\n20260102,abc\n");
  assert(r6.rows[0].n === 20260101 && r6.rows[0].x === "1" && r6.rows[1].x === "abc", "8digit/mixed");
  let eucOk = true;
  try { const dec = new TextDecoder("euc-kr").decode(Buffer.from([0xbc, 0xf6, 0xc0, 0xb2])); eucOk = dec === "수율"; } catch { eucOk = false; }
  console.log("OK csv_load" + (eucOk ? "" : " (euc-kr 디코더 없음: utf-8만 확인)"));
}
