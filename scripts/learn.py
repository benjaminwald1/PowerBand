#!/usr/bin/env python3
"""The learner. Replays "copy Berkshire's top 5 after every 13F filing" over ~10 years of real filings and prices,
tries many exit/rebalance/valuation rules, and checks them WALK-FORWARD: rules are picked on earlier years and scored on
the next year they never saw. It only changes the live rules if the picked rules beat the current ones out of sample.
It also scores the model's own past odds against what really happened (the journal). Writes data/learning.json.
Not a price predictor: it can only keep or change rules, and a past edge may not repeat. Paper money only."""
import itertools, json, math, os, statistics, sys, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, ".local", "learn"); D = os.path.join(ROOT, "data")
FEE = 0.0   # no trading costs are modelled; real costs and taxes would lower every number
BUF, CAP, TOPN = 0.10, 0.25, 5

f13 = json.load(open(os.path.join(C, "13f_all.json")))
PX, EPS = {}, {}
for fn in os.listdir(C):
    if fn.startswith("px_"): PX[fn[3:-5]] = json.load(open(os.path.join(C, fn)))
    if fn.startswith("eps_"): EPS[fn[4:-5]] = json.load(open(os.path.join(C, fn)))
spy = PX["SPY"]["adj"]
dates = [d for d in sorted(spy) if d >= "2017-02-14"]
idx = {d: i for i, d in enumerate(dates)}

def series(t, kind="adj"):
    s, last, out = PX[t][kind], None, []
    for d in dates:
        last = s.get(d, last); out.append(last)
    return out
ADJ = {t: series(t) for t in PX if t != "SPY"}
RAW = {t: series(t, "raw") for t in PX if t != "SPY"}

def ttm_eps(t, d):
    cut = (datetime.date.fromisoformat(d) - datetime.timedelta(days=60)).isoformat()   # filings reach the market weeks after quarter end
    rows = sorted([r for r in EPS.get(t, []) if r["end"] <= cut], key=lambda r: r["end"])[-4:]
    return sum(r["eps"] for r in rows) if len(rows) == 4 else None
def pe(t, i):
    e, p = ttm_eps(t, dates[i]), RAW[t][i]
    return p / e if e and e > 0 and p else None

def weights(f):
    pos = [p for p in f["positions"] if p["ticker"] in ADJ][:TOPN]
    tot = sum(p["pct"] for p in pos) or 1
    w = {p["ticker"]: p["pct"] / tot * (1 - BUF) for p in pos}
    for _ in range(10):   # cap one stock at 25% and share the excess over the others
        over = {t for t, x in w.items() if x > CAP + 1e-9}
        if not over: break
        extra = sum(w[t] - CAP for t in over); free = {t for t in w if t not in over}
        for t in over: w[t] = CAP
        fs = sum(w[t] for t in free) or 1
        for t in free: w[t] += extra * w[t] / fs
    return w
FILINGS = sorted(({"filed": f["filed"], "w": weights(f)} for f in f13), key=lambda x: x["filed"])

def simulate(tp=None, sl=None, band=None, maxpe=None):
    cash, sh, entry, stopped, eq = 1.0, {}, {}, set(), []
    tgt, fi, last_month = {}, 0, ""
    def value(i): return cash + sum(n * ADJ[t][i] for t, n in sh.items() if ADJ[t][i])
    def rebalance(i, new_filing):
        nonlocal cash
        V = value(i); want = {}
        for t, w in tgt.items():
            if t in stopped or not ADJ[t][i]: continue
            if maxpe is not None:
                q = pe(t, i)
                if q is not None and q > maxpe: continue
            want[t] = w * V
        for t in list(sh):   # sells first
            cur = sh[t] * (ADJ[t][i] or 0)
            if cur > want.get(t, 0) + 1e-9:
                sell = cur - want.get(t, 0); sh[t] -= sell / ADJ[t][i]; cash += sell * (1 - FEE)
                if sh[t] <= 1e-12: del sh[t]; entry.pop(t, None)
        for t, d in want.items():
            cur = sh.get(t, 0) * ADJ[t][i]
            if d > cur + 1e-9:
                buy = min(d - cur, cash)
                if buy <= 0: continue
                n = buy / ADJ[t][i]; old = sh.get(t, 0)
                entry[t] = (entry.get(t, ADJ[t][i]) * old + ADJ[t][i] * n) / (old + n)
                sh[t] = old + n; cash -= buy
    for i, d in enumerate(dates):
        newf = False
        while fi < len(FILINGS) and FILINGS[fi]["filed"] < d:
            tgt = FILINGS[fi]["w"]; fi += 1; newf = True; stopped.clear()
        if newf: rebalance(i, True)
        for t in list(sh):   # exit rules, checked at each close
            p = ADJ[t][i]
            if not p: continue
            if (tp is not None and p >= entry[t] * (1 + tp / 100)) or (sl is not None and p <= entry[t] * (1 - sl / 100)):
                cash += sh[t] * p; del sh[t]; entry.pop(t, None); stopped.add(t)
        if band is not None and tgt and not newf and d[:7] != last_month:
            V = value(i)
            if V > 0 and any(abs(sh.get(t, 0) * (ADJ[t][i] or 0) / V - w) * 100 > band for t, w in tgt.items() if t not in stopped):
                rebalance(i, False)
        last_month = d[:7]
        eq.append(value(i) if tgt else 1.0)
    return eq

