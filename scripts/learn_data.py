#!/usr/bin/env python3
"""Download and cache the history the learner trains on: every Berkshire 13F back to 2016 (top positions only),
daily prices for each ticker those filings name, and SEC quarterly EPS for valuations. Public data only."""
import json, os, subprocess, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".local", "learn"); os.makedirs(CACHE, exist_ok=True)
SK = os.path.expanduser("~/clones/trader-skill")
UA = os.environ.get("SEC_USER_AGENT") or open(os.path.join(ROOT, ".local", "sec_user_agent")).read().strip()
CIK = "0001067983"

def sk(skill, script, args, ok=(0,)):
    r = subprocess.run([sys.executable, os.path.join(SK, skill, script), *args], capture_output=True, text=True, env={**os.environ, "SEC_USER_AGENT": UA})
    if r.returncode not in ok: raise RuntimeError((r.stderr or r.stdout)[-300:])
    return json.loads(r.stdout)

def cached(name, fn, max_age=None):
    p = os.path.join(CACHE, name)
    if os.path.exists(p) and (max_age is None or time.time() - os.path.getmtime(p) < max_age): return json.load(open(p))
    v = fn(); json.dump(v, open(p, "w")); return v

def thirteen_f():
    fl = sk("trader-copycat", "edgar13f.py", ["filings", CIK, "--limit", "60", "--json"])["filings"]
    out = []
    for f in sorted(fl, key=lambda x: x["period"]):
        if f["form"] != "13F-HR": continue
        def get(f=f):
            h = sk("trader-copycat", "edgar13f.py", ["holdings", CIK, "--period", f["period"], "--combine", "--top", "12", "--json"])
            return [{"ticker": p.get("ticker") or "", "name": p.get("name") or p.get("issuer"), "pct": p["pct_of_13f"], "cusip": p["cusip"]} for p in h["positions"] if not p.get("put_call")]
        try: pos = cached(f"13f_{f['period']}.json", get)
        except Exception as e: print("skip", f["period"], str(e)[:80]); continue
        out.append({"period": f["period"], "filed": f["filed"], "positions": pos})
        time.sleep(0.2)
    return out

def prices(t):
    def get():
        u = f"https://query1.finance.yahoo.com/v8/finance/chart/{t}?range=11y&interval=1d&includeAdjustedClose=true"
        d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))["chart"]["result"][0]
        ts = d["timestamp"]; ad = d["indicators"]["adjclose"][0]["adjclose"]; cl = d["indicators"]["quote"][0]["close"]
        fmt = lambda a: time.strftime("%Y-%m-%d", time.gmtime(a))
        return {"adj": {fmt(a): b for a, b in zip(ts, ad) if b}, "raw": {fmt(a): c for a, c in zip(ts, cl) if c}}
    return cached(f"px_{t}.json", get, 86400)

def eps(t):
    def get():
        r = sk("trader-analyst", "facts.py", [t, "--quarters", "48", "--no-filings", "--json"])
        return [{"end": x["end"], "eps": x.get("eps_diluted")} for x in r[0]["result"]["rows"] if x.get("eps_diluted") is not None]
    return cached(f"eps_{t}.json", get, 30 * 86400)

if __name__ == "__main__":
    f13 = thirteen_f(); json.dump(f13, open(os.path.join(CACHE, "13f_all.json"), "w"))
    tick = sorted({p["ticker"] for f in f13 for p in f["positions"][:8] if p["ticker"]}) + ["SPY"]
    print(len(f13), "filings;", len(tick), "tickers:", " ".join(tick))
    ok, bad = [], []
    for t in tick:
        try: prices(t); ok.append(t)
        except Exception as e: bad.append(t)
        time.sleep(0.2)
    print("prices ok:", len(ok), "missing:", bad)
    for t in ok:
        if t == "SPY": continue
        try: eps(t)
        except Exception as e: print("no eps", t, str(e)[:60])
        time.sleep(0.3)
    print("done")
