"""csv_load: 인코딩·구분자 자동 감지 CSV 로더와 프로파일.

용도: 한글 CSV(cp949/euc-kr/utf-8-sig)를 안전하게 읽고 헤더 정규화, 타입 추론,
      결측·중복 키 요약을 한 번에 만든다. 데이터 계약(CONTRACT §4) 작성용.
입력: 파일 경로 (또는 load_text 로 문자열)
출력: rows(dict 리스트, 값은 추론 타입으로 변환), profile dict
사용 예:
  rows, meta = load_csv("data/lots.csv")
  prof = profile(rows)
  dups = duplicate_keys(rows, ["lot_id", "wafer_id"])
"""
import csv
import io
from datetime import datetime

ENCODINGS = ("utf-8-sig", "cp949", "euc-kr", "latin-1")
DATE_FORMATS = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y/%m/%d %H:%M", "%Y/%m/%d", "%Y%m%d")


def read_text(path):
    raw = open(path, "rb").read()
    for enc in ENCODINGS:
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace"), "utf-8(replace)"


def normalize_header(h):
    return "_".join(h.strip().lower().replace("-", " ").split()).strip("_") or "col"


def infer(value):
    if value is None:
        return None
    s = value.strip()
    if s == "" or s.lower() in ("na", "nan", "null", "none", "-"):
        return None
    try:
        return int(s) if s.lstrip("-").isdigit() else float(s.replace(",", "")) if _is_float(s) else _date_or_str(s)
    except ValueError:
        return s


def _is_float(s):
    try:
        float(s.replace(",", ""))
        return True
    except ValueError:
        return False


def _date_or_str(s):
    for f in DATE_FORMATS:
        try:
            return datetime.strptime(s, f)
        except ValueError:
            pass
    return s


def load_text(text):
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    header = [normalize_header(h) for h in next(reader)]
    rows = [{h: infer(v) for h, v in zip(header, r)} for r in reader if any(c.strip() for c in r)]
    return rows, {"header": header, "delimiter": dialect.delimiter}


def load_csv(path):
    text, enc = read_text(path)
    rows, meta = load_text(text)
    meta["encoding"] = enc
    return rows, meta


def profile(rows):
    if not rows:
        return {"rows": 0, "cols": 0, "columns": {}}
    cols = {}
    for c in rows[0]:
        vals = [r.get(c) for r in rows]
        present = [v for v in vals if v is not None]
        types = {type(v).__name__ for v in present}
        t = "datetime" if types == {"datetime"} else "int" if types <= {"int"} else \
            "float" if types <= {"int", "float"} else "str" if types == {"str"} else "mixed"
        info = {"type": t, "missing": len(vals) - len(present), "unique": len(set(map(str, present)))}
        if t in ("int", "float", "datetime") and present:
            info["min"], info["max"] = min(present), max(present)
        cols[c] = info
    return {"rows": len(rows), "cols": len(cols), "columns": cols}


def duplicate_keys(rows, key_cols):
    seen, dups = set(), []
    for r in rows:
        k = tuple(r.get(c) for c in key_cols)
        if k in seen:
            dups.append(k)
        seen.add(k)
    return dups


if __name__ == "__main__":
    import os
    import tempfile
    text = "Lot ID;설비;측정 시각;수율;비고\nL1;T1;2026-01-01 10:00:00;97.5;\nL2;T2;2026-01-01 11:00:00;92;NA\nL1;T1;2026-01-02 09:30:00;1,234.5;메모\n"
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "a.csv")
        open(p, "wb").write(text.encode("cp949"))
        rows, meta = load_csv(p)
    assert meta["encoding"] == "cp949" and meta["delimiter"] == ";"
    assert meta["header"] == ["lot_id", "설비", "측정_시각", "수율", "비고"]
    assert rows[0]["수율"] == 97.5 and rows[1]["수율"] == 92 and rows[2]["수율"] == 1234.5
    assert isinstance(rows[0]["측정_시각"], datetime) and rows[1]["비고"] is None
    prof = profile(rows)
    assert prof["rows"] == 3 and prof["columns"]["수율"]["type"] == "float" and prof["columns"]["비고"]["missing"] == 2
    assert prof["columns"]["측정_시각"]["type"] == "datetime"
    assert duplicate_keys(rows, ["lot_id"]) == [("L1",)]
    utf = load_text("a,b\n1,x\n2,y\n")[0]
    assert utf[1] == {"a": 2, "b": "y"}
    print("OK csv_load")
