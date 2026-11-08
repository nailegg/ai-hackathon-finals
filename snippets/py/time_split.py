"""time_split: 누수 없는 train/valid 분할과 누수 점검.

용도: 시간순 분할(cutoff 또는 비율), 그룹 단위 분할(같은 lot 이 양쪽에 못 들어감),
      누수 의심 컬럼 탐지(예측 시점 이후 타임스탬프, 타깃과 완전 상관, 분할 간 중복 id).
입력: rows = dict 리스트. 시간 컬럼은 비교 가능한 값(ISO 문자열, 숫자)이면 된다.
규칙: 비율 분할에서 같은 시각의 행은 양쪽에 나뉘지 않는다(경계를 다음 시각으로 민다).
      group_split 은 FNV-1a 32bit 해시 기반이라 seed 가 같으면 py/ts 가 같은 분할을 낸다.
출력: (train, valid) 또는 report dict
사용 예:
  train, valid = time_split(rows, time_col="t", frac=0.8)
  train, valid = group_split(rows, group_col="lot_id", frac=0.8, seed=0)
  report = leakage_report(rows, target="y", id_col="wafer_id", pred_time_col="t", time_cols=["measured_at"])
"""


def time_split(rows, time_col, cutoff=None, frac=0.8):
    ordered = sorted(rows, key=lambda r: r[time_col])
    if cutoff is not None:
        train = [r for r in ordered if r[time_col] < cutoff]
        valid = [r for r in ordered if r[time_col] >= cutoff]
    else:
        k = int(len(ordered) * frac)
        # 같은 시각의 행이 train/valid 로 갈리지 않게 경계를 다음 시각으로 민다
        while 0 < k < len(ordered) and ordered[k][time_col] == ordered[k - 1][time_col]:
            k += 1
        train, valid = ordered[:k], ordered[k:]
    return train, valid


def fnv1a32(text):
    """FNV-1a 32bit. ts 버전과 같은 값을 낸다."""
    h = 0x811C9DC5
    for b in str(text).encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def group_split(rows, group_col, frac=0.8, seed=0):
    """그룹 키 해시로 결정론적 분할. valid 비율 ≈ 1-frac. py/ts 동일 결과.
    모든 그룹이 한쪽으로 쏠리면 해시가 가장 작은 그룹을 반대쪽으로 옮긴다."""
    groups = sorted({str(r[group_col]) for r in rows})
    valid_permille = int(round((1 - frac) * 1000))
    valid_g = {g for g in groups if fnv1a32(f"{seed}:{g}") % 1000 < valid_permille}
    if len(groups) > 1:
        if not valid_g:
            valid_g = {min(groups, key=lambda g: fnv1a32(f"{seed}:{g}"))}
        elif valid_g == set(groups):
            valid_g.discard(max(groups, key=lambda g: fnv1a32(f"{seed}:{g}")))
    train = [r for r in rows if str(r[group_col]) not in valid_g]
    valid = [r for r in rows if str(r[group_col]) in valid_g]
    return train, valid


def _corr(xs, ys):
    n = len(xs)
    if n < 2:
        return 0.0
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    if sxx == 0 or syy == 0:
        return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sxx * syy) ** 0.5


def leakage_report(rows, target, id_col=None, pred_time_col=None, time_cols=(),
                   corr_threshold=0.99, train=None, valid=None):
    report = {"future_time_columns": [], "target_proxy_columns": [], "duplicate_ids_across_splits": [],
              "warnings": []}
    if pred_time_col:
        for c in time_cols:
            bad = sum(1 for r in rows if r.get(c) is not None and r.get(pred_time_col) is not None
                      and r[c] > r[pred_time_col])
            if bad:
                report["future_time_columns"].append({"column": c, "rows_after_prediction_time": bad})
    ys = [r.get(target) for r in rows]
    if all(isinstance(y, (int, float)) for y in ys) and ys:
        numeric_cols = [c for c in rows[0] if c != target and all(isinstance(r.get(c), (int, float)) for r in rows)]
        for c in numeric_cols:
            rho = _corr([float(r[c]) for r in rows], [float(y) for y in ys])
            if abs(rho) >= corr_threshold:
                report["target_proxy_columns"].append({"column": c, "corr": round(rho, 4)})
    if id_col and train is not None and valid is not None:
        dup = {r[id_col] for r in train} & {r[id_col] for r in valid}
        report["duplicate_ids_across_splits"] = sorted(dup)
    if report["future_time_columns"]:
        report["warnings"].append("예측 시점 이후 값이 있는 컬럼은 feature 에서 제외")
    if report["target_proxy_columns"]:
        report["warnings"].append("타깃과 거의 완전 상관인 컬럼은 라벨 누수 의심")
    if report["duplicate_ids_across_splits"]:
        report["warnings"].append("같은 id 가 train/valid 양쪽에 있음. group_split 사용")
    return report


if __name__ == "__main__":
    rows = [{"t": i, "lot_id": f"L{i // 3}", "wafer_id": f"W{i}", "x": i * 1.0, "leak": i * 2.0 + 1,
             "y": i * 2.0 + 1, "measured_at": i + (5 if i % 4 == 0 else -1)} for i in range(12)]
    tr, va = time_split(rows, "t", frac=0.75)
    assert len(tr) == 9 and max(r["t"] for r in tr) < min(r["t"] for r in va)
    tr2, va2 = time_split(rows, "t", cutoff=6)
    assert len(tr2) == 6 and va2[0]["t"] == 6

    gtr, gva = group_split(rows, "lot_id", frac=0.5, seed=1)
    assert not ({r["lot_id"] for r in gtr} & {r["lot_id"] for r in gva}) and gtr and gva
    # 회귀: 고정 fixture 의 분할 결과가 ts 와 같다 (fnv1a32 기준)
    assert fnv1a32("") == 0x811C9DC5 and fnv1a32("a") == 0xE40C292C
    fx = [{"g": g} for g in ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"]]
    _, fva = group_split(fx, "g", frac=0.75, seed=7)
    assert sorted(r["g"] for r in fva) == ["L1", "L4", "L6"], sorted(r["g"] for r in fva)
    # 회귀: 같은 시각의 행은 비율 분할에서 갈리지 않음
    dup = [{"t": t} for t in [1, 1, 2, 2, 2, 3]]
    dtr, dva = time_split(dup, "t", frac=0.5)
    assert len(dtr) == 5 and dva[0]["t"] == 3, (len(dtr), dva)

    rep = leakage_report(rows, target="y", id_col="wafer_id", pred_time_col="t", time_cols=["measured_at"],
                         train=rows[:8], valid=rows[6:])
    assert rep["future_time_columns"][0]["column"] == "measured_at"
    assert {c["column"] for c in rep["target_proxy_columns"]} == {"t", "leak", "x"}
    assert rep["duplicate_ids_across_splits"] == ["W6", "W7"] and len(rep["warnings"]) == 3
    print("OK time_split")
