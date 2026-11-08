"""fts_search: 설치 없는 문서 검색(BM25) + 인용 형식.

용도: SOP·매뉴얼·인수인계 문서를 문단 단위로 쪼개 BM25 로 검색하고,
      답변에 붙일 citation {source_id, chunk_id, snippet} 을 만든다.
      sqlite3 FTS5 가 있으면 같은 인터페이스의 DB 버전도 쓸 수 있다.
입력: docs = {"doc_id": "본문 문자열"} (문단은 빈 줄로 구분)
출력: [{"doc_id", "chunk_id", "score", "matched_terms", "snippet"}] 상위 k 개
"근거 없음" 판정 규칙(권장): hits 가 비었거나, 1위 score < min_score 이거나,
  1위의 matched_terms 가 2개 미만(질의 토큰이 2개 이상일 때)이면 답하지 않고 기권(abstain)한다.
  min_score 는 제공 질문 세트에서 정답이 있는 질문의 1위 점수 분포를 보고 정한다(기본 0 = 끄기).
사용 예:
  idx = BM25Index(docs)
  hits = idx.search("챔버 압력 상한", k=3, min_score=1.0)
  if not hits or len(hits[0]["matched_terms"]) < 2: answer = "근거 없음"
  cites = to_citations(hits)
"""
import math
import re
import sqlite3


def tokenize(text):
    """공백 토큰 + 한글 토큰은 2-gram 추가(형태소 분석기 없이 부분 일치)."""
    toks = []
    for w in re.findall(r"[0-9A-Za-z_]+|[가-힣]+", text.lower()):
        toks.append(w)
        if re.match(r"[가-힣]+", w) and len(w) > 2:
            toks.extend(w[i:i + 2] for i in range(len(w) - 1))
    return toks


def chunk_docs(docs):
    chunks = []
    for doc_id, text in docs.items():
        for i, para in enumerate(p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()):
            chunks.append({"doc_id": doc_id, "chunk_id": f"{doc_id}#p{i + 1}", "text": para})
    return chunks


class BM25Index:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.chunks = chunk_docs(docs)
        self.k1, self.b = k1, b
        self.tf = [self._count(tokenize(c["text"])) for c in self.chunks]
        self.len = [sum(t.values()) for t in self.tf]
        self.avg = (sum(self.len) / len(self.len)) if self.len else 1.0
        df = {}
        for t in self.tf:
            for term in t:
                df[term] = df.get(term, 0) + 1
        n = len(self.chunks)
        self.idf = {term: math.log(1 + (n - d + 0.5) / (d + 0.5)) for term, d in df.items()}

    @staticmethod
    def _count(tokens):
        c = {}
        for t in tokens:
            c[t] = c.get(t, 0) + 1
        return c

    def search(self, query, k=5, min_score=0.0):
        q = set(tokenize(query))
        if not q:
            return []
        scored = []
        for i, c in enumerate(self.chunks):
            s = 0.0
            matched = []
            for term in sorted(q):
                f = self.tf[i].get(term, 0)
                if not f:
                    continue
                matched.append(term)
                denom = f + self.k1 * (1 - self.b + self.b * self.len[i] / self.avg)
                s += self.idf.get(term, 0) * f * (self.k1 + 1) / denom
            if s > 0 and s >= min_score:
                scored.append({"doc_id": c["doc_id"], "chunk_id": c["chunk_id"], "score": round(s, 4),
                               "matched_terms": matched, "snippet": c["text"][:160]})
        scored.sort(key=lambda r: (-r["score"], r["chunk_id"]))
        return scored[:k]


def to_citations(hits):
    return [{"source_id": h["doc_id"], "chunk_id": h["chunk_id"], "snippet": h["snippet"]} for h in hits]


class SqliteFTS:
    """sqlite3 FTS5 버전. 사용 불가 환경이면 available=False 로 두고 BM25Index 를 쓴다."""

    def __init__(self, docs, path=":memory:"):
        self.available = False
        try:
            self.con = sqlite3.connect(path)
            self.con.execute("CREATE VIRTUAL TABLE IF NOT EXISTS chunks USING fts5(doc_id, chunk_id, body)")
            self.con.executemany("INSERT INTO chunks VALUES (?,?,?)",
                                 [(c["doc_id"], c["chunk_id"], " ".join(tokenize(c["text"])) + "\n" + c["text"])
                                  for c in chunk_docs(docs)])
            self.available = True
        except sqlite3.OperationalError:
            self.available = False

    def search(self, query, k=5):
        if not self.available:
            return []
        toks = sorted(set(tokenize(query)))
        if not toks:
            return []
        q = " OR ".join('"' + t.replace('"', '""') + '"' for t in toks)   # 토큰을 따옴표로 감싸 FTS5 문법 문자 무력화
        cur = self.con.execute(
            "SELECT doc_id, chunk_id, body, bm25(chunks) FROM chunks WHERE chunks MATCH ? ORDER BY bm25(chunks) LIMIT ?",
            (q, k))
        return [{"doc_id": d, "chunk_id": c, "score": round(-s, 4), "snippet": b.split("\n", 1)[-1][:160]}
                for d, c, b, s in cur.fetchall()]


if __name__ == "__main__":
    docs = {
        "SOP-ETCH-01": "식각 챔버 압력 상한은 50 mTorr 이다. 초과 시 즉시 공정을 중단한다.\n\n정비 후에는 리크 체크를 수행한다.",
        "SOP-CVD-02": "증착 온도는 400도를 유지한다.\n\nRF power 가 불안정하면 매칭 네트워크를 점검한다.",
    }
    idx = BM25Index(docs)
    hits = idx.search("챔버 압력 상한", k=2)
    assert hits and hits[0]["chunk_id"] == "SOP-ETCH-01#p1", hits
    assert idx.search("존재하지않는단어") == []
    cites = to_citations(hits)
    assert cites[0]["source_id"] == "SOP-ETCH-01" and "snippet" in cites[0]
    rf = idx.search("RF power 점검")
    assert rf[0]["chunk_id"] == "SOP-CVD-02#p2"
    # 회귀: 빈 질의·문법 문자·min_score·matched_terms
    assert idx.search("") == [] and idx.search("!!! ???") == []
    assert idx.search("챔버 압력 상한", k=2, min_score=1e9) == []
    assert hits[0]["matched_terms"] and len(hits[0]["matched_terms"]) >= 2
    fts = SqliteFTS(docs)
    if fts.available:
        assert fts.search("압력 상한")[0]["doc_id"] == "SOP-ETCH-01"
        assert fts.search("") == [] and fts.search("*** NOT (") == []
        assert fts.search('압력 " OR ( *') != [] or True   # 예외 없이 끝나면 충분
    print("OK fts_search" + ("" if fts.available else " (FTS5 없음, BM25만 확인)"))
