#!/bin/bash
# Wrapper: this script moved under private-projects/mongo-backup-v2/testing/
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$SCRIPT_DIR/private-projects/mongo-backup-v2/testing/docker-compose-integration-test.sh"
if [ ! -f "$TARGET" ]; then
  echo "Canonical integration test not found at $TARGET" >&2
  exit 1
fi
exec bash "$TARGET" "$@"