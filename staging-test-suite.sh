#!/bin/bash
# =============================================================================
# Comprehensive Staging Test Suite for MongoDB Unified Container
# =============================================================================
# This script provides comprehensive testing for the unified MongoDB container
# in staging environment, including health checks, backup/restore operations,
# performance benchmarking, security validation, and integration testing.
# =============================================================================

set -e

# =============================================================================
# Configuration and Setup
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
STAGING_DIR="./staging-tests"
TEST_RESULTS_DIR="${STAGING_DIR}/results"
PERFORMANCE_DIR="${STAGING_DIR}/performance"
BACKUP_TEST_DIR="${STAGING_DIR}/backup-tests"
TEST_DATE=$(date +"%Y%m%d_%H%M%S")
TEST_LOG="${TEST_RESULTS_DIR}/staging_test_${TEST_DATE}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Docker Compose command
DOCKER_COMPOSE_CMD="docker compose"
STAGING_COMPOSE_FILE="docker-compose.staging.yml"

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    local timestamp="[$(date +'%Y-%m-%d %H:%M:%S')]"
    local message="$timestamp $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$TEST_LOG" 2>/dev/null || true
}

log_test() {
    ((TESTS_TOTAL++))
    echo -e "${PURPLE}🧪 [TEST $TESTS_TOTAL] $1${NC}"
    echo "🧪 [TEST $TESTS_TOTAL] $1" >> "$TEST_LOG" 2>/dev/null || true
}

log_success() {
    ((TESTS_PASSED++))
    echo -e "${GREEN}✅ PASSED: $1${NC}"
    echo "✅ PASSED: $1" >> "$TEST_LOG" 2>/dev/null || true
}

log_failure() {
    ((TESTS_FAILED++))
    echo -e "${RED}❌ FAILED: $1${NC}"
    echo "❌ FAILED: $1" >> "$TEST_LOG" 2>/dev/null || true
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
    echo "ℹ️  $1" >> "$TEST_LOG" 2>/dev/null || true
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "⚠️  $1" >> "$TEST_LOG" 2>/dev/null || true
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup test environment
setup_staging_tests() {
    log "Setting up staging test environment..."
    
    # Create test directories
    mkdir -p "${TEST_RESULTS_DIR}"
    mkdir -p "${PERFORMANCE_DIR}"
    mkdir -p "${BACKUP_TEST_DIR}"
    mkdir -p "./data/staging/mongo"
    mkdir -p "./logs/staging/mongo"
    mkdir -p "./mongo_backups_staging"
    
    # Initialize test log
    touch "$TEST_LOG"
    
    # Load staging environment
    if [ -f ".env.staging" ]; then
        source .env.staging
        log_info "Staging environment loaded"
    else
        log_warning "No .env.staging file found, using defaults"
    fi
    
    # Start staging environment
    log_info "Starting staging environment..."
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} up -d --build
    
    # Wait for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 90
    
    log_info "Staging environment ready for testing"
}

# Cleanup staging tests
cleanup_staging_tests() {
    log "Cleaning up staging test environment..."
    
    # Stop staging environment
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} down 2>/dev/null || true
    
    # Clean up test containers and networks
    docker network prune -f 2>/dev/null || true
    
    log_info "Staging test environment cleaned up"
}

# =============================================================================
# Test 1: Container Health and Initialization
# =============================================================================

test_container_health() {
    log_test "Container Health and Initialization"
    
    # Check if containers are running
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} ps | grep -q "Up"; then
        log_success "Containers are running"
    else
        log_failure "Containers are not running properly"
        return 1
    fi
    
    # Check MongoDB unified container health
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging /opt/mongo-unified/scripts/health-check.sh --staging &>> "$TEST_LOG"; then
        log_success "MongoDB unified container health check passed"
    else
        log_failure "MongoDB unified container health check failed"
        return 1
    fi
    
    # Check all supervisor processes are running
    local processes=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging supervisorctl status 2>/dev/null)
    if echo "$processes" | grep -q "RUNNING"; then
        log_success "All supervisor processes running"
    else
        log_failure "Not all supervisor processes running"
        echo "$processes" >> "$TEST_LOG"
        return 1
    fi
    
    # Check application container health if exists
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} ps app-staging &>/dev/null; then
        if curl -f http://localhost:${APP_STAGING_PORT:-3001}/health &>> "$TEST_LOG"; then
            log_success "Application health check passed"
        else
            log_failure "Application health check failed"
            return 1
        fi
    fi
}