def stats(eq, a, b):
    seg = eq[a:b]
    if len(seg) < 20: return None
    r = [seg[i] / seg[i - 1] - 1 for i in range(1, len(seg))]
    tot = seg[-1] / seg[0]; yrs = len(r) / 252
    peak, dd = seg[0], 0
    for v in seg: peak = max(peak, v); dd = min(dd, v / peak - 1)
    sd = statistics.pstdev(r)
    return {"ret": tot - 1, "cagr": tot ** (1 / yrs) - 1 if yrs > 0.2 else tot - 1, "dd": dd, "sharpe": (statistics.mean(r) / sd * math.sqrt(252)) if sd else 0}
score = lambda s: s["cagr"] + 0.5 * s["dd"]   # growth, minus half the worst drop

GRID = list(itertools.product([None, 25, 50], [None, 15, 25], [None, 5, 10], [None, 40]))
DEFAULT = (25, 15, 5, None)   # the original rules this project started with, kept as a fixed yardstick
_lr = json.load(open(os.path.join(D, "seed", "exit_rules.json")))
LIVE = (None, None, None, None) if _lr.get("auto_exit", True) is False else tuple(None if v in (1000, 99, 100) else v for v in (_lr["take_profit_pct"], _lr["stop_loss_pct"], _lr["rebalance_band_points"])) + (_lr.get("max_pe"),)
curves = {g: simulate(*g) for g in GRID}
if LIVE not in curves: curves[LIVE] = simulate(*LIVE)
curves["none"] = curves[(None, None, None, None)]
base = [spy[d] for d in dates]; spy_eq = [v / base[0] for v in base]
yr = lambda y: [i for i, d in enumerate(dates) if d[:4] == str(y)]
folds, chain = [], {k: 1.0 for k in ("learned", "default", "none", "spy", "live")}
for Y in range(2021, int(dates[-1][:4]) + 1):
    te = yr(Y)
    tr = [i for i, d in enumerate(dates) if str(Y - 4) <= d[:4] < str(Y)]
    if not te or not tr: continue
    best = max(GRID, key=lambda g: score(stats(curves[g], tr[0], tr[-1] + 1)))
    row = {"year": Y, "chosen": {"take_profit": best[0], "stop_loss": best[1], "band": best[2], "max_pe": best[3]}}
    for k, eq in (("learned", curves[best]), ("default", curves[DEFAULT]), ("none", curves["none"]), ("spy", spy_eq), ("live", curves[LIVE])):
        s = stats(eq, te[0], te[-1] + 1); row[k] = round(s["ret"] * 100, 1); chain[k] *= 1 + s["ret"]
    folds.append(row)
n_years = sum(len(yr(r["year"])) for r in folds) / 252
oos = {k: {"cagr": round((chain[k] ** (1 / n_years) - 1) * 100, 1), "total": round((chain[k] - 1) * 100, 1)} for k in chain}
wins = sum(1 for r in folds if r["learned"] > r["default"])
# what would we pick today: the best rules over the most recent four years
tail = [i for i, d in enumerate(dates) if d >= (datetime.date.fromisoformat(dates[-1]) - datetime.timedelta(days=1461)).isoformat()]
cur = max(GRID, key=lambda g: score(stats(curves[g], tail[0], tail[-1] + 1)))
full = lambda g: {k: round(v * 100, 1) for k, v in stats(curves[g], 0, len(dates)).items() if k != "sharpe"} | {"sharpe": round(stats(curves[g], 0, len(dates))["sharpe"], 2)}
# Candidates are scored only on years they had not seen: the current rules, "no sell rules" (hold until the next filing), and the walk-forward learned rules.
cands = {"current": oos["live"]["cagr"], "no_rules": oos["none"]["cagr"], "learned": oos["learned"]["cagr"]}
best_name = max(cands, key=cands.get)
rv = lambda k: [r[k] for r in folds]
wins_of = {"no_rules": sum(1 for r in folds if r["none"] > r["live"]), "learned": sum(1 for r in folds if r["learned"] > r["live"]), "current": 0}
beat = cands[best_name] - cands["current"]
adopt = best_name != "current" and beat >= 1.0 and wins_of[best_name] >= math.ceil(len(folds) * 0.6)
rules_path = os.path.join(D, "seed", "exit_rules.json"); rules = json.load(open(rules_path))
live_before = {"take_profit_pct": rules["take_profit_pct"], "stop_loss_pct": rules["stop_loss_pct"], "rebalance_band_points": rules["rebalance_band_points"], "max_pe": rules.get("max_pe"), "auto_exit": rules.get("auto_exit", True)}
if adopt and best_name == "no_rules":
    rules["auto_exit"] = False   # the profit and stop prices stay on the page as alerts to review, but the plan no longer sells on them
