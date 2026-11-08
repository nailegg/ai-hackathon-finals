/**
 * fts_search: 설치 없는 문서 검색(BM25) + 인용 형식.
 * 용도: SOP·매뉴얼을 문단 단위로 쪼개 BM25 로 검색하고 citation {source_id, chunk_id, snippet} 을 만든다.
 * 입력: docs = { [doc_id]: "본문" } (문단은 빈 줄로 구분)
 * 사용 예:
 *   const idx = new BM25Index(docs);
 *   const hits = idx.search("챔버 압력 상한", 3);
 *   const cites = toCitations(hits);
 */
export type Hit = { doc_id: string; chunk_id: string; score: number; snippet: string };
export type Citation = { source_id: string; chunk_id: string; snippet: string };
type Chunk = { doc_id: string; chunk_id: string; text: string };

export function tokenize(text: string): string[] {
  const toks: string[] = [];
  for (const w of text.toLowerCase().match(/[0-9a-z_]+|[가-힣]+/g) ?? []) {
    toks.push(w);
    if (/^[가-힣]+$/.test(w) && w.length > 2) for (let i = 0; i < w.length - 1; i++) toks.push(w.slice(i, i + 2));
  }
  return toks;
}

export function chunkDocs(docs: Record<string, string>): Chunk[] {
  const out: Chunk[] = [];
  for (const [docId, text] of Object.entries(docs)) {
    text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      .forEach((para, i) => out.push({ doc_id: docId, chunk_id: `${docId}#p${i + 1}`, text: para }));
  }
  return out;
}

export class BM25Index {
  private chunks: Chunk[]; private tf: Map<string, number>[]; private len: number[]; private avg: number; private idf: Map<string, number>;
  constructor(docs: Record<string, string>, private k1 = 1.5, private b = 0.75) {
    this.chunks = chunkDocs(docs);
    this.tf = this.chunks.map((c) => { const m = new Map<string, number>(); for (const t of tokenize(c.text)) m.set(t, (m.get(t) ?? 0) + 1); return m; });
    this.len = this.tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
    this.avg = this.len.length ? this.len.reduce((a, b) => a + b, 0) / this.len.length : 1;
    const df = new Map<string, number>();
    for (const m of this.tf) for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    const n = this.chunks.length;
    this.idf = new Map([...df].map(([t, d]) => [t, Math.log(1 + (n - d + 0.5) / (d + 0.5))]));
  }
  search(query: string, k = 5): Hit[] {
    const q = new Set(tokenize(query));
    const scored: Hit[] = [];
    this.chunks.forEach((c, i) => {
      let s = 0;
      for (const term of q) {
        const f = this.tf[i].get(term) ?? 0; if (!f) continue;
        const denom = f + this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avg);
        s += (this.idf.get(term) ?? 0) * (f * (this.k1 + 1)) / denom;
      }
      if (s > 0) scored.push({ doc_id: c.doc_id, chunk_id: c.chunk_id, score: Math.round(s * 1e4) / 1e4, snippet: c.text.slice(0, 160) });
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, k);
  }
}

export function toCitations(hits: Hit[]): Citation[] {
  return hits.map((h) => ({ source_id: h.doc_id, chunk_id: h.chunk_id, snippet: h.snippet }));
}

if (process.argv[1] && process.argv[1].endsWith("fts_search.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  const docs = {
    "SOP-ETCH-01": "식각 챔버 압력 상한은 50 mTorr 이다. 초과 시 즉시 공정을 중단한다.\n\n정비 후에는 리크 체크를 수행한다.",
    "SOP-CVD-02": "증착 온도는 400도를 유지한다.\n\nRF power 가 불안정하면 매칭 네트워크를 점검한다.",
  };
  const idx = new BM25Index(docs);
  const hits = idx.search("챔버 압력 상한", 2);
  assert(hits.length > 0 && hits[0].chunk_id === "SOP-ETCH-01#p1", JSON.stringify(hits));
  assert(idx.search("존재하지않는단어").length === 0, "no hits");
  const cites = toCitations(hits);
  assert(cites[0].source_id === "SOP-ETCH-01" && typeof cites[0].snippet === "string", "citation");
  assert(idx.search("RF power 점검")[0].chunk_id === "SOP-CVD-02#p2", "rf");
  console.log("OK fts_search");
}