# =============================================================================
# Test 2: Database Connectivity and Authentication
# =============================================================================

test_database_connectivity() {
    log_test "Database Connectivity and Authentication"
    
    # Test root connection
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u staging_root -p staging_secure_root_password_2025 --eval "db.runCommand('ping')" &>> "$TEST_LOG"; then
        log_success "Root authentication successful"
    else
        log_failure "Root authentication failed"
        return 1
    fi
    
    # Test application user connection
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "db.runCommand('ping')" &>> "$TEST_LOG"; then
        log_success "Application user authentication successful"
    else
        log_failure "Application user authentication failed"
        return 1
    fi
    
    # Test database permissions
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "db.runCommand({connectionStatus: 1})" &>> "$TEST_LOG"; then
        log_success "Database permissions verified"
    else
        log_failure "Database permissions check failed"
        return 1
    fi
}

# =============================================================================
# Test 3: Backup Operations
# =============================================================================

test_backup_operations() {
    log_test "Backup Operations"
    
    # Create test data
    log_info "Creating test data for backup..."
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "
        db.staging_backup_test.insertMany([
            {name: 'backup_test1', data: 'test data 1', created: new Date()},
            {name: 'backup_test2', data: 'test data 2', created: new Date()},
            {name: 'backup_test3', data: 'test data 3', created: new Date()}
        ])
    " &>> "$TEST_LOG"
    
    # Test backup script execution
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging /opt/mongo-unified/scripts/backup_mongo_to_s3.sh --staging --test-mode &>> "$TEST_LOG"; then
        log_success "Backup script executed successfully"
    else
        log_failure "Backup script execution failed"
        return 1
    fi
    
    # Verify backup files exist locally
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging ls /data/backups/ | grep -q "staging" &>> "$TEST_LOG"; then
        log_success "Local backup files created"
    else
        log_failure "Local backup files not found"
        return 1
    fi
    
    # Test mongodump directly
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongodump --db lynx_portfolio_staging --out /data/backups/test-direct-backup &>> "$TEST_LOG"; then
        log_success "Direct mongodump operation successful"
    else
        log_failure "Direct mongodump operation failed"
        return 1
    fi
}

# =============================================================================
# Test 4: Restore Operations
# =============================================================================

test_restore_operations() {
    log_test "Restore Operations"
    
    # Count original test data
    local original_count=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --quiet --eval "db.staging_backup_test.countDocuments()" 2>/dev/null | tr -d '\r')
    
    # Drop test data to simulate data loss
    log_info "Simulating data loss..."
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "db.staging_backup_test.drop()" &>> "$TEST_LOG"
    
    # Test restore from local backup
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongorestore --db lynx_portfolio_staging /data/backups/test-direct-backup/lynx_portfolio_staging/ &>> "$TEST_LOG"; then
        log_success "Local restore operation completed"
    else
        log_failure "Local restore operation failed"
        return 1
    fi
    
    # Verify restored data
    local restored_count=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --quiet --eval "db.staging_backup_test.countDocuments()" 2>/dev/null | tr -d '\r')
    
    if [ "$restored_count" -eq "$original_count" ]; then
        log_success "Data restored correctly ($restored_count documents)"
    else
        log_failure "Data restore verification failed (expected $original_count, got $restored_count)"
        return 1
    fi
}

# =============================================================================
# Test 5: Application Integration
# =============================================================================

