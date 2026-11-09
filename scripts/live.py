#!/usr/bin/env python3
"""Fetch delayed live quotes for the plan's tickers and write live.json (stdlib only).
The workflow publishes it to the `live` branch; the site polls it. No keys needed."""
import json, sys, time, urllib.request
plan = json.load(open("data/plan.json"))
tickers = sorted({b["ticker"] for p in plan["portfolios"] for b in p["buys"]})
prices, stamp = {}, 0
for t in tickers:
    for host in ("query1", "query2"):
        try:
            r = urllib.request.Request(
                f"https://{host}.finance.yahoo.com/v8/finance/chart/{t}?range=1d&interval=1m",
                headers={"User-Agent": "Mozilla/5.0"})
            m = json.load(urllib.request.urlopen(r, timeout=20))["chart"]["result"][0]["meta"]
            prices[t] = round(float(m["regularMarketPrice"]), 4)
            stamp = max(stamp, int(m.get("regularMarketTime", 0)))
            break
        except Exception as e:
            print("fail", t, host, e, file=sys.stderr); time.sleep(1)
if len(prices) != len(tickers):
    sys.exit("missing quotes, not publishing a partial update")
out = {"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
       "quote_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(stamp)),
       "prices": prices}
json.dump(out, open("live.json", "w"), indent=1)
print(out)
