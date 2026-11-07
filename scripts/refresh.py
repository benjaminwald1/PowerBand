#!/usr/bin/env python3
"""Run the Trader skills and write data/plan.json for the website.
Nothing is ever sent to a broker: this only reads public data and writes proposals.
Usage: python3 scripts/refresh.py      (needs ~/clones/trader-skill)"""
import json, os, subprocess, sys, tempfile, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SK = os.path.expanduser("~/clones/trader-skill")
BUDGETS = [10000, 20000]
seed = lambda n: json.load(open(os.path.join(ROOT, "data", "seed", n)))

def run(skill, script, args, cwd, ok=(0, 1)):
    r = subprocess.run([sys.executable, os.path.join(SK, skill, script), *args], cwd=cwd, capture_output=True, text=True)
    if r.returncode not in ok:
        sys.exit(f"{skill} failed: {(r.stderr or r.stdout)[-400:]}")
    return r.stdout

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
        plan["portfolios"].append({"id": f"{b // 1000}k", "budget": b, "cash": cash, "cash_buffer_pct": cfg["cash_buffer_pct"],
            "cap_pct": cfg["max_position_pct"], "buys": buys, "risk_summary": {"passed": sum(r["verdict"] == "PASS" for r in risk["results"]), "blocked": sum(r["verdict"] == "BLOCK" for r in risk["results"])},
            "rebalance": {"band": reb["band"], "rows": reb["rows"], "trades": reb.get("orders") or reb.get("trades") or []},
            "harvest": {"candidates": har.get("candidates", []), "orders": har.get("orders", [])}, "tax": rep})
    try:
        f = jrun("trader-pelosi", "ptr.py", ["index", "--member", "Pelosi", "--year", str(datetime.date.today().year), "--limit", "6", "--json"], tmp, ok=(0,))
        plan["congress"] = [{"filed": x["filed"], "name": x["name"], "district": x["district"], "url": x["url"]} for x in f]
    except SystemExit as e:
        plan["congress"] = old.get("congress", [])
with open(os.path.join(ROOT, "data", "plan.json"), "w") as fh:
    json.dump(plan, fh, indent=1)
print("wrote data/plan.json", now, plan["prices_as_of"])
