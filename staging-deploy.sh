#!/bin/bash
# Wrapper: staging deploy moved to private-projects canonical script
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$SCRIPT_DIR/private-projects/mongo-backup-v2/scripts/staging-deploy.sh"
if [ ! -f "$TARGET" ]; then
  echo "Canonical staging-deploy.sh not found at $TARGET" >&2
  exit 1
fi
exec bash "$TARGET" "$@"