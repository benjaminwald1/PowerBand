#!/usr/bin/env python3
"""Load Berkshire's newest 13F into data/seed/targets.json when it is newer than the one there.
Runs before refresh.py and roll.py each day; when the quarter changes, roll.py rebalances the account to the new weights.
Needs ~/clones/trader-skill and an SEC User-Agent (SEC_USER_AGENT env var or the git-ignored .local/sec_user_agent)."""
import json, os, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SK = os.path.expanduser("~/clones/trader-skill")
TP = os.path.join(ROOT, "data", "seed", "targets.json")
uf = os.path.join(ROOT, ".local", "sec_user_agent")
ua = os.environ.get("SEC_USER_AGENT") or (open(uf).read().strip() if os.path.exists(uf) else "")
if not ua:
    sys.exit("no SEC User-Agent; skipping the filing check")
old = json.load(open(TP))
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "targets.json")
    r = subprocess.run([sys.executable, os.path.join(SK, "trader-copycat", "edgar13f.py"), "copy", old["cik"], "--top", "5", "--combine",
                        "--user-agent", ua, "--out", out], cwd=tmp, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(out):
        sys.exit("13F check failed: " + (r.stderr or r.stdout)[-400:])
    new = json.load(open(out))
if new["as_of"] <= old["as_of"]:
    print("no new 13F; still", old["as_of"])
    sys.exit(0)
if len(new.get("weights", [])) != 5 or abs(sum(w["weight"] for w in new["weights"]) - 100) > 0.5:
    sys.exit("new 13F looks wrong, keeping the old targets: " + json.dumps([(w["ticker"], w["weight"]) for w in new.get("weights", [])]))
json.dump(new, open(TP, "w"), indent=2)
print("new 13F:", new["source"])
print("targets:", ", ".join(f'{w["ticker"]} {w["weight"]}%' for w in new["weights"]))
