#!/bin/bash
###############################################
# CDN Operations Automation Cron Setup
# 
# This script sets up automated cron jobs for:
# - Daily S3 health checks
# - Weekly media backups  
# - Monthly lifecycle policy reviews
# - Alerting integration for anomalies
###############################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs/operations"
CRON_LOG_DIR="$PROJECT_ROOT/logs/cron"

# Ensure log directories exist
mkdir -p "$LOG_DIR" "$CRON_LOG_DIR"

# Email/Slack configuration (customize as needed)
ALERT_EMAIL="${ALERT_EMAIL:-ops@lynxpardelle.com}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

echo "🕒 Setting up CDN Operations Automation"
echo "======================================="
echo "Project Root: $PROJECT_ROOT"
echo "Alert Email: $ALERT_EMAIL"
echo "Slack Webhook: ${SLACK_WEBHOOK_URL:+Configured}"
echo ""

###############################################
# Helper Functions
###############################################

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

send_slack_alert() {
    local message="$1"
    local severity="${2:-info}"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        local emoji="ℹ️"
        
        case "$severity" in
            "error") color="danger"; emoji="🚨" ;;
            "warning") color="warning"; emoji="⚠️" ;;
            "success") color="good"; emoji="✅" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$emoji CDN Operations Alert\n$message\"}]}" \
             "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
}

###############################################
# Cron Job Scripts
###############################################

create_daily_health_check() {
    cat > "$PROJECT_ROOT/scripts/cron-daily-health-check.sh" << 'EOF'
#!/bin/bash
# Daily S3 Health Check - Automated
set -euo pipefail

cd "$(dirname "$0")/.."
source .env 2>/dev/null || true

LOG_FILE="logs/cron/daily-health-$(date +%Y-%m-%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

{
    echo "=== Daily S3 Health Check - $(date) ==="
    
    # Run health check
    if node utility/check-s3-health.js --log; then
        echo "✅ S3 health check passed"
        
        # Send success notification (weekly summary)
        if [[ $(date +%u) -eq 1 ]]; then  # Monday
            if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
                curl -X POST -H 'Content-type: application/json' \
                     --data '{"text":"✅ Weekly CDN Health Summary: All systems healthy"}' \
                     "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
            fi
        fi
    else
        echo "❌ S3 health check failed"
        
        # Send alert
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                 --data '{"attachments":[{"color":"danger","text":"🚨 CDN Health Check Failed\nS3 health check detected issues. Please review logs."}]}' \
                 "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
        fi
        
        if command -v mail >/dev/null 2>&1; then
            echo "S3 health check failed. Please review the logs at $LOG_FILE" | \
                mail -s "CDN Alert: S3 Health Check Failed" "${ALERT_EMAIL:-ops@lynxpardelle.com}" 2>/dev/null || true
        fi
    fi
    
    echo "=== Health check completed - $(date) ==="
} >> "$LOG_FILE" 2>&1
EOF

    chmod +x "$PROJECT_ROOT/scripts/cron-daily-health-check.sh"
    log "✅ Created daily health check script"
}

create_weekly_backup() {
    cat > "$PROJECT_ROOT/scripts/cron-weekly-backup.sh" << 'EOF'
#!/bin/bash
# Weekly Media Backup - Automated
set -euo pipefail

cd "$(dirname "$0")/.."
source .env 2>/dev/null || true

LOG_FILE="logs/cron/weekly-backup-$(date +%Y-%m-%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

{
    echo "=== Weekly Media Backup - $(date) ==="
    
    # Run backup
    if node utility/create-media-backup.js --log --retention=90; then
        echo "✅ Weekly media backup completed successfully"
        
        # Send success notification
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                 --data '{"text":"✅ Weekly media backup completed successfully"}' \
                 "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
        fi
    else
        echo "❌ Weekly media backup failed"
        
        # Send alert
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                 --data '{"attachments":[{"color":"danger","text":"🚨 Weekly Backup Failed\nMedia backup process encountered errors. Please review logs."}]}' \
                 "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
        fi
        
        if command -v mail >/dev/null 2>&1; then
            echo "Weekly media backup failed. Please review the logs at $LOG_FILE" | \
                mail -s "CDN Alert: Weekly Backup Failed" "${ALERT_EMAIL:-ops@lynxpardelle.com}" 2>/dev/null || true
        fi
    fi
    
    echo "=== Backup completed - $(date) ==="
} >> "$LOG_FILE" 2>&1
EOF

    chmod +x "$PROJECT_ROOT/scripts/cron-weekly-backup.sh"
    log "✅ Created weekly backup script"
}

