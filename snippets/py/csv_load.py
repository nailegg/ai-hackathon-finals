"""csv_load: 인코딩·구분자 자동 감지 CSV 로더와 프로파일.

용도: 한글 CSV(cp949/euc-kr/utf-8-sig)를 안전하게 읽고 헤더 정규화, 컬럼 단위 타입 추론,
      결측·중복 키 요약을 한 번에 만든다. 데이터 계약(CONTRACT §4) 작성용.
입력: 파일 경로 (또는 load_text 로 문자열)
옵션: parse_dates=True (날짜 문자열을 datetime 으로), keep_as_text=[컬럼명...] (강제 문자열)
출력: rows(dict 리스트), meta {"header", "delimiter", "encoding", "warnings": [...]}
규칙:
  - 타입은 컬럼 단위로 정한다. 한 컬럼 안에 숫자와 문자열이 섞이면 전부 문자열로 둔다.
  - 정규화된 컬럼명이 `_id`, `_no`, `_code`, `code`, `id` 로 끝나면 항상 문자열 (조인 키 보호).
  - 앞자리 0이 있는 숫자("007")가 하나라도 있으면 그 컬럼은 문자열.
  - 날짜는 전부 파싱될 때만 datetime. 일부만 파싱되면 문자열로 두고 warnings 에 기록.
    뒤의 'Z' 는 떼고 naive datetime 으로 읽는다(UTC 벽시계). 시간대 변환은 호출자가 한다.
  - 정규화 후 헤더가 겹치면("Lot ID" 와 "lot_id") ValueError.
사용 예:
  rows, meta = load_csv("data/lots.csv")
  prof = profile(rows, meta["warnings"])
  dups = duplicate_keys(rows, ["lot_id", "wafer_id"])
"""
import csv
import io
import re
from datetime import datetime

ENCODINGS = ("utf-8-sig", "cp949", "euc-kr", "latin-1")
DATE_FORMATS = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M",
                "%Y-%m-%d", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S.%f")
MISSING = {"", "na", "nan", "null", "none", "-"}
ID_SUFFIXES = ("_id", "_no", "_code", "code", "id")
_LEADING_ZERO = re.compile(r"^0\d+$")
_INT = re.compile(r"^-?\d+$")


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


def _is_missing(s):
    return s is None or s.strip().lower() in MISSING


def _to_number(s):
    s = s.strip().replace(",", "")
    if _INT.match(s):
        return int(s)
    return float(s)  # ValueError 면 숫자 아님


def _to_datetime(s):
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1]
    for f in DATE_FORMATS:
        try:
            return datetime.strptime(s, f)
        except ValueError:
            pass
    raise ValueError(s)


def _infer_column(name, values, parse_dates, keep_as_text, warnings):
    """values: 원문 문자열 리스트. 반환: 변환된 값 리스트."""
    present = [v for v in values if not _is_missing(v)]
    out_missing = [None if _is_missing(v) else v.strip() for v in values]
    if name in keep_as_text or name.endswith(ID_SUFFIXES) or not present:
        return out_missing
    if any(_LEADING_ZERO.match(v.strip()) for v in present):
        warnings.append(f"{name}: 앞자리 0 값이 있어 문자열로 유지")
        return out_missing
    try:
        nums = {v: _to_number(v) for v in present}
        return [None if v is None else nums[v.strip()] if v.strip() in nums else nums[v] for v in
                [None if _is_missing(x) else x for x in values]]
    except ValueError:
        pass
    if parse_dates:
        parsed, failed = {}, 0
        for v in present:
            try:
                parsed[v.strip()] = _to_datetime(v)
            except ValueError:
                failed += 1
        if parsed and failed == 0:
            return [None if v is None else parsed[v] for v in out_missing]
        if parsed and failed:
            warnings.append(f"{name}: 날짜 {len(parsed)}건 파싱, {failed}건 실패 → 문자열 유지")
    return out_missing


