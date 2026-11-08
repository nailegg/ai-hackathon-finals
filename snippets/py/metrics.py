"""metrics: 회귀·분류·랭킹·스케줄 지표 (외부 라이브러리 없음).

용도: baseline 과 개선안을 같은 분할에서 같은 지표로 비교한다.
      sklearn 이 설치돼 있으면 채점기와 숫자를 맞추기 위해 sklearn.metrics 를 우선 쓰고,
      이 파일은 없을 때의 대체다. pr_auc 는 sklearn average_precision_score 와 같은 정의
      (양성마다 그 순위의 precision 을 더함, 동점은 한 블록으로 처리)다.
입력: y_true, y_pred(또는 score) 리스트. 길이가 다르면 ValueError. 분류는 y_true 가 0/1.
출력: float 또는 dict
사용 예:
  regression_report(y, yhat)            # mae, rmse, mape, mape_skipped_zero, r2, n
  classification_report(y, score, 0.5)  # precision, recall, f1, confusion, pr_auc, roc_auc
  recall_at_k(y, score, k=10)
"""
import math


def _check(y, p, name="metric"):
    if len(y) != len(p):
        raise ValueError(f"{name}: 길이 불일치 {len(y)} != {len(p)}")
    if len(y) == 0:
        raise ValueError(f"{name}: 빈 입력")


def mae(y, p):
    _check(y, p, "mae")
    return sum(abs(a - b) for a, b in zip(y, p)) / len(y)


def rmse(y, p):
    _check(y, p, "rmse")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(y, p)) / len(y))


def mape_skipped(y, p):
    """y == 0 이라 MAPE 에서 제외된 행 수."""
    _check(y, p, "mape")
    return sum(1 for a in y if a == 0)


def mape(y, p):
    """퍼센트. y == 0 행은 제외하며, 제외 수는 mape_skipped() 또는 regression_report 로 확인."""
    _check(y, p, "mape")
    pairs = [(a, b) for a, b in zip(y, p) if a != 0]
    return sum(abs((a - b) / a) for a, b in pairs) / len(pairs) * 100 if pairs else float("nan")


def r2(y, p):
    _check(y, p, "r2")
    m = sum(y) / len(y)
    ss_tot = sum((a - m) ** 2 for a in y) or 1e-12
    return 1 - sum((a - b) ** 2 for a, b in zip(y, p)) / ss_tot


def regression_report(y, p):
    return {"mae": mae(y, p), "rmse": rmse(y, p), "mape": mape(y, p),
            "mape_skipped_zero": mape_skipped(y, p), "r2": r2(y, p), "n": len(y)}


def confusion(y, pred):
    _check(y, pred, "confusion")
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


def _score_blocks(y, score):
    """점수 내림차순, 동점은 한 블록: [(pos_in_block, neg_in_block), ...]"""
    order = sorted(range(len(y)), key=lambda i: -score[i])
    blocks, i = [], 0
    while i < len(order):
        j = i
        pos = neg = 0
        while j < len(order) and score[order[j]] == score[order[i]]:
            if y[order[j]] == 1:
                pos += 1
            else:
                neg += 1
            j += 1
        blocks.append((pos, neg))
        i = j
    return blocks


def pr_auc(y, score):
    """Average precision (sklearn 정의). 동점은 블록 단위라 입력 순서에 무관."""
    _check(y, score, "pr_auc")
    total_pos = sum(1 for t in y if t == 1)
    if total_pos == 0:
        return float("nan")
    tp = fp = 0
    ap = 0.0
    for pos, neg in _score_blocks(y, score):
        tp += pos
        fp += neg
        if pos:
            ap += (pos / total_pos) * (tp / (tp + fp))
    return ap


def roc_auc(y, score):
    _check(y, score, "roc_auc")
    pos = [s for s, t in zip(score, y) if t == 1]
    neg = [s for s, t in zip(score, y) if t == 0]
    if not pos or not neg:
        return float("nan")
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def _top_k(y, score, k):
    """동점은 원래 인덱스 순으로 결정론적."""
    _check(y, score, "top_k")
    return sorted(range(len(y)), key=lambda i: (-score[i], i))[:k]


def recall_at_k(y, score, k):
    return sum(y[i] for i in _top_k(y, score, k)) / (sum(y) or 1)


def precision_at_k(y, score, k):
    return sum(y[i] for i in _top_k(y, score, k)) / k


def classification_report(y, score, threshold=0.5, k=None):
    _check(y, score, "classification_report")
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
    assert abs(rr["mae"] - 0.15) < 1e-9 and rr["r2"] > 0.95 and 0 < rr["mape"] < 10 and rr["mape_skipped_zero"] == 0

    yt = [1, 0, 1, 0, 0, 1]
    sc = [0.9, 0.8, 0.7, 0.3, 0.2, 0.1]
    cr = classification_report(yt, sc, 0.5, k=2)
    assert cr == {**cr, "tp": 2, "fp": 1, "fn": 1, "tn": 2}
    assert abs(cr["roc_auc"] - 5 / 9) < 1e-9
    # AP 수기: 양성 순위 1(1/1), 3(2/3), 6(3/6) → (1 + 2/3 + 0.5)/3
    assert abs(cr["pr_auc"] - (1 + 2 / 3 + 0.5) / 3) < 1e-9, cr["pr_auc"]
    assert abs(cr["recall@2"] - 1 / 3) < 1e-9 and cr["precision@2"] == 0.5
    assert pr_auc([1, 1, 0, 0], [0.9, 0.8, 0.2, 0.1]) == 1.0 and roc_auc([1, 0], [0.2, 0.9]) == 0.0

    # 회귀 1: 길이 불일치는 예외
    try:
        mae([1, 2, 3], [1])
        raise AssertionError("length mismatch not raised")
    except ValueError:
        pass
    # 회귀 2: mape 의 y=0 제외 수 보고
    rr0 = regression_report([0, 2, 4], [0, 2, 3])
    assert rr0["mape_skipped_zero"] == 1 and abs(rr0["mape"] - 12.5) < 1e-9
    # 회귀 3: pr_auc 는 AP 정의 (sklearn 과 동일), 동점은 입력 순서 무관
    assert abs(pr_auc([0, 1], [0.9, 0.1]) - 0.5) < 1e-12, pr_auc([0, 1], [0.9, 0.1])
    tie_a = pr_auc([1, 0, 0, 0, 0, 0, 0, 0], [0.5] * 8)
    tie_b = pr_auc([0, 0, 0, 0, 0, 0, 0, 1], [0.5] * 8)
    assert abs(tie_a - tie_b) < 1e-12 and abs(tie_a - 1 / 8) < 1e-12, (tie_a, tie_b)
    assert math.isnan(pr_auc([0, 0], [0.1, 0.2]))

    k = schedule_kpis([{"id": "A", "due": 5, "priority": 2}, {"id": "B", "due": 3}],
                      [{"jobId": "A", "end": 7}, {"jobId": "B", "end": 2}])
    assert k == {"makespan": 7, "totalTardiness": 2, "weightedTardiness": 4, "lateJobs": 1}
    print("OK metrics")