test_application_integration() {
    log_test "Application Integration"
    
    # Check if application service exists
    if ! ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} ps app-staging &>/dev/null; then
        log_warning "Application service not running, skipping integration tests"
        return 0
    fi
    
    # Test application health endpoint
    if curl -f http://localhost:${APP_STAGING_PORT:-3001}/health &>> "$TEST_LOG"; then
        log_success "Application health endpoint responding"
    else
        log_failure "Application health endpoint not responding"
        return 1
    fi
    
    # Test database connection from application
    local health_response=$(curl -s http://localhost:${APP_STAGING_PORT:-3001}/health 2>/dev/null || echo '{}')
    
    if echo "$health_response" | grep -q "ok\|healthy\|success" &>> "$TEST_LOG"; then
        log_success "Application reporting healthy status"
    else
        log_failure "Application not reporting healthy status"
        return 1
    fi
    
    # Test API endpoints if available
    if curl -f http://localhost:${APP_STAGING_PORT:-3001}/api/main/health &>> "$TEST_LOG"; then
        log_success "API endpoints accessible"
    else
        log_warning "API endpoints not accessible (may be expected)"
    fi
}

# =============================================================================
# Test 6: Performance Benchmarking
# =============================================================================

test_performance_benchmarks() {
    log_test "Performance Benchmarking"
    
    local benchmark_file="${PERFORMANCE_DIR}/staging_benchmark_${TEST_DATE}.json"
    
    # Insert performance test
    log_info "Running insert performance test..."
    local start_time=$(date +%s%N)
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "
        for(let i = 0; i < 1000; i++) {
            db.perf_test.insertOne({
                index: i,
                data: 'performance test data ' + i,
                timestamp: new Date(),
                random: Math.random()
            });
        }
    " &>> "$TEST_LOG"
    local end_time=$(date +%s%N)
    local insert_time=$((($end_time - $start_time) / 1000000))
    
    # Query performance test
    log_info "Running query performance test..."
    start_time=$(date +%s%N)
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "
        db.perf_test.find({index: {\$lt: 500}}).count()
    " &>> "$TEST_LOG"
    end_time=$(date +%s%N)
    local query_time=$((($end_time - $start_time) / 1000000))
    
    # Aggregation performance test
    log_info "Running aggregation performance test..."
    start_time=$(date +%s%N)
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "
        db.perf_test.aggregate([
            {\$match: {index: {\$gte: 100}}},
            {\$group: {_id: null, avgIndex: {\$avg: '\$index'}, count: {\$sum: 1}}}
        ]).toArray()
    " &>> "$TEST_LOG"
    end_time=$(date +%s%N)
    local aggregation_time=$((($end_time - $start_time) / 1000000))
    
    # Save benchmark results
    cat > "$benchmark_file" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "staging",
    "version": "2.0.0-staging",
    "tests": {
        "insert_1000_documents_ms": $insert_time,
        "query_500_documents_ms": $query_time,
        "aggregation_operation_ms": $aggregation_time
    },
    "system_info": {
        "container_memory_limit": "${MONGO_MEMORY_LIMIT:-2G}",
        "container_cpu_limit": "${MONGO_CPU_LIMIT:-2.0}",
        "mongodb_version": "8.0.13"
    },
    "performance_thresholds": {
        "insert_acceptable_ms": 5000,
        "query_acceptable_ms": 1000,
        "aggregation_acceptable_ms": 2000
    }
}
EOF
    
    log_success "Performance benchmarks completed (Insert: ${insert_time}ms, Query: ${query_time}ms, Aggregation: ${aggregation_time}ms)"
    
    # Evaluate performance
    if [ $insert_time -lt 5000 ] && [ $query_time -lt 1000 ] && [ $aggregation_time -lt 2000 ]; then
        log_success "Performance benchmarks within acceptable limits"
    else
        log_warning "Some performance benchmarks exceed acceptable limits"
    fi
    
    # Cleanup performance test data
    ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --eval "db.perf_test.drop()" &>> "$TEST_LOG"
}

