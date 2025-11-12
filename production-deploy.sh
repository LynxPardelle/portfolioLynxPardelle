#!/bin/bash
# Wrapper: delegates to canonical script under private-projects
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CANONICAL="$SCRIPT_DIR/private-projects/mongo-backup-v2/scripts/production-deploy.sh"
if [ ! -f "$CANONICAL" ]; then
  echo "Canonical production-deploy.sh not found at $CANONICAL" >&2
  exit 1
fi
exec bash "$CANONICAL" "$@"
