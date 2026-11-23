#!/usr/bin/env python3
"""Daily paper-trading roll (stdlib only). After each market close:
 1. fill yesterday's queued orders at today's OPEN price: sells first, then buys with the cash there is,
 2. mark the account to today's CLOSE (cash + shares * close) and record it,
 3. queue tomorrow's orders. When the targets change (scripts/targets.py rebuilds them each month), rebalance every
    stock to its new target weight (sell what is over, buy what is under), as the backtest does.
    Otherwise only top each stock up toward its target with cash above the buffer. No sells on price.
Shares are tracked in FIFO tax lots; each sell records its cost basis, gain and short or long term.
State lives in data/ledger.json. Safe to re-run: a day already rolled is skipped."""
import json, math, sys, time, datetime, urllib.request
LG = json.load(open("data/ledger.json")); plan = json.load(open("data/plan.json"))
rows = {r["ticker"]: r["target_pct"] / 100 for r in plan["portfolios"][0]["rebalance"]["rows"]}
buffer = plan["portfolios"][0]["cash_buffer_pct"] / 100
MIN = 5   # smallest order worth placing, dollars
LG.setdefault("lots", []); LG.setdefault("sells", [])
tickers = sorted(set(rows) | set(LG["positions"]))   # include stocks still held that a new filing dropped, so they can be sold
bars = {}
for t in tickers:
    for host in ("query1", "query2"):
        try:
            r = urllib.request.Request(f"https://{host}.finance.yahoo.com/v8/finance/chart/{t}?range=1mo&interval=1d",
                                       headers={"User-Agent": "Mozilla/5.0"})
            d = json.load(urllib.request.urlopen(r, timeout=20))["chart"]["result"][0]
            off = d["meta"].get("gmtoffset", -18000); q = d["indicators"]["quote"][0]
            end = d["meta"]["currentTradingPeriod"]["regular"]["end"]
            bars[t] = {datetime.datetime.utcfromtimestamp(ts + off).strftime("%Y-%m-%d"): (o, c)
                       for ts, o, c in zip(d["timestamp"], q["open"], q["close"]) if o and c}
            closed = time.time() >= end
            break
        except Exception as e:
            print("fail", t, host, e, file=sys.stderr); time.sleep(1)
    else:
        sys.exit(f"no data for {t}; not rolling")
days = sorted(set.intersection(*[set(b) for b in bars.values()]))
today = max(days)
if not closed and today == datetime.datetime.utcnow().strftime("%Y-%m-%d"): days = [d for d in days if d != today]   # day still in progress
todo = [d for d in days if d > LG["last_roll"]]
if not todo: sys.exit("nothing new to roll")

def buy(t, dollars, px, d):
    sh = dollars / px
    h = LG["positions"].setdefault(t, {"shares": 0.0, "cost": 0.0}); h["shares"] += sh; h["cost"] += dollars; LG["cash"] -= dollars
    LG["buys"].append({"date": d, "ticker": t, "shares": round(sh, 6), "price": round(px, 4), "dollars": dollars})
    LG["lots"].append({"ticker": t, "date": d, "shares": sh, "cost": dollars})

def sell(t, sh, px, d):
    h = LG["positions"][t]; sh = min(sh, h["shares"]); left, basis, longt = sh, 0.0, 0.0
    for lot in [l for l in LG["lots"] if l["ticker"] == t]:   # first in, first out
        if left <= 1e-12: break
        take = min(left, lot["shares"]); c = lot["cost"] * take / lot["shares"]
        if (datetime.date.fromisoformat(d) - datetime.date.fromisoformat(lot["date"])).days > 365: longt += take * px - c
        basis += c; lot["shares"] -= take; lot["cost"] -= c; left -= take
    LG["lots"] = [l for l in LG["lots"] if l["shares"] > 1e-9]
    proceeds = round(sh * px, 2); h["shares"] -= sh; h["cost"] -= basis; LG["cash"] += proceeds
    if h["shares"] <= 1e-9: del LG["positions"][t]; LG["lots"] = [l for l in LG["lots"] if l["ticker"] != t]   # no rounding crumbs left behind
    gain = proceeds - basis
    LG["sells"].append({"date": d, "ticker": t, "shares": round(sh, 6), "price": round(px, 4), "dollars": proceeds,
                        "basis": round(basis, 2), "gain": round(gain, 2), "long_term_gain": round(longt, 2), "short_term_gain": round(gain - longt, 2)})

for d in todo:
    sells = [o for o in LG["pending"] if o["dollars"] < 0]; buys = [o for o in LG["pending"] if o["dollars"] > 0]
    for o in sells:                                            # 1) fill queued orders at the open, sells first
        if o["ticker"] not in LG["positions"]: continue
        px = bars[o["ticker"]][d][0]
        sell(o["ticker"], LG["positions"][o["ticker"]]["shares"] if o.get("all") else -o["dollars"] / px, px, d)
    need = sum(o["dollars"] for o in buys); k = min(1.0, max(0.0, LG["cash"]) / need) if need else 0   # the open can pay a little less than the close did
    for o in buys:
        dollars = math.floor(o["dollars"] * k * 100) / 100   # round down so cash never dips below zero
        if dollars >= 1: buy(o["ticker"], dollars, bars[o["ticker"]][d][0], d)
    LG["pending"] = []
    val = {t: h["shares"] * bars[t][d][1] for t, h in LG["positions"].items()}   # 2) mark to the close
    equity = LG["cash"] + sum(val.values())
    LG["history"].append({"date": d, "equity": round(equity, 2), "cash": round(LG["cash"], 2)})
    ver = plan.get("targets_version") or plan["as_of_13f"]
    if ver != LG.get("targets_as_of"):                          # 3a) new targets: rebalance everything to the new weights
        want = {t: rows.get(t, 0.0) * equity for t in set(rows) | set(val)}
        out = [{"ticker": t, "dollars": -round(val[t] - w, 2), "all": w == 0, "queued": d, "why": "new targets"}
               for t, w in want.items() if t in val and val[t] - w >= MIN]
        inn = [{"ticker": t, "dollars": round(w - val.get(t, 0.0), 2), "queued": d, "why": "new targets"}
               for t, w in want.items() if w - val.get(t, 0.0) >= MIN]
        LG["pending"] = sorted(out, key=lambda o: o["ticker"]) + sorted(inn, key=lambda o: o["ticker"])
        LG["targets_as_of"] = ver
    else:                                                       # 3b) top-ups with spare cash
        spend = max(0.0, LG["cash"] - buffer * equity)
        want = {t: max(0.0, rows[t] * equity - val.get(t, 0.0)) for t in rows}
        tot = sum(want.values())
        if tot > 0 and spend >= 10:
            k = min(1.0, spend / tot)
            LG["pending"] = [{"ticker": t, "dollars": round(w * k, 2), "queued": d} for t, w in want.items() if w * k >= MIN]
    LG["last_roll"] = d
    print(d, "equity", round(equity, 2), "queued", LG["pending"])
LG["cash"] = round(LG["cash"], 2) + 0.0   # no "-0.0"
for l in LG["lots"]: l["shares"] = round(l["shares"], 8); l["cost"] = round(l["cost"], 4)
json.dump(LG, open("data/ledger.json", "w"), indent=1)
