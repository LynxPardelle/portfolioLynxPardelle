#!/bin/bash
# =============================================================================
# Deploy Monitoring Stack for MongoDB Unified Container
# =============================================================================
set -e

MONITORING_DIR="./monitoring"
ENV_FILE=".env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

setup_directories() {
  log "Setting up monitoring directories..."
  mkdir -p "${MONITORING_DIR}/prometheus/rules"
  mkdir -p "${MONITORING_DIR}/grafana/dashboards"
  mkdir -p "${MONITORING_DIR}/grafana/datasources"
  mkdir -p "${MONITORING_DIR}/alertmanager"
  log "✅ Monitoring directories ready"
}

deploy_stack() {
  log "Deploying monitoring stack..."
  # Load env if present
  [ -f "$ENV_FILE" ] && source "$ENV_FILE"
  docker compose -f docker-compose.monitoring.yml up -d
  log "✅ Monitoring stack started"
}

wait_ready() {
  log "Waiting for Prometheus and Grafana to be ready..."
  local attempts=0
  until curl -fsSL http://localhost:9090/-/ready >/dev/null 2>&1 || [ $attempts -ge 30 ]; do sleep 5; attempts=$((attempts+1)); done
  [ $attempts -lt 30 ] && log "✅ Prometheus ready" || log "⚠️  Prometheus readiness not confirmed"
  attempts=0
  until curl -fsSL http://localhost:3000/api/health >/dev/null 2>&1 || [ $attempts -ge 30 ]; do sleep 5; attempts=$((attempts+1)); end
  [ $attempts -lt 30 ] && log "✅ Grafana ready" || log "⚠️  Grafana readiness not confirmed"
}

import_dashboards() {
  log "Importing Grafana dashboards..."
  sleep 10
  curl -s -o /dev/null -X POST \
    -H "Content-Type: application/json" \
    -d @"${MONITORING_DIR}/grafana/dashboards/mongodb-unified-dashboard.json" \
    http://admin:${GRAFANA_PASSWORD:-admin}@localhost:3000/api/dashboards/db || true
  log "✅ Grafana dashboards import attempted"
}

verify() {
  log "Verifying Prometheus targets and AlertManager..."
  curl -fsSL http://localhost:9090/api/v1/targets >/dev/null 2>&1 && log "✅ Prometheus API reachable" || log "❌ Prometheus API not reachable"
  curl -fsSL http://localhost:9093/-/ready >/dev/null 2>&1 && log "✅ AlertManager healthy" || log "⚠️  AlertManager readiness not confirmed"
}

main() {
  log "🚀 Starting monitoring deployment"
  setup_directories
  deploy_stack
  wait_ready
  import_dashboards
  verify
  log "🎉 Monitoring stack deployment completed"
  log "URLs: Prometheus http://localhost:9090 | Grafana http://localhost:3000 | AlertManager http://localhost:9093"
}

main "$@"