def load_text(text, parse_dates=True, keep_as_text=None):
    keep_as_text = set(keep_as_text or [])
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    raw_header = next(reader)
    header = [normalize_header(h) for h in raw_header]
    if len(set(header)) != len(header):
        dup = sorted({h for h in header if header.count(h) > 1})
        raise ValueError(f"정규화 후 헤더 충돌: {dup} (원본: {raw_header})")
    records = [r for r in reader if any(c.strip() for c in r)]
    warnings = []
    columns = {}
    for i, h in enumerate(header):
        col = [r[i] if i < len(r) else "" for r in records]
        columns[h] = _infer_column(h, col, parse_dates, keep_as_text, warnings)
    rows = [{h: columns[h][k] for h in header} for k in range(len(records))]
    return rows, {"header": header, "delimiter": dialect.delimiter, "warnings": warnings}


def load_csv(path, parse_dates=True, keep_as_text=None):
    text, enc = read_text(path)
    rows, meta = load_text(text, parse_dates, keep_as_text)
    meta["encoding"] = enc
    return rows, meta


def profile(rows, warnings=None):
    if not rows:
        return {"rows": 0, "cols": 0, "columns": {}, "warnings": list(warnings or [])}
    cols = {}
    for c in rows[0]:
        vals = [r.get(c) for r in rows]
        present = [v for v in vals if v is not None]
        types = {type(v).__name__ for v in present}
        t = "empty" if not present else "datetime" if types == {"datetime"} else "int" if types <= {"int"} else \
            "float" if types <= {"int", "float"} else "str" if types == {"str"} else "mixed"
        info = {"type": t, "missing": len(vals) - len(present), "unique": len(set(map(str, present)))}
        if t in ("int", "float", "datetime") and present:
            info["min"], info["max"] = min(present), max(present)
        cols[c] = info
    return {"rows": len(rows), "cols": len(cols), "columns": cols, "warnings": list(warnings or [])}


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
    prof = profile(rows, meta["warnings"])
    assert prof["rows"] == 3 and prof["columns"]["수율"]["type"] == "float" and prof["columns"]["비고"]["missing"] == 2
    assert prof["columns"]["측정_시각"]["type"] == "datetime"
    assert duplicate_keys(rows, ["lot_id"]) == [("L1",)]
    utf = load_text("a,b\n1,x\n2,y\n")[0]
    assert utf[1] == {"a": 2, "b": "y"}
    # 회귀 1: ID 컬럼과 앞자리 0은 문자열 유지
    r, m = load_text("tool_id,qty,serial\n007,3,0012\n8,4,99\n")
    assert r[0]["tool_id"] == "007" and r[1]["tool_id"] == "8" and r[0]["qty"] == 3
    assert r[0]["serial"] == "0012" and r[1]["serial"] == "99" and any("serial" in w for w in m["warnings"])
    # 회귀 2: 초 없는 시각, Z 접미, 혼합 컬럼
    r, m = load_text("t1,t2,t3\n2026-01-01 10:00,2026-01-01T10:00:00Z,2026-01-01\n2026-01-01 11:30,2026-01-02T00:00:00Z,not-a-date\n")
    assert isinstance(r[0]["t1"], datetime) and r[0]["t1"].minute == 0 and r[1]["t1"].minute == 30
    assert isinstance(r[1]["t2"], datetime) and r[1]["t2"].day == 2
    assert r[0]["t3"] == "2026-01-01" and r[1]["t3"] == "not-a-date" and any("t3" in w for w in m["warnings"])
    # 회귀 3: parse_dates=False, keep_as_text
    r, _ = load_text("d,v\n2026-01-01,5\n", parse_dates=False, keep_as_text=["v"])
    assert r[0]["d"] == "2026-01-01" and r[0]["v"] == "5"
    # 회귀 4: 헤더 충돌
    try:
        load_text("Lot ID,lot_id\n1,2\n")
        raise AssertionError("header collision not raised")
    except ValueError as e:
        assert "헤더 충돌" in str(e)
    # 회귀 5: 숫자·문자 혼합 컬럼은 전부 문자열
    r, _ = load_text("x\n1\nabc\n2\n")
    assert r == [{"x": "1"}, {"x": "abc"}, {"x": "2"}]
    print("OK csv_load")
