#!/bin/bash
# =============================================================================
# Production Monitoring Activation Script
# =============================================================================
set -euo pipefail

MONITORING_LOG="./logs/production-monitoring-$(date +%Y%m%d-%H%M%S).log"
mkdir -p ./logs
log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$MONITORING_LOG"; }

activate(){
  log "Activating production monitoring for unified container..."
  if [ -f "docker-compose.monitoring.yml" ]; then
    docker compose -f docker-compose.monitoring.yml up -d
    log "✅ Monitoring stack deployed"
  else
    log "⚠️ docker-compose.monitoring.yml not found; skipping stack deploy"
  fi

  # Optional: copy production alert rules if present
  if [ -f "private-projects/mongo-backup-v2/monitoring/production-alerts.yml" ]; then
    mkdir -p monitoring/prometheus/rules
    cp private-projects/mongo-backup-v2/monitoring/production-alerts.yml monitoring/prometheus/rules/
    docker compose -f docker-compose.monitoring.yml restart prometheus || true
    log "✅ Production alert rules applied"
  fi

  # Verify relevant endpoints
  declare -a endpoints=(
    "http://localhost:9090:Prometheus"
    "http://localhost:3000:Grafana"
    "http://localhost:9093:AlertManager"
    "http://localhost:9217/metrics:Backup Metrics Exporter"
  )
  for e in "${endpoints[@]}"; do
    url=${e%%:*:*}; name=${e##*:}
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "✅ $name is accessible at $url"
    else
      log "⚠️ $name not responding at $url"
    fi
  done
}

log "Starting production monitoring activation..."
activate
log "Production monitoring activation completed"
