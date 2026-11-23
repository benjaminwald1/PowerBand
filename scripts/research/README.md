How the strategy was chosen (2026-11-23). Run locally; needs ~/clones/trader-skill and .local/sec_user_agent.

1. `python3 scripts/research/fetch_gurus.py` caches the top 10 holdings of every 13F since 2015 for the 23 filers in trader-copycat's filers.json, plus prices, in .local/learn/gurus.
2. `EXCL=GME python3 scripts/research/families.py` tests every strategy family walk-forward (settings picked on the 4 years before each test year).
3. `EXCL=GME python3 scripts/research/stress.py` (also with `Y0=2020` or `COSTV=0.003`) stress-tests the chosen strategy. Its 2021+ output is what data/strategy.json shows.
