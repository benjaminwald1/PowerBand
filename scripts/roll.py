#!/usr/bin/env python3
"""Daily paper-trading roll (stdlib only). After each market close:
 1. execute yesterday's queued reinvestment buys at today's OPEN price,
 2. mark the account to today's CLOSE (cash + shares * close) and record it,
 3. queue tomorrow's buys: top each stock up toward its target share of the NEW balance,
    using only cash above the 10% buffer. No sells (the plan only sells on Berkshire's next 13F).
State lives in data/ledger.json. Safe to re-run: a day already rolled is skipped."""
import json, sys, time, datetime, urllib.request
LG = json.load(open("data/ledger.json")); plan = json.load(open("data/plan.json"))
rows = {r["ticker"]: r["target_pct"] / 100 for r in plan["portfolios"][0]["rebalance"]["rows"]}
buffer = plan["portfolios"][0]["cash_buffer_pct"] / 100
bars = {}
for t in rows:
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
for d in todo:
    for o in LG["pending"]:                                    # 1) fill queued buys at the open
        px = bars[o["ticker"]][d][0]; sh = o["dollars"] / px
        h = LG["positions"][o["ticker"]]; h["shares"] += sh; h["cost"] += o["dollars"]; LG["cash"] -= o["dollars"]
        LG["buys"].append({"date": d, "ticker": o["ticker"], "shares": round(sh, 6), "price": round(px, 4), "dollars": o["dollars"]})
    LG["pending"] = []
    val = {t: LG["positions"][t]["shares"] * bars[t][d][1] for t in rows}   # 2) mark to the close
    equity = LG["cash"] + sum(val.values())
    LG["history"].append({"date": d, "equity": round(equity, 2), "cash": round(LG["cash"], 2)})
    spend = max(0.0, LG["cash"] - buffer * equity)                           # 3) queue tomorrow's top-ups
    want = {t: max(0.0, rows[t] * equity - val[t]) for t in rows}
    tot = sum(want.values())
    if tot > 0 and spend >= 10:
        k = min(1.0, spend / tot)
        LG["pending"] = [{"ticker": t, "dollars": round(w * k, 2), "queued": d} for t, w in want.items() if w * k >= 5]
    LG["last_roll"] = d
    print(d, "equity", round(equity, 2), "queued", LG["pending"])
LG["cash"] = round(LG["cash"], 2)
json.dump(LG, open("data/ledger.json", "w"), indent=1)
