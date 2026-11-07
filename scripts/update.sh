#!/bin/sh
# Daily loop: get new data, let the model learn from it, then rebuild the plan. Paper trading only; nothing is sent to a broker.
set -e
cd "$(dirname "$0")/.."
python3 scripts/learn_data.py
python3 scripts/learn.py > /dev/null
python3 scripts/refresh.py
