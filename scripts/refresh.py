#!/usr/bin/env python3
"""Run the Trader skills and write data/plan.json for the website.
Nothing is ever sent to a broker: this only reads public data and writes proposals.
Usage: python3 scripts/refresh.py      (needs ~/clones/trader-skill)"""
import json, os, subprocess, sys, tempfile, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SK = os.path.expanduser("~/clones/trader-skill")
BUDGETS = [10000]
seed = lambda n: json.load(open(os.path.join(ROOT, "data", "seed", n)))

def run(skill, script, args, cwd, ok=(0, 1)):
    r = subprocess.run([sys.executable, os.path.join(SK, skill, script), *args], cwd=cwd, capture_output=True, text=True)
    if r.returncode not in ok:
        sys.exit(f"{skill} failed: {(r.stderr or r.stdout)[-400:]}")
    return r.stdout

def history(t):
    import urllib.request
    req = urllib.request.Request(f"https://query1.finance.yahoo.com/v8/finance/chart/{t}?range=1y&interval=1d", headers={"User-Agent": "Mozilla/5.0"})
    d = json.load(urllib.request.urlopen(req, timeout=20))["chart"]["result"][0]
    return [c for c in d["indicators"]["quote"][0]["close"] if c]

def outlook(buys, entry, prices, rules, as_of_13f):
    import math, statistics
    hist = {b["ticker"]: history(b["ticker"]) for b in buys}
    n = min(len(v) for v in hist.values())
    tot = sum(b["dollars"] for b in buys)
    port = [sum(b["dollars"] / tot * math.log(hist[b["ticker"]][-n + i] / hist[b["ticker"]][-n + i - 1]) for b in buys) for i in range(1, n)]
    sd_d = statistics.pstdev(port); T = rules["horizon_days"]; z = 1.2816
    sig = sd_d * math.sqrt(T)
    def rng(x):  # 10th and 90th percentile of a zero-drift lognormal spread
        return round(x * math.exp(-z * sig) , 2), round(x * math.exp(z * sig), 2)
    stocks = []
    for b in buys:
        h = hist[b["ticker"]]; lr = [math.log(h[i] / h[i - 1]) for i in range(1, len(h))]
        v = statistics.pstdev(lr) * math.sqrt(252); e = entry[b["ticker"]]
        sd = statistics.pstdev(lr)
        # chance the price touches a level at any point within N trading days (random walk, no drift: reflection principle)
        hit = lambda lvl, d: round(math.erfc(abs(math.log(lvl / e)) / (sd * math.sqrt(d) * math.sqrt(2))) * 100)
        tp, sl = e * (1 + rules["take_profit_pct"] / 100), e * (1 - rules["stop_loss_pct"] / 100)
        odds = {"profit": [hit(tp, d) for d in (21, 63, 252)], "stop": [hit(sl, d) for d in (21, 63, 252)]}
        stocks.append({"odds": odds, "ticker": b["ticker"], "vol_pct": round(v * 100, 1), "last_year_pct": round((h[-1] / h[0] - 1) * 100, 1), "entry": e,
            "take_profit_price": round(e * (1 + rules["take_profit_pct"] / 100), 2), "stop_price": round(e * (1 - rules["stop_loss_pct"] / 100), 2),
            "low": round(e * math.exp(-z * v), 2), "high": round(e * math.exp(z * v), 2)})
    lo, hi = rng(tot)
    qe = datetime.date.fromisoformat(as_of_13f)
    mm = qe.month + 3; yy = qe.year + (mm - 1) // 12; mm = (mm - 1) % 12 + 1   # three months on, then the last day of that month
    nxt = datetime.date(yy + (mm == 12), mm % 12 + 1, 1)
    nq = nxt - datetime.timedelta(days=1)
    dl = nq + datetime.timedelta(days=45)
    while dl.weekday() > 4: dl += datetime.timedelta(days=1)
    return {"horizon_days": T, "portfolio": {"vol_pct": round(sig * 100, 1), "low": lo, "high": hi, "invested": tot,
            "last_year_pct": round((math.exp(sum(port)) - 1) * 100, 1)}, "stocks": stocks, "rules": rules,
            "next_13f": {"quarter_end": nq.isoformat(), "deadline": dl.isoformat()}}

