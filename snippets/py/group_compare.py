"""group_compare: 이상 점수와 집단 비교 표.

용도: 설비·Recipe 그룹별 robust z-score, 시계열 rolling z-score, EWMA 경보,
      이상군 vs 정상군 비교 표(효과크기 포함)로 원인 "후보" 랭킹을 만든다.
입력: rows = [{"group": "T1", "t": 3, "value": 1.2, ...}] 같은 dict 리스트
출력: dict 리스트. 각 행에 사람이 읽을 "evidence" 문자열 포함
사용 예:
  scored = robust_z_by_group(rows, key="tool_id", value="temp")
  alarms = ewma_alarm([r["value"] for r in series], lam=0.3, k=3)
  table = compare_groups(abnormal_rows, normal_rows, features=["temp", "pressure"])
"""
import math
import statistics as st


def robust_z_by_group(rows, key, value, min_n=3):
    groups = {}
    for r in rows:
        if r.get(value) is not None:
            groups.setdefault(r[key], []).append(r)
    out = []
    for g, items in groups.items():
        vals = [float(r[value]) for r in items]
        med = st.median(vals)
        mad = st.median([abs(v - med) for v in vals]) or 1e-9
        for r in items:
            z = 0.6745 * (float(r[value]) - med) / mad if len(vals) >= min_n else 0.0
            out.append({**r, "robust_z": round(z, 3),
                        "evidence": f"{key}={g} {value}={r[value]} median={med:.3g} MAD={mad:.3g} n={len(vals)}"})
    out.sort(key=lambda r: -abs(r["robust_z"]))
    return out


def rolling_z(values, window=10):
    """각 시점의 값을 직전 window 개의 평균·표준편차로 표준화(미래 정보 사용 안 함)."""
    out = []
    for i, v in enumerate(values):
        hist = values[max(0, i - window):i]
        if len(hist) < 2:
            out.append(0.0)
            continue
        mu, sd = st.mean(hist), st.pstdev(hist) or 1e-9
        out.append((v - mu) / sd)
    return out


def ewma_alarm(values, lam=0.3, k=3.0, warmup=5):
    """EWMA 와 warmup 구간 표준편차 기반 경보. 반환: [{"i","value","ewma","alarm"}]."""
    if len(values) < warmup + 1:
        return [{"i": i, "value": v, "ewma": v, "alarm": False} for i, v in enumerate(values)]
    base = values[:warmup]
    mu, sd = st.mean(base), st.pstdev(base) or 1e-9
    limit = k * sd * math.sqrt(lam / (2 - lam))
    ewma, out = mu, []
    for i, v in enumerate(values):
        ewma = lam * v + (1 - lam) * ewma
        out.append({"i": i, "value": v, "ewma": round(ewma, 4), "alarm": i >= warmup and abs(ewma - mu) > limit})
    return out


def _cohens_d(a, b):
    if len(a) < 2 or len(b) < 2:
        return 0.0
    sp = math.sqrt(((len(a) - 1) * st.variance(a) + (len(b) - 1) * st.variance(b)) / (len(a) + len(b) - 2)) or 1e-9
    return (st.mean(a) - st.mean(b)) / sp


def _rank_biserial(a, b):
    """Mann-Whitney U 기반 rank-biserial (-1~1). 양수면 a 가 크다."""
    wins = sum((x > y) - (x < y) for x in a for y in b)
    return wins / (len(a) * len(b)) if a and b else 0.0


def compare_groups(abnormal, normal, features):
    rows = []
    for f in features:
        a = [float(r[f]) for r in abnormal if r.get(f) is not None]
        b = [float(r[f]) for r in normal if r.get(f) is not None]
        if not a or not b:
            continue
        d, rb = _cohens_d(a, b), _rank_biserial(a, b)
        rows.append({
            "feature": f, "n_abnormal": len(a), "n_normal": len(b),
            "mean_abnormal": round(st.mean(a), 4), "mean_normal": round(st.mean(b), 4),
            "median_abnormal": round(st.median(a), 4), "median_normal": round(st.median(b), 4),
            "std_abnormal": round(st.pstdev(a), 4), "std_normal": round(st.pstdev(b), 4),
            "diff": round(st.mean(a) - st.mean(b), 4), "cohens_d": round(d, 3), "rank_biserial": round(rb, 3),
            "evidence": f"{f}: 이상군 평균 {st.mean(a):.3g} vs 정상군 {st.mean(b):.3g} (d={d:.2f}, n={len(a)}/{len(b)}). 원인 후보이며 인과 확정 아님",
        })
    rows.sort(key=lambda r: -abs(r["cohens_d"]))
    return rows


if __name__ == "__main__":
    rows = [{"tool": "T1", "v": x} for x in [10, 10.2, 9.9, 10.1, 15.0]] + \
           [{"tool": "T2", "v": x} for x in [20, 20.1, 19.9, 20.2]]
    scored = robust_z_by_group(rows, "tool", "v")
    assert scored[0]["v"] == 15.0 and scored[0]["tool"] == "T1" and scored[0]["robust_z"] > 3

    rz = rolling_z([1, 1, 1, 1, 1, 1, 9], window=5)
    assert rz[-1] > 3 and rz[0] == 0.0

    al = ewma_alarm([1, 1.1, 0.9, 1.0, 1.05, 1.0, 1.0, 3.0, 3.0, 3.0], lam=0.3, k=3)
    assert any(a["alarm"] for a in al) and not any(a["alarm"] for a in al[:7])

    abn = [{"temp": 110, "pres": 5.0}, {"temp": 112, "pres": 5.1}, {"temp": 111, "pres": 4.9}]
    nor = [{"temp": 100, "pres": 5.0}, {"temp": 101, "pres": 5.05}, {"temp": 99, "pres": 4.95}, {"temp": 100, "pres": 5.0}]
    tbl = compare_groups(abn, nor, ["temp", "pres"])
    assert tbl[0]["feature"] == "temp" and tbl[0]["rank_biserial"] == 1.0 and "evidence" in tbl[0]
    print("OK group_compare")
