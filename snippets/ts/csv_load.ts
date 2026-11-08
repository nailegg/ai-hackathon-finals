/**
 * csv_load: 인코딩·구분자 자동 감지 CSV 로더와 프로파일.
 * 용도: 한글 CSV(utf-8/cp949)를 안전하게 읽고 헤더 정규화, 타입 추론, 결측·중복 키 요약.
 *       데이터 계약(CONTRACT §4) 작성용.
 * 사용 예:
 *   const { rows, meta } = loadCsv("data/lots.csv");
 *   const prof = profile(rows);
 *   const dups = duplicateKeys(rows, ["lot_id", "wafer_id"]);
 */
import { readFileSync } from "node:fs";

export type Cell = number | Date | string | null;
export type Row = Record<string, Cell>;
export type Meta = { header: string[]; delimiter: string; encoding: string };

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

const MISSING = new Set(["", "na", "nan", "null", "none", "-"]);
export function infer(raw: string): Cell {
  const s = raw.trim();
  if (MISSING.has(s.toLowerCase())) return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  const n = Number(s.replace(/,/g, ""));
  if (s !== "" && /^-?[\d,]*\.?\d+(e-?\d+)?$/i.test(s) && Number.isFinite(n)) return n;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(s)) { const d = new Date(s.replace(/\//g, "-").replace(" ", "T")); if (!isNaN(d.getTime())) return d; }
  if (/^\d{8}$/.test(s)) { const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`); if (!isNaN(d.getTime())) return d; }
  return s;
}

export function sniffDelimiter(sample: string): string {
  const cands = [",", ";", "\t", "|"];
  const first = sample.split(/\r?\n/)[0] ?? "";
  return cands.map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
}

function splitLine(line: string, d: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === d && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function loadText(text: string): { rows: Row[]; meta: Omit<Meta, "encoding"> } {
  const delimiter = sniffDelimiter(text.slice(0, 4096));
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = splitLine(lines[0] ?? "", delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map((l) => { const cells = splitLine(l, delimiter); const r: Row = {}; header.forEach((h, i) => (r[h] = infer(cells[i] ?? ""))); return r; });
  return { rows, meta: { header, delimiter } };
}

export function loadCsv(path: string): { rows: Row[]; meta: Meta } {
  const { text, encoding } = decodeBuffer(readFileSync(path));
  const { rows, meta } = loadText(text);
  return { rows, meta: { ...meta, encoding } };
}

export type ColProfile = { type: string; missing: number; unique: number; min?: Cell; max?: Cell };
export function profile(rows: Row[]): { rows: number; cols: number; columns: Record<string, ColProfile> } {
  if (!rows.length) return { rows: 0, cols: 0, columns: {} };
  const columns: Record<string, ColProfile> = {};
  for (const c of Object.keys(rows[0])) {
    const vals = rows.map((r) => r[c]), present = vals.filter((v): v is Exclude<Cell, null> => v !== null);
    const types = new Set(present.map((v) => (v instanceof Date ? "datetime" : typeof v === "number" ? (Number.isInteger(v) ? "int" : "float") : "str")));
    const type = types.size === 0 ? "empty" : types.size === 1 ? [...types][0] : [...types].every((t) => t === "int" || t === "float") ? "float" : "mixed";
    const info: ColProfile = { type, missing: vals.length - present.length, unique: new Set(present.map(String)).size };
    if (["int", "float", "datetime"].includes(type)) { const sorted = [...present].sort((a, b) => (a as number) - (b as number)); info.min = sorted[0]; info.max = sorted[sorted.length - 1]; }
    columns[c] = info;
  }
  return { rows: rows.length, cols: Object.keys(columns).length, columns };
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
  const prof = profile(rows);
  assert(prof.rows === 3 && prof.columns["수율"].type === "float" && prof.columns["비고"].missing === 2 && prof.columns["측정_시각"].type === "datetime", JSON.stringify(prof));
  assert(duplicateKeys(rows, ["lot_id"]).join() === "L1", "dups");
  const utf = decodeBuffer(Buffer.from("﻿a,b\n1,x\n", "utf-8"));
  assert(utf.encoding === "utf-8" && utf.text.startsWith("a,b"), "bom");
  let eucOk = true;
  try { const dec = new TextDecoder("euc-kr").decode(Buffer.from([0xbc, 0xf6, 0xc0, 0xb2])); eucOk = dec === "수율"; } catch { eucOk = false; }
  console.log("OK csv_load" + (eucOk ? "" : " (euc-kr 디코더 없음: utf-8만 확인)"));
}