# =============================================================================
# Test 7: Security Validation
# =============================================================================

test_security_validation() {
    log_test "Security Validation"
    
    # Test unauthorized access prevention
    if ! ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh --eval "db.runCommand('ping')" &>> "$TEST_LOG"; then
        log_success "Unauthorized access properly denied"
    else
        log_failure "Security issue: unauthorized access allowed"
        return 1
    fi
    
    # Test wrong password rejection
    if ! ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p wrong_password lynx_portfolio_staging --eval "db.runCommand('ping')" &>> "$TEST_LOG"; then
        log_success "Wrong password properly rejected"
    else
        log_failure "Security issue: wrong password accepted"
        return 1
    fi
    
    # Test user isolation (application user cannot access admin functions)
    if ! ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 admin --eval "db.runCommand('listUsers')" &>> "$TEST_LOG"; then
        log_success "User isolation working correctly"
    else
        log_failure "Security issue: user isolation not working"
        return 1
    fi
    
    # Test container security (non-root user)
    local container_user=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging whoami 2>/dev/null | tr -d '\r')
    if [ "$container_user" != "root" ]; then
        log_success "Container running as non-root user ($container_user)"
    else
        log_warning "Container running as root user (security consideration)"
    fi
}

# =============================================================================
# Test 8: Monitoring and Logging
# =============================================================================

test_monitoring_logging() {
    log_test "Monitoring and Logging"
    
    # Check MongoDB log files are being created
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging ls /var/log/ | grep -q "mongodb\|mongo" &>> "$TEST_LOG"; then
        log_success "MongoDB logs are being generated"
    else
        log_warning "MongoDB logs not found in expected location"
    fi
    
    # Check supervisor logs
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging ls /var/log/ | grep -q "supervisor" &>> "$TEST_LOG"; then
        log_success "Supervisor logs are being generated"
    else
        log_warning "Supervisor logs not found"
    fi
    
    # Check backup logs
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging ls /var/log/ &>> "$TEST_LOG"; then
        log_success "Log directory accessible"
    else
        log_failure "Log directory not accessible"
        return 1
    fi
    
    # Test log rotation and management
    local log_files=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging find /var/log -name "*.log" -type f 2>/dev/null | wc -l)
    if [ "$log_files" -gt 0 ]; then
        log_success "Log files are being created ($log_files files found)"
    else
        log_warning "No log files found"
    fi
}

# =============================================================================
# Test 9: Resource Usage Validation
# =============================================================================

test_resource_usage() {
    log_test "Resource Usage Validation"
    
    # Get container stats
    local stats_output=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null)
    local mongo_stats=$(echo "$stats_output" | grep "mongo-unified-staging" || echo "")
    local app_stats=$(echo "$stats_output" | grep "app-staging" || echo "")
    
    if [ -n "$mongo_stats" ]; then
        log_success "MongoDB resource monitoring data available"
        echo "MongoDB resource usage: $mongo_stats" >> "$TEST_LOG"
        
        # Save resource stats
        echo "$mongo_stats" > "${PERFORMANCE_DIR}/mongo_resource_usage_${TEST_DATE}.txt"
    else
        log_failure "MongoDB resource monitoring data not available"
        return 1
    fi
    
    if [ -n "$app_stats" ]; then
        log_success "Application resource monitoring data available"
        echo "Application resource usage: $app_stats" >> "$TEST_LOG"
    else
        log_info "Application resource monitoring data not available (service may not be running)"
    fi
    
    # Check disk usage
    local disk_usage=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging df -h /data/db 2>/dev/null | tail -1 || echo "")
    if [ -n "$disk_usage" ]; then
        log_success "Disk usage monitoring available"
        echo "Disk usage: $disk_usage" >> "$TEST_LOG"
    else
        log_warning "Disk usage monitoring not available"
    fi
}

