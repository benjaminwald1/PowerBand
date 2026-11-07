#!/usr/bin/env python3
"""Refresh data/portfolios.json with the latest delayed quotes using the trader-alerts skill.
Usage: python3 scripts/refresh.py   (needs ~/clones/trader-skill, public Yahoo/Stooq data only)"""
import json, subprocess, sys, os, tempfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
alerts = os.path.expanduser("~/clones/trader-skill/trader-alerts/alerts.py")
path = os.path.join(root, "data", "portfolios.json")
D = json.load(open(path))
tick = list(D["entry"])
with tempfile.TemporaryDirectory() as tmp:
    r = subprocess.run([sys.executable, alerts, "quote", *tick, "--write"], cwd=tmp, capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr or r.stdout)
    q = json.load(open(os.path.join(tmp, "trader", "prices.json")))
D["prices"], D["prices_as_of"] = q["prices"], q["as_of"]
json.dump(D, open(path, "w"), indent=1)
print("updated", q["as_of"], q["prices"])
