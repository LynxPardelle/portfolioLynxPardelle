/**
 * Performance Monitoring API Routes
 * Express routes for performance monitoring dashboard and metrics
 */

const express = require('express');
const router = express.Router();
const PerformanceMonitor = require('../services/performance-monitor');

// Initialize performance monitor
const monitor = new PerformanceMonitor({
  cloudwatch: {
    enabled: process.env.CLOUDWATCH_ENABLED === 'true',
    region: process.env.AWS_REGION || 'us-east-1',
    namespace: 'PortfolioLynxPardelle/Performance'
  },
  alerts: {
    enabled: process.env.PERFORMANCE_ALERTS_ENABLED !== 'false',
    webhookUrl: process.env.PERFORMANCE_ALERT_WEBHOOK,
    emailEndpoint: process.env.PERFORMANCE_ALERT_EMAIL
  },
  endpoints: {
    cdnDomain: process.env.CLOUDFRONT_DOMAIN,
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.DEV_PORT || 6164}`
  },
  thresholds: {
    upload_latency_p95: parseInt(process.env.UPLOAD_LATENCY_THRESHOLD) || 2000,
    cdn_response_time_p95: parseInt(process.env.CDN_RESPONSE_THRESHOLD) || 500,
    cache_hit_ratio_min: parseFloat(process.env.CACHE_HIT_RATIO_THRESHOLD) || 0.85,
    error_rate_max: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.02
  }
});

// Start monitoring when module loads
monitor.startMonitoring().catch(console.error);

/**
 * GET /api/performance/dashboard
 * Returns performance dashboard data
 */
router.get('/dashboard', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 60; // Default 1 hour
    const dashboardData = monitor.getDashboardData(timeRange);
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/metrics/current
 * Returns current performance metrics
 */
router.get('/metrics/current', (req, res) => {
  try {
    const latestMetrics = monitor.getLatestMetrics();
    
    if (!latestMetrics) {
      return res.json({
        success: true,
        data: null,
        message: 'No metrics available yet'
      });
    }

    res.json({
      success: true,
      data: latestMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Current metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/metrics/history
 * Returns historical performance metrics
 */
router.get('/metrics/history', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 240; // Default 4 hours
    const metric = req.query.metric; // Optional: filter by specific metric
    
    const dashboardData = monitor.getDashboardData(timeRange);
    
    let responseData = dashboardData.metrics;
    
    // Filter by specific metric if requested
    if (metric && responseData[metric]) {
      responseData = { [metric]: responseData[metric] };
    }
    
    res.json({
      success: true,
      data: responseData,
      timeRange: timeRange,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics history',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/alerts
 * Returns recent performance alerts
 */
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const severity = req.query.severity; // Optional: filter by severity
    
    let alerts = [...monitor.alertHistory];
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Apply limit
    alerts = alerts.slice(-limit);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alerts retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/thresholds
 * Returns current performance thresholds and baselines
 */
router.get('/thresholds', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        thresholds: monitor.config.thresholds,
        baselines: monitor.baselines,
        config: {
          monitoring_interval: monitor.config.monitoring.interval,
          enabled_metrics: monitor.config.monitoring.enabledMetrics,
          alerts_enabled: monitor.config.alerts.enabled,
          cloudwatch_enabled: monitor.config.cloudwatch.enabled
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Thresholds retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve thresholds',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/thresholds
 * Update performance thresholds
 */
router.post('/thresholds', (req, res) => {
  try {
    const { thresholds, baselines } = req.body;
    
    // Validate threshold values
    const validThresholds = {};
    if (thresholds) {
      if (thresholds.upload_latency_p95 && thresholds.upload_latency_p95 > 0) {
        validThresholds.upload_latency_p95 = thresholds.upload_latency_p95;
      }
      if (thresholds.cdn_response_time_p95 && thresholds.cdn_response_time_p95 > 0) {
        validThresholds.cdn_response_time_p95 = thresholds.cdn_response_time_p95;
      }
      if (thresholds.cache_hit_ratio_min && thresholds.cache_hit_ratio_min > 0 && thresholds.cache_hit_ratio_min <= 1) {
        validThresholds.cache_hit_ratio_min = thresholds.cache_hit_ratio_min;
      }
      if (thresholds.error_rate_max && thresholds.error_rate_max > 0 && thresholds.error_rate_max <= 1) {
        validThresholds.error_rate_max = thresholds.error_rate_max;
      }
    }
    
    // Update thresholds
    Object.assign(monitor.config.thresholds, validThresholds);
    
    // Update baselines if provided
    if (baselines) {
      Object.assign(monitor.baselines, baselines);
    }
    
    res.json({
      success: true,
      data: {
        updated_thresholds: validThresholds,
        current_thresholds: monitor.config.thresholds,
        current_baselines: monitor.baselines
      },
      message: 'Thresholds updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Threshold update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/collect
 * Manually trigger metrics collection
 */
router.post('/collect', async (req, res) => {
  try {
    await monitor.collectMetrics();
    
    const latestMetrics = monitor.getLatestMetrics();
    
    res.json({
      success: true,
      data: latestMetrics,
      message: 'Metrics collected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual metrics collection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/export
 * Export performance data for analysis
 */
router.get('/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const exportData = monitor.exportMetrics(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="performance-metrics-${Date.now()}.csv"`);
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="performance-metrics-${Date.now()}.json"`);
      res.send(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/health
 * Performance monitoring system health check
 */
router.get('/health', (req, res) => {
  try {
    const health = {
      monitoring_active: monitor.isMonitoring,
      metrics_count: monitor.metrics.size,
      alerts_count: monitor.alertHistory.length,
      last_collection: monitor.metrics.size > 0 ? 
        new Date(Math.max(...monitor.metrics.keys())).toISOString() : null,
      config: {
        cloudwatch_enabled: monitor.config.cloudwatch.enabled,
        alerts_enabled: monitor.config.alerts.enabled,
        monitoring_interval: monitor.config.monitoring.interval
      }
    };
    
    res.json({
      success: true,
      data: health,
      status: monitor.isMonitoring ? 'healthy' : 'inactive',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/start
 * Start performance monitoring
 */
router.post('/start', async (req, res) => {
  try {
    if (monitor.isMonitoring) {
      return res.json({
        success: true,
        message: 'Performance monitoring is already running'
      });
    }
    
    await monitor.startMonitoring();
    
    res.json({
      success: true,
      message: 'Performance monitoring started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/stop
 * Stop performance monitoring
 */
router.post('/stop', (req, res) => {
  try {
    monitor.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Performance monitoring stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      message: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping performance monitoring...');
  monitor.stopMonitoring();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping performance monitoring...');
  monitor.stopMonitoring();
  process.exit(0);
});

module.exports = router;