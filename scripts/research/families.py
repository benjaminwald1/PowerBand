"""Round 2: new strategy families, all tested walk-forward (parameters picked on the 4 years before each test year).
Uses ~/clones/PowerBand/.local/learn/gurus (23 famous 13F filers, top 10 each quarter) and ETF prices."""
import json, math, os, statistics, sys, itertools
G = os.path.expanduser("~/clones/PowerBand/.local/learn/gurus")
COST = 0.001
F, PX = [], {}
for fn in os.listdir(G):
    if fn.startswith("px_"): PX[fn[3:-5]] = json.load(open(os.path.join(G, fn)))
    elif fn.endswith(".json"): F.append(json.load(open(os.path.join(G, fn))))
dates = [d for d in sorted(PX["SPY"]) if d >= "2016-03-01"]
def series(t):
    last, out = None, []
    for d in dates: last = PX[t].get(d, last); out.append(last)
    return out
A = {t: series(t) for t in PX}
F.sort(key=lambda f: f["filed"])
BRK = "0001067983"
ETF = {"SPY", "QQQ", "IEF", "EFA", "GLD", "BIL", "IVV", "VOO", "VTI", "IWM", "EEM", "XLE", "XLF", "DIA"}

def latest(i, max_age=200):
    """Each filer's newest filing that was public before dates[i], if not stale."""
    d = dates[i]; out = {}
    for f in F:
        if f["filed"] >= d: break
        out[f["cik"]] = f
    lim = date_minus(d, max_age)
    return {k: f for k, f in out.items() if f["filed"] >= lim}
def date_minus(d, n):
    import datetime; return (datetime.date.fromisoformat(d) - datetime.timedelta(days=n)).isoformat()
EXCL = set(filter(None, os.environ.get("EXCL", "").split(",")))
def has(t, i): return t not in EXCL and t in A and A[t][i] and (i < 1 or A[t][i - 1])
def mom(t, i, look, skip=0):
    s = A.get(t)
    if not s or i - look < 0 or not s[i - skip] or not s[i - look]: return None
    return s[i - skip] / s[i - look] - 1

def simulate(target, freq="m"):
    """Rebalance on the first trading day of each month ('m') or quarter ('q'), with a cost on dollars traded."""
    cash, sh, eq, last = 1.0, {}, [], ""
    for i, d in enumerate(dates):
        key = d[:7] if freq == "m" else d[:4] + str((int(d[5:7]) - 1) // 3)
        if key != last and i > 0:
            V = cash + sum(n * (A[t][i] or 0) for t, n in sh.items())
            w = {t: x for t, x in target(i).items() if x > 0 and has(t, i)}
            s = sum(w.values())
            if s:
                w = {t: x / s for t, x in w.items()}
                traded = sum(abs(w.get(t, 0) * V - sh.get(t, 0) * (A[t][i] or 0)) for t in set(w) | set(sh))
                V -= traded * COST; sh = {t: w[t] * V / A[t][i] for t in w}; cash = 0.0
        last = key
        eq.append(cash + sum(n * (A[t][i] or 0) for t, n in sh.items()))
    return eq

# ---- strategy families ----
def berkshire(n):
    def t(i):
        f = latest(i).get(BRK)
        return {p["ticker"]: p["pct"] for p in f["positions"][:n] if p["ticker"]} if f else {"SPY": 1}
    return t
def best_ideas(per, k, weight, exclude=()):
    """Each famous investor's top `per` holdings (their highest-conviction ideas). A stock's score is the sum of
    its % of each investor's 13F. Hold the `k` highest scores, equal-weighted or by score."""
    def t(i):
        sc = {}
        for cik, f in latest(i).items():
            if cik in exclude: continue
            for p in [p for p in f["positions"] if p["ticker"] and p["ticker"] not in ETF][:per]:
                sc[p["ticker"]] = sc.get(p["ticker"], 0) + p["pct"]
        top = sorted([x for x in sc if has(x, i)], key=lambda x: -sc[x])[:k]
        return {x: (1 if weight == "eq" else sc[x]) for x in top}
    return t
def consensus(minc, k):
    """Stocks in the top 10 of at least `minc` famous investors; hold up to k, most-shared first."""
    def t(i):
        c = {}
        for f in latest(i).values():
            for p in f["positions"]:
                if p["ticker"] and p["ticker"] not in ETF: c[p["ticker"]] = c.get(p["ticker"], 0) + 1
        top = sorted([x for x in c if c[x] >= minc and has(x, i)], key=lambda x: -c[x])[:k]
        return {x: 1 for x in top} or {"SPY": 1}
    return t
def guru_momentum(pool_per, k, look):
    """From every famous investor's top `pool_per`, hold the k stocks with the best past `look`-day return (skipping the last month)."""
    def t(i):
        pool = {p["ticker"] for f in latest(i).values() for p in f["positions"][:pool_per] if p["ticker"] and p["ticker"] not in ETF}
        m = sorted([(mom(x, i, look, 21), x) for x in pool if has(x, i) and mom(x, i, look, 21) is not None], reverse=True)[:k]
        return {x: 1 for _, x in m}
    return t
def dual_momentum(look):
    """Antonacci-style: if stocks beat T-bills over `look` days, hold the strongest of SPY/QQQ/EFA, else bonds (IEF)."""
    def t(i):
        r = {x: mom(x, i, look) for x in ("SPY", "QQQ", "EFA", "BIL")}
        if None in r.values(): return {"SPY": 1}
        if r["SPY"] <= r["BIL"]: return {"IEF": 1}
        return {max(("SPY", "QQQ", "EFA"), key=lambda x: r[x]): 1}
    return t
def mix(a, b, k):
    def t(i):
        x, y = a(i), b(i); sx, sy = sum(x.values()) or 1, sum(y.values()) or 1
        out = {s: v / sx * k for s, v in x.items()}
        for s, v in y.items(): out[s] = out.get(s, 0) + v / sy * (1 - k)
        return out
    return t
spy = lambda i: {"SPY": 1}
qqq = lambda i: {"QQQ": 1}

FAM = {
    "Berkshire top 5 (current)": {"5": berkshire(5)},
    "S&P 500 (SPY)": {"-": spy},
    "Nasdaq 100 (QQQ)": {"-": qqq},
    "Best ideas of 23 famous investors": {f"top{p}/hold{k}/{w}": best_ideas(p, k, w) for p in (1, 3) for k in (5, 10, 20) for w in ("eq", "score")},
    "Most-shared stocks among famous investors": {f">={m}/hold{k}": consensus(m, k) for m in (2, 3) for k in (10, 20)},
    "Famous investors' picks + momentum": {f"pool{p}/hold{k}/{lk}": guru_momentum(p, k, lk) for p in (3, 10) for k in (5, 10) for lk in (126, 252)},
    "Dual momentum (SPY/QQQ/EFA or bonds)": {str(lk): dual_momentum(lk) for lk in (126, 252)},
}
FAM["Half Berkshire, half best ideas"] = {"top3/hold10/score": mix(berkshire(5), best_ideas(3, 10, "score"), 0.5)}
curves = {}
for fam, d in FAM.items():
    for k, fn in d.items():
        curves[(fam, k)] = simulate(fn); print("ran", fam, k, file=sys.stderr, flush=True)
json.dump({f"{a}|{b}": c for (a, b), c in curves.items()} | {"_dates": dates}, open("/tmp/powerband_curves.json", "w"))

def stats(eq, a, b):
    seg = eq[a:b]; r = [seg[i] / seg[i - 1] - 1 for i in range(1, len(seg))]
    tot = seg[-1] / seg[0]; yrs = len(r) / 252; peak, dd = seg[0], 0
    for v in seg: peak = max(peak, v); dd = min(dd, v / peak - 1)
    return {"ret": tot - 1, "cagr": tot ** (1 / yrs) - 1, "dd": dd}
yr = lambda y: [i for i, d in enumerate(dates) if d[:4] == str(y)]
YEARS = list(range(2021, int(dates[-1][:4]) + 1))
def walk(fam_keys, pick=lambda s: s["cagr"]):
    chain, rows, eqo = 1.0, [], [1.0]
    for Y in YEARS:
        te = yr(Y); tr = [i for i, x in enumerate(dates) if str(Y - 4) <= x[:4] < str(Y)]
        best = max(fam_keys, key=lambda k: pick(stats(curves[k], tr[0], tr[-1] + 1)))
        c = curves[best]; r = stats(c, te[0], te[-1] + 1)["ret"]; chain *= 1 + r; rows.append((Y, best, round(r * 100, 1)))
        for j in te[1:]: eqo.append(eqo[-1] * c[j] / c[j - 1])
    n = sum(len(yr(Y)) for Y in YEARS) / 252; peak, dd = 1, 0
    for v in eqo: peak = max(peak, v); dd = min(dd, v / peak - 1)
    return {"cagr": round((chain ** (1 / n) - 1) * 100, 1), "dd": round(dd * 100, 1), "years": rows}
res = {fam: walk([(fam, k) for k in d]) for fam, d in FAM.items()}
res["ALL FAMILIES (picks the best family each year)"] = walk(list(curves))
cur = res["Berkshire top 5 (current)"]
for fam, o in sorted(res.items(), key=lambda x: -x[1]["cagr"]):
    wins = sum(1 for a, b in zip(o["years"], cur["years"]) if a[2] > b[2])
    print(f'{o["cagr"]:5.1f}%/yr  worst drop {o["dd"]:6.1f}%  beats current {wins}/{len(YEARS)}  {fam}')
    print("        " + "  ".join(f"{y}:{p}" + (f"[{b[1]}]" if len(FAM.get(fam, {1: 1, 2: 2})) > 1 else "") for y, b, p in o["years"]))
print("\nevery fixed variant, 2021 to now (in hindsight, for context):")
te0 = yr(2021)[0]
for k, c in sorted(curves.items(), key=lambda x: -stats(x[1], te0, len(dates))["cagr"])[:15]:
    s = stats(c, te0, len(dates)); print(f'  {s["cagr"]*100:5.1f}%/yr dd {s["dd"]*100:6.1f}%  {k[0]} [{k[1]}]')
