"""Cache the top 10 holdings of every 13F-HR since 2015 for the 23 filers in trader-copycat's filers.json,
plus daily prices for every ticker that shows up. Writes to ~/clones/PowerBand/.local/learn/gurus/."""
import json, os, subprocess, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
E = os.path.expanduser("~/clones/trader-skill/trader-copycat/edgar13f.py")
OUT = os.path.expanduser("~/clones/PowerBand/.local/learn/gurus"); os.makedirs(OUT, exist_ok=True)
UA = open(os.path.expanduser("~/clones/PowerBand/.local/sec_user_agent")).read().strip()
FILERS = json.load(open(os.path.expanduser("~/clones/trader-skill/trader-copycat/filers.json")))["filers"]
env = {**os.environ, "SEC_USER_AGENT": UA}
def sk(*a):
    r = subprocess.run([sys.executable, E, *a, "--json"], capture_output=True, text=True, env=env, cwd=OUT)
    if r.returncode: raise RuntimeError((r.stderr or r.stdout)[-200:])
    return json.loads(r.stdout)
jobs = []
for f in FILERS:
    try: fl = sk("filings", f["cik"], "--limit", "60")["filings"]
    except Exception as e: print("no filings", f["name"], e, flush=True); continue
    seen = set()
    for x in sorted(fl, key=lambda x: x["filed"], reverse=True):   # newest filing per period (amendments replace)
        if x["form"] != "13F-HR" or x["period"] < "2015-12-31" or x["period"] in seen: continue
        seen.add(x["period"]); jobs.append((f["cik"], f["name"], x["period"], x["filed"]))
    time.sleep(0.15)
print(len(jobs), "filings to read", flush=True)
def get(j):
    cik, name, period, filed = j
    p = os.path.join(OUT, f"{cik}_{period}.json")
    if os.path.exists(p): return
    for k in range(3):
        try:
            h = sk("holdings", cik, "--period", period, "--combine", "--top", "10")
            pos = [{"ticker": x.get("ticker") or "", "pct": x["pct_of_13f"]} for x in h["positions"] if not x.get("put_call")]
            json.dump({"cik": cik, "name": name, "period": period, "filed": filed, "positions": pos}, open(p, "w")); return
        except Exception as e:
            err = e; time.sleep(2 + 3 * k)
    print("fail", name, period, str(err)[:100], flush=True)
done = 0
with ThreadPoolExecutor(4) as ex:
    for _ in ex.map(get, jobs):
        done += 1
        if done % 50 == 0: print(done, "/", len(jobs), flush=True)
tick = set()
for fn in os.listdir(OUT):
    if fn.endswith(".json") and "_" in fn and not fn.startswith("px_"):
        tick |= {p["ticker"] for p in json.load(open(os.path.join(OUT, fn)))["positions"] if p["ticker"]}
tick |= {"SPY", "QQQ", "IEF", "EFA", "GLD", "BIL"}
print(len(tick), "tickers for prices", flush=True)
bad = []
def px(t):
    p = os.path.join(OUT, f"px_{t}.json")
    if os.path.exists(p): return
    u = f"https://query1.finance.yahoo.com/v8/finance/chart/{t.replace('.', '-')}?range=11y&interval=1d&includeAdjustedClose=true"
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30))["chart"]["result"][0]
        fmt = lambda a: time.strftime("%Y-%m-%d", time.gmtime(a))
        json.dump({fmt(a): b for a, b in zip(d["timestamp"], d["indicators"]["adjclose"][0]["adjclose"]) if b}, open(p, "w"))
    except Exception: bad.append(t)
    time.sleep(0.2)
with ThreadPoolExecutor(3) as ex: list(ex.map(px, sorted(tick)))
print("no prices:", len(bad), " ".join(sorted(bad)), flush=True)
print("done", flush=True)
