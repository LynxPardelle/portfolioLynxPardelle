#!/bin/bash
# Wrapper: Use the canonical Phase 4 validation tool under private-projects

set -euo pipefail

TARGET="private-projects/mongo-backup-v2/scripts/production-validation.sh"

if [ ! -f "$TARGET" ]; then
  echo "[ERROR] Missing $TARGET — please ensure private-projects is present." >&2
  exit 1
fi

exec bash "$TARGET" "$@"