elif adopt and best_name == "learned":
    rules.update(take_profit_pct=cur[0] or 1000, stop_loss_pct=cur[1] or 99, rebalance_band_points=cur[2] or 100, max_pe=cur[3], auto_exit=True)
elif not adopt and best_name == "current":
    pass
if adopt: json.dump(rules, open(rules_path, "w"), indent=1)
label = {"current": "the current rules", "no_rules": "no sell rules (hold until Berkshire's next filing)", "learned": "the learned rules"}
if adopt: reason = f"On years it had not seen, {label[best_name]} did best at {cands[best_name]:.1f}% a year against {cands['current']:.1f}% for the current rules, and won {wins_of[best_name]} of {len(folds)} years, so the plan switched to it."
elif best_name == "current": reason = f"The current rules held up. On years it had not seen they earned {cands['current']:.1f}% a year, and the best alternative it tried earned {(cands['learned'] if LIVE == (None, None, None, None) else max(cands['learned'], cands['no_rules'])):.1f}%, which is not clearly better, so nothing changed."
else: reason = f"On years it had not seen, {label[best_name]} earned {cands[best_name]:.1f}% a year against {cands['current']:.1f}% for the current rules. The edge was not clear enough to change anything (it needs 1+ points and most years)."
reason += f" For comparison the S&P 500 returned {oos['spy']['cagr']:.1f}% a year over the same unseen years."

# --- the journal: score the model's own past odds against what happened ---
def calibration():
    jp = os.path.join(D, "journal.json")
    J = json.load(open(jp)) if os.path.exists(jp) else []
    res = {1: [], 3: [], 12: []}; last = dates[-1]
    for e in J:
        t = e["ticker"]
        if t not in PX: continue
        raw = PX[t]["raw"]
        for k, (mo, days) in enumerate(((1, 30), (3, 91), (12, 365))):
            end = (datetime.date.fromisoformat(e["date"]) + datetime.timedelta(days=days)).isoformat()
            if end > last: continue
            path = [v for d, v in raw.items() if e["date"] <= d <= end]
            if len(path) < 2: continue
            for kind, lvl in (("profit", e["profit_level"]), ("stop", e["stop_level"])):
                hit = max(path) >= lvl if kind == "profit" else min(path) <= lvl
                res[mo].append((e["odds"][kind][k] / 100, 1.0 if hit else 0.0))
    out = {}
    for mo, v in res.items():
        if v: out[f"{mo}m"] = {"n": len(v), "predicted_pct": round(sum(a for a, _ in v) / len(v) * 100, 1), "happened_pct": round(sum(b for _, b in v) / len(v) * 100, 1), "brier": round(sum((a - b) ** 2 for a, b in v) / len(v), 3)}
    return {"entries": len(J), "matured": out}

res = {"generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "data": {"filings": len(f13), "first": dates[0], "last": dates[-1], "tickers": sorted(ADJ), "combos_tested": len(GRID)},
       "strategy": "Copy the top 5 stocks of each Berkshire 13F the day after it was filed, 10% cash buffer, 25% cap per stock",
       "walk_forward": {"folds": folds, "out_of_sample": oos, "wins_vs_current": wins_of, "years": len(folds)},
       "full_period": {"current_rules": full(DEFAULT), "no_rules": full((None, None, None, None)), "learned_now_in_sample": full(cur), "spy": {k: round(v * 100, 1) for k, v in stats(spy_eq, 0, len(dates)).items() if k != "sharpe"}},
       "learned_now": {"take_profit": cur[0], "stop_loss": cur[1], "band": cur[2], "max_pe": cur[3]}, "live_rules_before": live_before,
       "decision": {"adopted": adopt, "best": best_name, "reason": reason}, "calibration": calibration(),
       "caveats": ["Past results do not predict future ones, and ten years is a short sample with only one market cycle of note.", "No fees, taxes, spreads or slippage are modelled. Real trading would earn less.", "Prices are dividend-adjusted closes. Trades happen at the close after a filing is public.", "Berkshire's 13F shows long US stocks only. Some older tickers had no price history and were skipped.", "Trying 54 rule sets on the same history invites luck. That is why only unseen years count.", "The final choice among three options is made on the same six unseen years, so even that result is a little flattering."]}
old = json.load(open(os.path.join(D, "learning.json"))) if os.path.exists(os.path.join(D, "learning.json")) else {}
hist = old.get("history", []) + [{"date": res["generated"][:10], "adopted": adopt, "best": best_name, "oos": cands, "picked_now": res["learned_now"]}]
res["history"] = [h for k, h in enumerate(hist) if k == len(hist) - 1 or hist[k + 1]["date"] != h["date"]][-60:]   # one entry per day
res["last_change"] = {"date": res["generated"][:10], "to": best_name, "reason": reason} if adopt else old.get("last_change")
json.dump(res, open(os.path.join(D, "learning.json"), "w"), indent=1)
print(json.dumps({"oos": oos, "wins": wins_of, "adopt": adopt, "picked_now": res["learned_now"], "full": res["full_period"], "calibration": res["calibration"]}, indent=1))
