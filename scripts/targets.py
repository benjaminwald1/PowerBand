#!/usr/bin/env python3
"""Rebuild data/seed/targets.json once a month (the first daily run of a new month), the way the backtest rebalanced:
  half the money: Berkshire's top 5 stocks at Berkshire's own weights (its newest 13F),
  half the money: famous investors' momentum picks. Take the 3 biggest holdings of each of the 23 well-known 13F filers
  in trader-copycat's filers.json (newest filing, if filed in the last 200 days), and hold the 5 whose price rose most
  from 12 months ago to 1 month ago, 10% each.
A stock in both halves gets both shares. roll.py rebalances the account at the next open whenever the version changes.
Needs ~/clones/trader-skill and an SEC User-Agent (SEC_USER_AGENT env var or the git-ignored .local/sec_user_agent).
Usage: python3 scripts/targets.py [--force]"""
import datetime, json, os, subprocess, sys, tempfile, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SK = os.path.expanduser("~/clones/trader-skill/trader-copycat")
TP = os.path.join(ROOT, "data", "seed", "targets.json")
BRK, PER, PICKS, LOOK, SKIP, MAX_AGE = "0001067983", 3, 5, 252, 21, 200
ETF = {"SPY", "QQQ", "IEF", "EFA", "GLD", "BIL", "IVV", "VOO", "VTI", "IWM", "EEM", "XLE", "XLF", "DIA"}
uf = os.path.join(ROOT, ".local", "sec_user_agent")
ua = os.environ.get("SEC_USER_AGENT") or (open(uf).read().strip() if os.path.exists(uf) else "")
if not ua: sys.exit("no SEC User-Agent; skipping the monthly targets")
old = json.load(open(TP))
month = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-5))).strftime("%Y-%m")   # New York, near enough
if old.get("version") == month and "--force" not in sys.argv:
    print("targets already built for", month); sys.exit(0)

def cc(*a):
    r = subprocess.run([sys.executable, os.path.join(SK, "edgar13f.py"), *a, "--user-agent", ua, "--json"], capture_output=True, text=True, cwd=tmp)
    if r.returncode: raise RuntimeError((r.stderr or r.stdout)[-300:])
    return json.loads(r.stdout)
def closes(t):
    for host in ("query1", "query2"):
        try:
            u = f"https://{host}.finance.yahoo.com/v8/finance/chart/{t.replace('.', '-')}?range=2y&interval=1d&includeAdjustedClose=true"
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20))["chart"]["result"][0]
            return [c for c in d["indicators"]["adjclose"][0]["adjclose"] if c]
        except Exception: time.sleep(1)
    return None

today = datetime.date.today()
with tempfile.TemporaryDirectory() as tmp:
    # half 1: Berkshire's top 5
    brk = cc("copy", BRK, "--top", "5", "--combine", "--out", os.path.join(tmp, "b.json"))
    brk = json.load(open(os.path.join(tmp, "b.json")))
    # half 2: every famous investor's 3 biggest holdings, then the 5 with the best 12-1 month price move
    cand = {}
    for f in json.load(open(os.path.join(SK, "filers.json")))["filers"]:
        try:
            fl = [x for x in cc("filings", f["cik"], "--limit", "8")["filings"] if x["form"] == "13F-HR"]
            if not fl: continue
            new = max(fl, key=lambda x: (x["period"], x["filed"]))
            if (today - datetime.date.fromisoformat(new["filed"])).days > MAX_AGE: continue
            h = cc("holdings", f["cik"], "--period", new["period"], "--combine", "--top", "10")
        except Exception as e:
            print("skipped", f["name"], str(e)[:80]); continue
        top = [p for p in h["positions"] if not p.get("put_call") and p.get("ticker") and p["ticker"] not in ETF][:PER]
        for p in top:
            c = cand.setdefault(p["ticker"], {"ticker": p["ticker"], "name": p.get("name") or p.get("issuer"), "held_by": []})
            c["held_by"].append({"investor": f.get("person") or f["name"], "firm": f["name"], "pct_of_13f": p["pct_of_13f"], "quarter": new["period"]})
        time.sleep(0.2)
for c in cand.values():
    px = closes(c["ticker"])
    c["move_12_1"] = round((px[-1 - SKIP] / px[-1 - LOOK] - 1) * 100, 1) if px and len(px) > LOOK else None
    time.sleep(0.2)
ranked = sorted([c for c in cand.values() if c["move_12_1"] is not None], key=lambda c: -c["move_12_1"])
picks = ranked[:PICKS]
if len(picks) < PICKS or len(brk["weights"]) != 5:
    sys.exit(f"not enough data ({len(picks)} picks, {len(brk['weights'])} Berkshire stocks); keeping the old targets")

w = {}
names = {}
for x in brk["weights"]: w[x["ticker"]] = w.get(x["ticker"], 0) + x["weight"] / 2; names[x["ticker"]] = x["name"]
for c in picks: w[c["ticker"]] = w.get(c["ticker"], 0) + 100 / PICKS / 2; names.setdefault(c["ticker"], c["name"])
part = lambda t: ("Berkshire" if t in {x["ticker"] for x in brk["weights"]} else "") + (" + " if t in {x["ticker"] for x in brk["weights"]} and t in {c["ticker"] for c in picks} else "") + ("momentum" if t in {c["ticker"] for c in picks} else "")
out = {"version": month, "built": today.isoformat(), "as_of": brk["as_of"], "filed": brk["filed"], "cik": BRK,
       "source": f"Half Berkshire's top 5 ({brk['source']}), half the 5 famous-investor picks with the best 12-1 month price move ({len(cand)} candidates from {len({h['firm'] for c in cand.values() for h in c['held_by']})} investors' newest 13Fs, built {today.isoformat()})",
       "method": "50% Berkshire top 5 at its own weights + 50% momentum picks at 10% each, rebuilt on the first trading day of each month",
       "weights": sorted([{"ticker": t, "name": names[t], "weight": round(v, 2), "part": part(t)} for t, v in w.items()], key=lambda x: -x["weight"]),
       "berkshire": [{"ticker": x["ticker"], "name": x["name"], "weight": x["weight"]} for x in brk["weights"]],
       "momentum": picks, "runners_up": ranked[PICKS:PICKS + 5],
       "caveats": brk.get("caveats", []) + ["Momentum picks are chosen by past price moves. Past moves do not predict future ones, and these stocks can fall fast."]}
json.dump(out, open(TP, "w"), indent=2)
print("targets", month, ", ".join(f'{x["ticker"]} {x["weight"]}%' for x in out["weights"]))
print("momentum picks:", ", ".join(f'{c["ticker"]} {c["move_12_1"]}% ({", ".join(h["investor"].split(" (")[0] for h in c["held_by"])})' for c in picks))
