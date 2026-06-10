#!/usr/bin/env bash
# tests/load/run.sh — wrapper for k6 scenarios.
# Usage:
#   ./tests/load/run.sh                # baseline against localhost
#   ./tests/load/run.sh burst          # burst against localhost
#   BASE_URL=http://my-ingress ./tests/load/run.sh baseline

set -euo pipefail

SCENARIO="${1:-baseline}"
BASE_URL="${BASE_URL:-http://localhost:8080}"

case "$SCENARIO" in
  baseline) SCRIPT="k6-baseline.js" ;;
  burst)    SCRIPT="k6-burst.js" ;;
  *)        echo "unknown scenario: $SCENARIO (use 'baseline' or 'burst')" >&2; exit 2 ;;
esac

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "k6 $SCRIPT  →  $BASE_URL"
BASE_URL="$BASE_URL" k6 run "$DIR/$SCRIPT"