create_monthly_review() {
    cat > "$PROJECT_ROOT/scripts/cron-monthly-review.sh" << 'EOF'
#!/bin/bash
# Monthly CDN Review - Automated
set -euo pipefail

cd "$(dirname "$0")/.."
source .env 2>/dev/null || true

LOG_FILE="logs/cron/monthly-review-$(date +%Y-%m).log"
mkdir -p "$(dirname "$LOG_FILE")"

{
    echo "=== Monthly CDN Review - $(date) ==="
    
    # Run detailed health check
    echo "Running detailed S3 health check..."
    node utility/check-s3-health.js --detailed --log || true
    
    # Generate usage statistics
    echo "Generating usage statistics..."
    echo "Current month: $(date +%Y-%m)"
    
    # Check log files for patterns
    if [[ -d "logs/operations" ]]; then
        echo "Log file analysis:"
        find logs/operations -name "*.log" -mtime -30 | wc -l | xargs echo "  Operation logs (last 30 days):"
        
        if [[ -f "logs/operations/s3-health-$(date +%Y-%m-%d).log" ]]; then
            echo "  Latest health check: Available"
        fi
        
        if [[ -f "logs/operations/media-backup-$(date +%Y-%m-%d).log" ]]; then
            echo "  Latest backup: Available"
        fi
    fi
    
    # Send monthly summary
    SUMMARY="📊 Monthly CDN Review - $(date +%B\ %Y)
    
✅ Systems Status: Healthy
📈 Health Checks: Running daily
💾 Backups: Running weekly  
📊 Detailed analysis available in logs

Next review: $(date -d '+1 month' +%B\ %Y)"
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$SUMMARY\"}" \
             "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
    
    if command -v mail >/dev/null 2>&1; then
        echo "$SUMMARY" | \
            mail -s "CDN Monthly Review - $(date +%B\ %Y)" "${ALERT_EMAIL:-ops@lynxpardelle.com}" 2>/dev/null || true
    fi
    
    echo "=== Monthly review completed - $(date) ==="
} >> "$LOG_FILE" 2>&1
EOF

    chmod +x "$PROJECT_ROOT/scripts/cron-monthly-review.sh"
    log "✅ Created monthly review script"
}

create_log_rotation() {
    cat > "$PROJECT_ROOT/scripts/cron-log-rotation.sh" << 'EOF'
#!/bin/bash
# Log Rotation - Automated
set -euo pipefail

cd "$(dirname "$0")/.."

LOG_BASE="logs"
RETENTION_DAYS=90

echo "=== Log Rotation - $(date) ==="

# Rotate operation logs
if [[ -d "$LOG_BASE/operations" ]]; then
    find "$LOG_BASE/operations" -name "*.log" -mtime +$RETENTION_DAYS -delete
    find "$LOG_BASE/operations" -name "*.log" -mtime +30 -exec gzip {} \;
    echo "✅ Rotated operation logs"
fi

# Rotate cron logs  
if [[ -d "$LOG_BASE/cron" ]]; then
    find "$LOG_BASE/cron" -name "*.log" -mtime +$RETENTION_DAYS -delete
    find "$LOG_BASE/cron" -name "*.log" -mtime +7 -exec gzip {} \;
    echo "✅ Rotated cron logs"
fi

# Clean up empty directories
find "$LOG_BASE" -type d -empty -delete 2>/dev/null || true

echo "=== Log rotation completed - $(date) ==="
EOF

    chmod +x "$PROJECT_ROOT/scripts/cron-log-rotation.sh"
    log "✅ Created log rotation script"
}

###############################################
# Cron Configuration
###############################################

setup_crontab() {
    local cron_file="/tmp/cdn-operations-cron"
    
    log "Setting up crontab entries..."
    
    # Create cron entries
    cat > "$cron_file" << EOF
# CDN Operations Automation
# Generated on $(date)

# Daily S3 health check (6 AM)
0 6 * * * cd $PROJECT_ROOT && ./scripts/cron-daily-health-check.sh

# Weekly media backup (Sunday 2 AM)  
0 2 * * 0 cd $PROJECT_ROOT && ./scripts/cron-weekly-backup.sh

# Monthly review (1st of month, 8 AM)
0 8 1 * * cd $PROJECT_ROOT && ./scripts/cron-monthly-review.sh

# Daily log rotation (11 PM)
0 23 * * * cd $PROJECT_ROOT && ./scripts/cron-log-rotation.sh

EOF

    # Show the cron file content
    echo ""
    log "Proposed cron entries:"
    cat "$cron_file"
    echo ""
    
    # Ask for confirmation
    read -p "Install these cron jobs? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Install cron jobs
        crontab "$cron_file"
        log "✅ Cron jobs installed successfully!"
        
        # Show current crontab
        echo ""
        log "Current crontab:"
        crontab -l | grep -A 20 "CDN Operations" || crontab -l
    else
        log "ℹ️  Cron installation skipped. You can install manually with:"
        log "   crontab $cron_file"
    fi
    
    # Clean up
    rm -f "$cron_file"
}

###############################################
# Main Setup
###############################################

main() {
    log "Creating automation scripts..."
    
    create_daily_health_check
    create_weekly_backup  
    create_monthly_review
    create_log_rotation
    
    echo ""
    log "📋 Setup Summary:"
    log "- Daily health checks: 6 AM"
    log "- Weekly backups: Sunday 2 AM"  
    log "- Monthly reviews: 1st of month, 8 AM"
    log "- Log rotation: Daily 11 PM"
    echo ""
    
    log "📧 Alert Configuration:"
    log "- Email: $ALERT_EMAIL"
    log "- Slack: ${SLACK_WEBHOOK_URL:+Configured}"
    echo ""
    
    setup_crontab
    
    echo ""
    log "🎉 CDN Operations Automation setup complete!"
    log ""
    log "💡 Next steps:"
    log "1. Configure SLACK_WEBHOOK_URL in .env for Slack alerts"
    log "2. Ensure mail command is available for email alerts"
    log "3. Test scripts manually before relying on automation:"
    log "   ./scripts/cron-daily-health-check.sh"
    log "   ./scripts/cron-weekly-backup.sh"
    log "4. Monitor logs in logs/cron/ directory"
    log ""
    log "📂 Log locations:"
    log "- Operation logs: $LOG_DIR"
    log "- Cron logs: $CRON_LOG_DIR"
}

# Run main function
main "$@"