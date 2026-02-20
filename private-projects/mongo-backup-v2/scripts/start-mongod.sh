#!/bin/bash
set -euo pipefail

# Mongo official entrypoint handles initialization logic; we simply forward to it.
CMD_ARGS=(mongod --bind_ip_all)
if [ -n "${MONGO_CUSTOM_COMMAND:-}" ]; then
  # shellcheck disable=SC2206
  CMD_ARGS=(${MONGO_CUSTOM_COMMAND})
fi
exec /usr/local/bin/docker-entrypoint.sh "${CMD_ARGS[@]}"
