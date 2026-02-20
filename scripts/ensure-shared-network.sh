#!/usr/bin/env sh
set -eu

NETWORK_NAME="${NETWORK_NAME:-lynx-portfolio-back-network}"

echo "[network] ensuring shared network exists: ${NETWORK_NAME}"
if docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
  echo "[network] exists: ${NETWORK_NAME}"
else
  echo "[network] creating: ${NETWORK_NAME}"
  docker network create "${NETWORK_NAME}"
  echo "[network] created: ${NETWORK_NAME}"
fi