def jrun(*a, **k):
    return json.loads(run(*a, **k))

targets, cfg0 = seed("targets.json"), seed("config.json")
old = json.load(open(os.path.join(ROOT, "data", "plan.json"))) if os.path.exists(os.path.join(ROOT, "data", "plan.json")) else {}
tickers = [w["ticker"] for w in targets["weights"]]
names = {w["ticker"]: w["name"] for w in targets["weights"]}
now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
plan = {"generated": now, "source": targets["source"], "as_of_13f": targets["as_of"], "names": names, "portfolios": []}

with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "trader"))
    json.dump(targets, open(os.path.join(tmp, "trader", "targets.json"), "w"))
    run("trader-alerts", "alerts.py", ["quote", *tickers, "--write"], tmp)
    q = json.load(open(os.path.join(tmp, "trader", "prices.json")))
    plan["prices"], plan["prices_as_of"] = q["prices"], q["as_of"]
    clock = run("trader-alerts", "alerts.py", ["clock"], tmp).strip().splitlines()
    plan["market"] = " ".join(clock)
    import re
    mo = re.search(r"Next open: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) (New York)", plan["market"])
    plan["next_open"] = f"{mo.group(1)} {mo.group(2)}" if mo else None
    plan["market_open_now"] = "closed" not in plan["market"].lower()
    # the entry prices stay fixed once chosen, so gains and losses are measured from the same starting point
    plan["entry"] = old.get("entry") or dict(q["prices"])
    plan["entry_note"] = old.get("entry_note") or "Simulated buys at the " + q["as_of"][:10] + " closing prices"

    for b in BUDGETS:
        w = os.path.join(tmp, f"w{b}"); os.makedirs(os.path.join(w, "trader", "state"))
        cfg = dict(cfg0, budget=b, max_order_usd=round(b * 0.3))
        for n, o in (("config.json", cfg), ("targets.json", targets), ("prices.json", q)):
            json.dump(o, open(os.path.join(w, "trader", n), "w"))
        size = jrun("trader-budget", "size.py", ["--write", "--json", "--prices", "trader/prices.json"], w, ok=(0,))["result"]
        risk = jrun("trader-risk", "check.py", ["--json"], w)
        verdict = {r["symbol"]: r for r in risk["results"]}
        buys = [{"ticker": p["ticker"], "name": p["name"], "dollars": p["dollars"], "price": p["price"], "shares": p["shares"],
                 "weight": p["weight"], "capped": p["capped"], "verdict": verdict.get(p["ticker"], {}).get("verdict", "?"),
                 "reasons": verdict.get(p["ticker"], {}).get("reasons", [])} for p in size["positions"]]
        # what the account looks like once the buys have filled at the entry prices, then what the skills say about holding it
        pos = [{"ticker": x["ticker"], "shares": round(x["dollars"] / plan["entry"][x["ticker"]], 4),
                "lots": [{"id": x["ticker"] + "-1", "date": plan["entry"] and q["as_of"][:10], "shares": round(x["dollars"] / plan["entry"][x["ticker"]], 4), "cost": x["dollars"]}]} for x in buys]
        cash = round(b - sum(x["dollars"] for x in buys), 2)
        json.dump({"cash": cash, "positions": pos}, open(os.path.join(w, "trader", "portfolio.json"), "w"))
        reb = jrun("trader-rebalance", "rebalance.py", ["--json"], w)
        har = jrun("trader-tax", "lots.py", ["harvest", "--json", "--orders", "none.json"], w)
        rep = jrun("trader-tax", "lots.py", ["report", "--json"], w)
        if b == BUDGETS[0]:
            try:
                rl = seed("exit_rules.json")
                plan["outlook"] = outlook(buys, plan["entry"], q["prices"], rl, targets["as_of"]); plan["outlook"]["auto_exit"] = rl.get("auto_exit", True)
                plan["auto_exit"] = plan["outlook"]["auto_exit"]
                # the journal: what the model said today, so the learner can score it once the time has passed
                jp = os.path.join(ROOT, "data", "journal.json"); J = json.load(open(jp)) if os.path.exists(jp) else []
                today = q["as_of"][:10]
                for st in plan["outlook"]["stocks"]:
                    if not any(e["date"] == today and e["ticker"] == st["ticker"] for e in J):
                        J.append({"date": today, "ticker": st["ticker"], "price": q["prices"][st["ticker"]], "profit_level": st["take_profit_price"], "stop_level": st["stop_price"], "odds": st["odds"]})
                json.dump(J, open(jp, "w"), indent=1)
            except Exception as ex: plan["outlook"] = old.get("outlook"); print("outlook skipped:", ex)
        plan["portfolios"].append({"id": f"{b // 1000}k", "budget": b, "cash": cash, "cash_buffer_pct": cfg["cash_buffer_pct"],
            "cap_pct": cfg["max_position_pct"], "buys": buys, "risk_summary": {"passed": sum(r["verdict"] == "PASS" for r in risk["results"]), "blocked": sum(r["verdict"] == "BLOCK" for r in risk["results"])},
            "rebalance": {"band": reb["band"], "rows": reb["rows"], "trades": reb.get("orders") or reb.get("trades") or []},
            "harvest": {"candidates": har.get("candidates", []), "orders": har.get("orders", [])}, "tax": rep})
    # SEC skills need a name and email in the request header. It lives in a git-ignored local file and is never written to the site's data.
    ua = os.environ.get("SEC_USER_AGENT") or (open(os.path.join(ROOT, ".local", "sec_user_agent")).read().strip() if os.path.exists(os.path.join(ROOT, ".local", "sec_user_agent")) else "")
    if ua:
        a = jrun("trader-analyst", "facts.py", [*tickers, "--user-agent", ua, "--metrics", "trader/metrics.json", "--json", "--no-filings"], tmp, ok=(0,))
        m = json.load(open(os.path.join(tmp, "trader", "metrics.json")))
        keep = ("ticker", "name", "period_end", "revenue_ttm", "net_income_ttm", "eps_ttm", "revenue_growth_yoy", "eps_growth_yoy", "gross_margin", "operating_margin", "net_margin")
        plan["analyst"] = [{k: c.get(k) for k in keep} for c in m["companies"]]
        rules = seed("rules.json")
        sc = jrun("trader-screener", "screen.py", ["trader/metrics.json", "--rules", os.path.join(ROOT, "data", "seed", "rules.json"), "--prices", "trader/prices.json", "--json"], tmp)
        plan["screen"] = {"name": rules["name"], "rules": rules["rules"], "passed": sc["passed"], "failed": sc["failed"]}
        nw = jrun("trader-news", "news.py", ["--user-agent", ua, "--json", "--dry-run", "--hours", "72", "--tickers", *tickers], tmp, ok=(0,))
        plan["news"] = [{k: i.get(k) for k in ("source", "kind", "ticker", "title", "link", "time", "tags")} for i in nw["items"][:14]]
        plan["sec_skills"] = True
    else:
        for k in ("analyst", "screen", "news"):
            if k in old: plan[k] = old[k]
        plan["sec_skills"] = bool(old.get("sec_skills"))
    try:
        f = jrun("trader-pelosi", "ptr.py", ["index", "--member", "Pelosi", "--year", str(datetime.date.today().year), "--limit", "6", "--json"], tmp, ok=(0,))
        plan["congress"] = [{"filed": x["filed"], "name": x["name"], "district": x["district"], "url": x["url"]} for x in f]
    except SystemExit as e:
        plan["congress"] = old.get("congress", [])
with open(os.path.join(ROOT, "data", "plan.json"), "w") as fh:
    json.dump(plan, fh, indent=1)
print("wrote data/plan.json", now, plan["prices_as_of"])
