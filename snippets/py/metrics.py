"""metrics: 회귀·분류·랭킹·스케줄 지표 (외부 라이브러리 없음).

용도: baseline 과 개선안을 같은 분할에서 같은 지표로 비교한다.
입력: y_true, y_pred(또는 score) 리스트. 분류는 y_true 가 0/1.
출력: float 또는 dict
사용 예:
  regression_report(y, yhat)            # MAE, RMSE, MAPE, R2
  classification_report(y, score, 0.5)  # precision, recall, f1, confusion, pr_auc, roc_auc
  recall_at_k(y, score, k=10)
"""
import math


def mae(y, p):
    return sum(abs(a - b) for a, b in zip(y, p)) / len(y)


def rmse(y, p):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(y, p)) / len(y))


def mape(y, p):
    pairs = [(a, b) for a, b in zip(y, p) if a != 0]
    return sum(abs((a - b) / a) for a, b in pairs) / len(pairs) * 100 if pairs else float("nan")


def r2(y, p):
    m = sum(y) / len(y)
    ss_tot = sum((a - m) ** 2 for a in y) or 1e-12
    return 1 - sum((a - b) ** 2 for a, b in zip(y, p)) / ss_tot


def regression_report(y, p):
    return {"mae": mae(y, p), "rmse": rmse(y, p), "mape": mape(y, p), "r2": r2(y, p), "n": len(y)}


def confusion(y, pred):
    tp = sum(1 for a, b in zip(y, pred) if a == 1 and b == 1)
    fp = sum(1 for a, b in zip(y, pred) if a == 0 and b == 1)
    fn = sum(1 for a, b in zip(y, pred) if a == 1 and b == 0)
    tn = sum(1 for a, b in zip(y, pred) if a == 0 and b == 0)
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn}


def precision_recall_f1(y, pred):
    c = confusion(y, pred)
    prec = c["tp"] / (c["tp"] + c["fp"]) if c["tp"] + c["fp"] else 0.0
    rec = c["tp"] / (c["tp"] + c["fn"]) if c["tp"] + c["fn"] else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    return {"precision": prec, "recall": rec, "f1": f1, **c}


def pr_auc(y, score):
    order = sorted(range(len(y)), key=lambda i: -score[i])
    total_pos = sum(y) or 1
    tp = fp = 0
    points = [(0.0, 1.0)]
    for i in order:
        if y[i] == 1:
            tp += 1
        else:
            fp += 1
        points.append((tp / total_pos, tp / (tp + fp)))
    area = 0.0
    for (r0, p0), (r1, p1) in zip(points, points[1:]):
        area += (r1 - r0) * (p0 + p1) / 2
    return area


def roc_auc(y, score):
    pos = [s for s, t in zip(score, y) if t == 1]
    neg = [s for s, t in zip(score, y) if t == 0]
    if not pos or not neg:
        return float("nan")
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def recall_at_k(y, score, k):
    order = sorted(range(len(y)), key=lambda i: -score[i])[:k]
    return sum(y[i] for i in order) / (sum(y) or 1)


def precision_at_k(y, score, k):
    order = sorted(range(len(y)), key=lambda i: -score[i])[:k]
    return sum(y[i] for i in order) / k


def classification_report(y, score, threshold=0.5, k=None):
    pred = [1 if s >= threshold else 0 for s in score]
    rep = precision_recall_f1(y, pred)
    rep.update({"pr_auc": pr_auc(y, score), "roc_auc": roc_auc(y, score), "positives": sum(y), "n": len(y)})
    if k:
        rep[f"recall@{k}"] = recall_at_k(y, score, k)
        rep[f"precision@{k}"] = precision_at_k(y, score, k)
    return rep


def schedule_kpis(jobs, schedule):
    """jobs=[{"id","due","priority"}], schedule=[{"jobId","end"}] → makespan, tardiness."""
    makespan = max((a["end"] for a in schedule), default=0)
    total = weighted = 0.0
    late = 0
    for j in jobs:
        ends = [a["end"] for a in schedule if a["jobId"] == j["id"]]
        if not ends:
            continue
        t = max(0, max(ends) - j["due"])
        total += t
        weighted += t * j.get("priority", 1)
        late += t > 0
    return {"makespan": makespan, "totalTardiness": total, "weightedTardiness": weighted, "lateJobs": late}


if __name__ == "__main__":
    y, p = [1, 2, 3, 4], [1.1, 1.9, 3.2, 3.8]
    rr = regression_report(y, p)
    assert abs(rr["mae"] - 0.15) < 1e-9 and rr["r2"] > 0.95 and 0 < rr["mape"] < 10

    yt = [1, 0, 1, 0, 0, 1]
    sc = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1]
    cr = classification_report(yt, sc, 0.5, k=2)
    assert cr == {**cr, "tp": 2, "fp": 1, "fn": 1, "tn": 2}
    assert abs(cr["roc_auc"] - 5 / 9) < 1e-9 and 0.6 < cr["pr_auc"] < 0.9
    assert abs(cr["recall@2"] - 1 / 3) < 1e-9 and cr["precision@2"] == 0.5
    assert pr_auc([1, 1, 0, 0], [0.9, 0.8, 0.2, 0.1]) == 1.0 and roc_auc([1, 0], [0.2, 0.9]) == 0.0

    k = schedule_kpis([{"id": "A", "due": 5, "priority": 2}, {"id": "B", "due": 3}],
                      [{"jobId": "A", "end": 7}, {"jobId": "B", "end": 2}])
    assert k == {"makespan": 7, "totalTardiness": 2, "weightedTardiness": 4, "lateJobs": 1}
    print("OK metrics")