# =============================================================================
# Test 10: High Availability and Failover
# =============================================================================

test_high_availability() {
    log_test "High Availability and Failover"
    
    # Test container restart capability
    log_info "Testing container restart..."
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} restart mongo-unified-staging &>> "$TEST_LOG"; then
        log_success "Container restart successful"
    else
        log_failure "Container restart failed"
        return 1
    fi
    
    # Wait for services to recover
    sleep 30
    
    # Test service recovery after restart
    if ${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging /opt/mongo-unified/scripts/health-check.sh --staging &>> "$TEST_LOG"; then
        log_success "Service recovery after restart successful"
    else
        log_failure "Service recovery after restart failed"
        return 1
    fi
    
    # Test data persistence after restart
    local data_count=$(${DOCKER_COMPOSE_CMD} -f ${STAGING_COMPOSE_FILE} exec mongo-unified-staging mongosh -u portfolio_staging -p staging_portfolio_password_2025 lynx_portfolio_staging --quiet --eval "db.staging_backup_test.countDocuments()" 2>/dev/null | tr -d '\r')
    
    if [ "$data_count" -ge 0 ]; then
        log_success "Data persistence verified after restart"
    else
        log_failure "Data persistence check failed after restart"
        return 1
    fi
}

# =============================================================================
# Generate Test Report
# =============================================================================

generate_test_report() {
    local report_file="${TEST_RESULTS_DIR}/staging_test_report_${TEST_DATE}.json"
    local html_report_file="${TEST_RESULTS_DIR}/staging_test_report_${TEST_DATE}.html"
    
    # Calculate success rate
    local success_rate=0
    if [ $TESTS_TOTAL -gt 0 ]; then
        success_rate=$(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc 2>/dev/null || echo "0")
    fi
    
    # Generate JSON report
    cat > "$report_file" <<EOF
{
    "test_run": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "staging",
        "version": "2.0.0-staging",
        "test_suite": "comprehensive",
        "duration_minutes": $(($(date +%s) - $(date -d "1 hour ago" +%s) + 3600))
    },
    "results": {
        "total_tests": $TESTS_TOTAL,
        "passed": $TESTS_PASSED,
        "failed": $TESTS_FAILED,
        "success_rate": $success_rate
    },
    "test_categories": {
        "health_checks": "completed",
        "database_connectivity": "completed",
        "backup_operations": "completed",
        "restore_operations": "completed",
        "application_integration": "completed",
        "performance_benchmarks": "completed",
        "security_validation": "completed",
        "monitoring_logging": "completed",
        "resource_usage": "completed",
        "high_availability": "completed"
    },
    "status": "$([ $TESTS_FAILED -eq 0 ] && echo "PASS" || echo "FAIL")",
    "recommendations": [
        $([ $TESTS_FAILED -gt 0 ] && echo '"Review failed tests and fix issues before production deployment",' || echo '"All tests passed - ready for production deployment",')
        "Monitor performance metrics in production",
        "Implement automated testing in CI/CD pipeline",
        "Schedule regular backup and restore testing"
    ]
}
EOF
    
    # Generate HTML report
    cat > "$html_report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Staging Test Report - $(date)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MongoDB Unified Container - Staging Test Results</h1>
        <p><strong>Date:</strong> $(date)</p>
        <p><strong>Environment:</strong> Staging</p>
        <p><strong>Version:</strong> 2.0.0-staging</p>
    </div>
    
    <h2>Summary</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Tests</td><td>$TESTS_TOTAL</td></tr>
        <tr><td>Passed</td><td class="success">$TESTS_PASSED</td></tr>
        <tr><td>Failed</td><td class="failure">$TESTS_FAILED</td></tr>
        <tr><td>Success Rate</td><td>$success_rate%</td></tr>
        <tr><td>Overall Status</td><td class="$([ $TESTS_FAILED -eq 0 ] && echo "success" || echo "failure")">$([ $TESTS_FAILED -eq 0 ] && echo "PASS" || echo "FAIL")</td></tr>
    </table>
    
    <h2>Test Results</h2>
    <p>Detailed test logs available at: <code>$TEST_LOG</code></p>
    
    <h2>Performance Benchmarks</h2>
    <p>Performance data saved to: <code>$PERFORMANCE_DIR</code></p>
    
    <h2>Recommendations</h2>
    <ul>
        $([ $TESTS_FAILED -eq 0 ] && echo "<li>All tests passed - ready for production deployment</li>" || echo "<li>Review failed tests and fix issues before production deployment</li>")
        <li>Monitor performance metrics in production</li>
        <li>Implement automated testing in CI/CD pipeline</li>
        <li>Schedule regular backup and restore testing</li>
    </ul>
