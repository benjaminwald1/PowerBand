import os, sys
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "families.py")).read().split("FAM = {")[0]
COSTV = float(os.environ.get("COSTV", "0.001")); src = src.replace("COST = 0.001", f"COST = {COSTV}")
exec(src)
FAM = {
 "current": {"5": berkshire(5)},
 "spy": {"-": spy},
 "momentum on famous picks": {f"pool{p}/hold{k}/{lk}": guru_momentum(p, k, lk) for p in (3, 10) for k in (5, 10) for lk in (126, 252)},
 "fixed: pool3/hold5/252": {"x": guru_momentum(3, 5, 252)},
 "fixed: pool3/hold8/252": {"x": guru_momentum(3, 8, 252)},
 "50/50 current + momentum picks": {"x": mix(berkshire(5), guru_momentum(3, 5, 252), 0.5)},
 "50/50 current + momentum picks (8)": {"x": mix(berkshire(5), guru_momentum(3, 8, 252), 0.5)},
}
curves = {(f, k): simulate(fn) for f, d in FAM.items() for k, fn in d.items()}
def stats(eq, a, b):
    seg = eq[a:b]; r = [seg[i] / seg[i - 1] - 1 for i in range(1, len(seg))]
    tot = seg[-1] / seg[0]; yrs = len(r) / 252; peak, dd = seg[0], 0
    for v in seg: peak = max(peak, v); dd = min(dd, v / peak - 1)
    return {"ret": tot - 1, "cagr": tot ** (1 / yrs) - 1, "dd": dd}
yr = lambda y: [i for i, d in enumerate(dates) if d[:4] == str(y)]
Y0 = int(os.environ.get("Y0", "2021")); YEARS = list(range(Y0, int(dates[-1][:4]) + 1))
out = {}
for fam, d in FAM.items():
    chain, rows, eqo = 1.0, [], [1.0]
    for Y in YEARS:
        te = yr(Y); tr = [i for i, x in enumerate(dates) if str(Y - 4) <= x[:4] < str(Y)] or [i for i, x in enumerate(dates) if x[:4] < str(Y)]
        best = max(d, key=lambda k: stats(curves[(fam, k)], tr[0], tr[-1] + 1)["cagr"])
        c = curves[(fam, best)]; r = stats(c, te[0], te[-1] + 1)["ret"]; chain *= 1 + r; rows.append(round(r * 100, 1))
        for j in te[1:]: eqo.append(eqo[-1] * c[j] / c[j - 1])
    n = sum(len(yr(Y)) for Y in YEARS) / 252; peak, dd = 1, 0
    for v in eqo: peak = max(peak, v); dd = min(dd, v / peak - 1)
    out[fam] = ((chain ** (1 / n) - 1) * 100, dd * 100, rows)
cur = out["current"][2]
for f, (c, dd, rows) in out.items():
    print(f"{c:5.1f}%/yr  drop {dd:6.1f}%  beats current {sum(a > b for a, b in zip(rows, cur))}/{len(rows)}  {f}  {rows}")
