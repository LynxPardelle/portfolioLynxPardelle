#!/bin/bash
# Wrapper: this script moved under private-projects/mongo-backup-v2/scripts/
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$SCRIPT_DIR/private-projects/mongo-backup-v2/scripts/migration-to-unified.sh"
if [ ! -f "$TARGET" ]; then
  echo "Canonical migration script not found at $TARGET" >&2
  exit 1
fi
exec bash "$TARGET" "$@"