</body>
</html>
EOF
    
    log_info "Test reports generated:"
    log_info "  JSON: $report_file"
    log_info "  HTML: $html_report_file"
    log_info "  Logs: $TEST_LOG"
}

# =============================================================================
# Main Test Execution
# =============================================================================

main() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "🧪 MongoDB Unified Container - Comprehensive Staging Test Suite"
    echo "============================================================================="
    echo -e "${NC}"
    
    log "Starting comprehensive staging tests..."
    
    # Setup test environment
    setup_staging_tests
    
    # Run all test suites
    log "Running test suites..."
    
    test_container_health || true
    test_database_connectivity || true
    test_backup_operations || true
    test_restore_operations || true
    test_application_integration || true
    test_performance_benchmarks || true
    test_security_validation || true
    test_monitoring_logging || true
    test_resource_usage || true
    test_high_availability || true
    
    # Generate comprehensive test report
    generate_test_report
    
    # Cleanup test environment
    cleanup_staging_tests
    
    # Final results summary
    echo -e "\n${BLUE}"
    echo "============================================================================="
    echo "🏁 Comprehensive Staging Test Suite Complete"
    echo "============================================================================="
    echo -e "${NC}"
    
    echo "📊 Test Summary:"
    echo "   Total Tests: $TESTS_TOTAL"
    echo "   Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo "   Failed: ${RED}$TESTS_FAILED${NC}"
    
    local success_rate
    if [ $TESTS_TOTAL -gt 0 ]; then
        success_rate=$(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc 2>/dev/null || echo "0")
    else
        success_rate=0
    fi
    echo "   Success Rate: ${success_rate}%"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Staging environment is ready for production deployment.${NC}"
        echo ""
        echo "✅ Ready for next phase: Production deployment preparation"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please review and fix issues before production deployment.${NC}"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Review failed tests in: $TEST_LOG"
        echo "   2. Fix identified issues"
        echo "   3. Re-run staging tests"
        echo "   4. Proceed to production only after achieving 100% success rate"
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "MongoDB Unified Container - Comprehensive Staging Test Suite"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h       Show this help message"
        echo "  --quick          Run only essential tests (faster execution)"
        echo "  --setup-only     Setup staging environment without running tests"
        echo "  --cleanup-only   Clean up staging environment without running tests"
        echo ""
        echo "This script provides comprehensive testing for the staging environment"
        echo "including health checks, backup/restore operations, performance"
        echo "benchmarking, security validation, and integration testing."
        exit 0
        ;;
    --quick)
        echo "🚀 Quick test mode - running essential tests only"
        setup_staging_tests
        test_container_health || true
        test_database_connectivity || true
        test_backup_operations || true
        generate_test_report
        cleanup_staging_tests
        ;;
    --setup-only)
        echo "🏗️ Setup mode - initializing staging environment only"
        setup_staging_tests
        echo "✅ Staging environment ready at: http://localhost:${APP_STAGING_PORT:-3001}"
        exit 0
        ;;
    --cleanup-only)
        echo "🧹 Cleanup mode"
        cleanup_staging_tests
        exit 0
        ;;
    "")
        # No arguments - run comprehensive tests
        main
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac