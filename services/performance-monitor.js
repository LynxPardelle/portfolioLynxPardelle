/**
 * Performance Monitoring System
 * Real-time monitoring with CloudWatch integration and alerting
 */

const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const express = require('express');
const axios = require('axios');

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      cloudwatch: {
        region: config.cloudwatch?.region || process.env.AWS_REGION || 'us-east-1',
        namespace: config.cloudwatch?.namespace || 'PortfolioLynxPardelle/Performance',
        enabled: config.cloudwatch?.enabled !== false && process.env.NODE_ENV !== 'development',
      },
      alerts: {
        enabled: config.alerts?.enabled !== false,
        webhookUrl: config.alerts?.webhookUrl || process.env.PERFORMANCE_ALERT_WEBHOOK,
        emailEndpoint: config.alerts?.emailEndpoint || process.env.PERFORMANCE_ALERT_EMAIL,
      },
      monitoring: {
        interval: config.monitoring?.interval || 60000, // 1 minute
        metricsRetention: config.monitoring?.metricsRetention || 86400000, // 24 hours
        enabledMetrics: config.monitoring?.enabledMetrics || [
          'upload_latency',
          'cdn_response_time',
          'cache_hit_ratio',
          'error_rate',
          'throughput'
        ],
      },
      thresholds: {
        upload_latency_p95: config.thresholds?.upload_latency_p95 || 2000,
        cdn_response_time_p95: config.thresholds?.cdn_response_time_p95 || 500,
        cache_hit_ratio_min: config.thresholds?.cache_hit_ratio_min || 0.85,
        error_rate_max: config.thresholds?.error_rate_max || 0.02,
        throughput_min: config.thresholds?.throughput_min || 100,
      },
      endpoints: {
        cdnDomain: config.endpoints?.cdnDomain || process.env.CLOUDFRONT_DOMAIN,
        apiBaseUrl: config.endpoints?.apiBaseUrl || process.env.API_BASE_URL || `http://localhost:${process.env.DEV_PORT || 6164}`,
        healthEndpoint: config.endpoints?.healthEndpoint || '/health',
      }
    };

    // Initialize AWS CloudWatch if enabled
    if (this.config.cloudwatch.enabled) {
      this.cloudwatch = new CloudWatchClient({
        region: this.config.cloudwatch.region,
        // In development, gracefully handle missing credentials
        credentials: process.env.NODE_ENV === 'development' ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || 'dev-placeholder',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'dev-placeholder'
        } : undefined
      });
    }

    // Debug: Show configuration being used
    console.log('🔧 Performance Monitor Configuration:', {
      apiBaseUrl: this.config.endpoints.apiBaseUrl,
      cdnDomain: this.config.endpoints.cdnDomain,
      healthEndpoint: this.config.endpoints.healthEndpoint,
      monitoringInterval: this.config.monitoring.interval,
      enabledMetrics: this.config.monitoring.enabledMetrics
    });

    // In-memory metrics store
    this.metrics = new Map();
    this.alertHistory = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;

    // Performance baselines (calculated from historical data)
    this.baselines = {
      upload_latency_p95: 1500,
      cdn_response_time_p95: 200,
      cache_hit_ratio: 0.92,
      error_rate: 0.005,
      throughput: 150
    };
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Performance monitoring is already running');
      return;
    }

    console.log(`🚀 Starting performance monitoring (interval: ${this.config.monitoring.interval}ms)`);
    this.isMonitoring = true;

    // Initial metrics collection
    await this.collectMetrics();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkThresholds();
        await this.publishMetrics();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, this.config.monitoring.interval);

    // Clean up old metrics periodically
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    const timestamp = Date.now();
    const metricsSnapshot = {};

    try {
      // Upload latency metrics
      if (this.config.monitoring.enabledMetrics.includes('upload_latency')) {
        metricsSnapshot.upload_latency = await this.measureUploadLatency();
      }

      // CDN response time metrics
      if (this.config.monitoring.enabledMetrics.includes('cdn_response_time')) {
        metricsSnapshot.cdn_response_time = await this.measureCdnResponseTime();
      }

      // Cache hit ratio metrics
      if (this.config.monitoring.enabledMetrics.includes('cache_hit_ratio')) {
        metricsSnapshot.cache_hit_ratio = await this.measureCacheHitRatio();
      }

      // Error rate metrics
      if (this.config.monitoring.enabledMetrics.includes('error_rate')) {
        metricsSnapshot.error_rate = await this.measureErrorRate();
      }

      // Throughput metrics
      if (this.config.monitoring.enabledMetrics.includes('throughput')) {
        metricsSnapshot.throughput = await this.measureThroughput();
      }

      // Store metrics
      this.storeMetrics(timestamp, metricsSnapshot);

      console.log(`📊 Metrics collected at ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Measure upload latency by testing existing API endpoints
   */
  async measureUploadLatency() {
    const testEndpoints = [
      `${this.config.endpoints.apiBaseUrl}/api/main/datos-autor`,
      `${this.config.endpoints.apiBaseUrl}/api/main/albums`,
      `${this.config.endpoints.apiBaseUrl}/api/main/main`
    ];

    const latencies = [];

    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();

        const response = await axios.get(endpoint, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          latencies.push(Date.now() - startTime);
        }
      } catch (error) {
        console.warn(`API latency test failed for ${endpoint}:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: endpoint
        });
      }
    }

    return {
      average: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : -1,
      p95: latencies.length > 0 ? this.calculatePercentile(latencies, 0.95) : -1,
      samples: latencies.length
    };
  }

  /**
   * Measure CDN response times
   */
  async measureCdnResponseTime() {
    if (!this.config.endpoints.cdnDomain) {
      return { average: -1, p95: -1, samples: 0 };
    }

    const testPaths = [
      '/uploads/main/test-image-small.jpg',
      '/uploads/main/test-image-medium.jpg',
      '/uploads/albums/test-album-cover.jpg',
      '/static/css/style.css',
      '/static/js/main.js'
    ];

    const responseTimes = [];

    for (const path of testPaths) {
      try {
        const url = `https://${this.config.endpoints.cdnDomain}${path}`;
        const startTime = Date.now();

        const response = await axios.get(url, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept 404s for test files
        });

        responseTimes.push(Date.now() - startTime);
      } catch (error) {
        console.warn(`CDN response test failed for ${path}:`, error.message);
      }
    }

    return {
      average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : -1,
      p95: responseTimes.length > 0 ? this.calculatePercentile(responseTimes, 0.95) : -1,
      samples: responseTimes.length
    };
  }

  /**
   * Measure cache hit ratio from CDN headers
   */
  async measureCacheHitRatio() {
    if (!this.config.endpoints.cdnDomain) {
      return { ratio: -1, hits: 0, total: 0 };
    }

    const testUrls = [
      `https://${this.config.endpoints.cdnDomain}/uploads/main/sample1.jpg`,
      `https://${this.config.endpoints.cdnDomain}/uploads/main/sample2.jpg`,
      `https://${this.config.endpoints.cdnDomain}/uploads/albums/sample3.jpg`,
      `https://${this.config.endpoints.cdnDomain}/static/css/style.css`,
      `https://${this.config.endpoints.cdnDomain}/static/js/main.js`
    ];

    let hits = 0;
    let total = 0;

    for (const url of testUrls) {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept 404s for test files
        });

        total++;
        const cacheStatus = response.headers['x-cache'] || response.headers['cloudfront-cache-status'] || '';
        
        if (cacheStatus.toLowerCase().includes('hit')) {
          hits++;
        }
      } catch (error) {
        console.warn(`Cache ratio test failed for ${url}:`, error.message);
      }
    }

    return {
      ratio: total > 0 ? hits / total : -1,
      hits: hits,
      total: total
    };
  }

  /**
   * Measure error rate from health endpoint
   */
  async measureErrorRate() {
    const testEndpoints = [
      `${this.config.endpoints.apiBaseUrl}${this.config.endpoints.healthEndpoint}`,
      `${this.config.endpoints.apiBaseUrl}/api/main/health`,
      `${this.config.endpoints.apiBaseUrl}/api/article/health`
    ];

    let errors = 0;
    let total = 0;

    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 5000 });
        total++;
        
        if (response.status >= 400) {
          errors++;
        }
      } catch (error) {
        total++;
        errors++;
      }
    }

    return {
      rate: total > 0 ? errors / total : -1,
      errors: errors,
      total: total
    };
  }

  /**
   * Measure system throughput
   */
  async measureThroughput() {
    // Estimate throughput based on recent API response times
    const avgApiResponseTime = this.getRecentMetric('upload_latency', 'average');
    if (avgApiResponseTime > 0) {
      const estimatedRps = Math.floor(1000 / avgApiResponseTime);
      return {
        requests_per_second: estimatedRps,
        bytes_per_second: -1
      };
    }

    // Fallback: use health endpoint response time as baseline
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.endpoints.apiBaseUrl}/health`, {
        timeout: 5000
      });

      if (response.status === 200) {
        const responseTime = Date.now() - startTime;
        const estimatedRps = Math.floor(1000 / responseTime);
        return {
          requests_per_second: estimatedRps,
          bytes_per_second: -1
        };
      }
    } catch (error) {
      console.warn('Could not measure throughput via health endpoint:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${this.config.endpoints.apiBaseUrl}/health`
      });
    }

    return {
      requests_per_second: -1,
      bytes_per_second: -1
    };
  }

  /**
   * Store metrics in memory with timestamp
   */
  storeMetrics(timestamp, metricsSnapshot) {
    this.metrics.set(timestamp, metricsSnapshot);
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  async checkThresholds() {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    const alerts = [];

    // Check upload latency threshold
    if (latestMetrics.upload_latency?.p95 > this.config.thresholds.upload_latency_p95) {
      alerts.push({
        type: 'upload_latency_high',
        metric: 'upload_latency_p95',
        value: latestMetrics.upload_latency.p95,
        threshold: this.config.thresholds.upload_latency_p95,
        severity: 'warning'
      });
    }

    // Check CDN response time threshold
    if (latestMetrics.cdn_response_time?.p95 > this.config.thresholds.cdn_response_time_p95) {
      alerts.push({
        type: 'cdn_response_time_high',
        metric: 'cdn_response_time_p95',
        value: latestMetrics.cdn_response_time.p95,
        threshold: this.config.thresholds.cdn_response_time_p95,
        severity: 'warning'
      });
    }

    // Check cache hit ratio threshold
    if (latestMetrics.cache_hit_ratio?.ratio < this.config.thresholds.cache_hit_ratio_min) {
      alerts.push({
        type: 'cache_hit_ratio_low',
        metric: 'cache_hit_ratio',
        value: latestMetrics.cache_hit_ratio.ratio,
        threshold: this.config.thresholds.cache_hit_ratio_min,
        severity: 'warning'
      });
    }

    // Check error rate threshold
    if (latestMetrics.error_rate?.rate > this.config.thresholds.error_rate_max) {
      alerts.push({
        type: 'error_rate_high',
        metric: 'error_rate',
        value: latestMetrics.error_rate.rate,
        threshold: this.config.thresholds.error_rate_max,
        severity: 'critical'
      });
    }

    // Send alerts if any
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Publish metrics to CloudWatch
   */
  async publishMetrics() {
    if (!this.config.cloudwatch.enabled || !this.cloudwatch) {
      return;
    }

    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    try {
      const metricData = [];

      // Upload latency metrics
      if (latestMetrics.upload_latency && latestMetrics.upload_latency.p95 > 0) {
        metricData.push({
          MetricName: 'UploadLatencyP95',
          Value: latestMetrics.upload_latency.p95,
          Unit: 'Milliseconds',
          Timestamp: new Date()
        });
      }

      // CDN response time metrics
      if (latestMetrics.cdn_response_time && latestMetrics.cdn_response_time.p95 > 0) {
        metricData.push({
          MetricName: 'CdnResponseTimeP95',
          Value: latestMetrics.cdn_response_time.p95,
          Unit: 'Milliseconds',
          Timestamp: new Date()
        });
      }

      // Cache hit ratio metrics
      if (latestMetrics.cache_hit_ratio && latestMetrics.cache_hit_ratio.ratio >= 0) {
        metricData.push({
          MetricName: 'CacheHitRatio',
          Value: latestMetrics.cache_hit_ratio.ratio * 100, // Convert to percentage
          Unit: 'Percent',
          Timestamp: new Date()
        });
      }

      // Error rate metrics
      if (latestMetrics.error_rate && latestMetrics.error_rate.rate >= 0) {
        metricData.push({
          MetricName: 'ErrorRate',
          Value: latestMetrics.error_rate.rate * 100, // Convert to percentage
          Unit: 'Percent',
          Timestamp: new Date()
        });
      }

      // Throughput metrics
      if (latestMetrics.throughput?.requests_per_second > 0) {
        metricData.push({
          MetricName: 'RequestsPerSecond',
          Value: latestMetrics.throughput.requests_per_second,
          Unit: 'Count/Second',
          Timestamp: new Date()
        });
      }

      if (metricData.length > 0) {
        const command = new PutMetricDataCommand({
          Namespace: this.config.cloudwatch.namespace,
          MetricData: metricData
        });

        await this.cloudwatch.send(command);
        console.log(`📤 Published ${metricData.length} metrics to CloudWatch`);
      } else {
        console.log('📊 No valid metrics to publish to CloudWatch');
      }
    } catch (error) {
      // Handle credentials and network errors gracefully in development
      if (error.name === 'CredentialsProviderError' || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'CredentialsError' ||
          error.message?.includes('Missing credentials')) {
        
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ CloudWatch metrics skipped: AWS credentials not available in development');
        } else {
          console.error('❌ CloudWatch credentials error:', error.message);
        }
      } else {
        console.error('❌ Error publishing metrics to CloudWatch:', error.message);
      }
    }
  }

  /**
   * Send performance alert
   */
  async sendAlert(alert) {
    const alertMessage = {
      timestamp: new Date().toISOString(),
      type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
      current_value: alert.value,
      threshold: alert.threshold,
      message: this.formatAlertMessage(alert)
    };

    // Store in alert history
    this.alertHistory.push(alertMessage);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }

    console.warn(`🚨 Performance Alert [${alert.severity.toUpperCase()}]: ${alertMessage.message}`);

    // Send webhook notification
    if (this.config.alerts.enabled && this.config.alerts.webhookUrl) {
      try {
        await axios.post(this.config.alerts.webhookUrl, alertMessage, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error.message);
      }
    }

    // Send email notification for critical alerts
    if (alert.severity === 'critical' && this.config.alerts.emailEndpoint) {
      try {
        await axios.post(this.config.alerts.emailEndpoint, {
          subject: `🚨 Critical Performance Alert: ${alert.type}`,
          message: alertMessage.message,
          alert: alertMessage
        }, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Failed to send email alert:', error.message);
      }
    }
  }

  /**
   * Format alert message
   */
  formatAlertMessage(alert) {
    const formatValue = (value) => {
      if (alert.metric.includes('ratio')) {
        return `${(value * 100).toFixed(2)}%`;
      } else if (alert.metric.includes('rate')) {
        return `${(value * 100).toFixed(2)}%`;
      } else {
        return `${value.toFixed(2)}ms`;
      }
    };

    return `Performance threshold exceeded: ${alert.metric} is ${formatValue(alert.value)} (threshold: ${formatValue(alert.threshold)})`;
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics() {
    const timestamps = Array.from(this.metrics.keys()).sort().reverse();
    return timestamps.length > 0 ? this.metrics.get(timestamps[0]) : null;
  }

  /**
   * Get recent metric value
   */
  getRecentMetric(metricName, property, lookbackMinutes = 5) {
    const lookbackTime = Date.now() - (lookbackMinutes * 60 * 1000);
    const recentEntries = Array.from(this.metrics.entries())
      .filter(([timestamp]) => timestamp >= lookbackTime)
      .map(([_, metrics]) => metrics[metricName]?.[property])
      .filter(value => value !== undefined && value >= 0);

    return recentEntries.length > 0 ? 
      recentEntries.reduce((a, b) => a + b, 0) / recentEntries.length : -1;
  }

  /**
   * Get performance dashboard data
   */
  getDashboardData(timeRangeMinutes = 60) {
    const cutoffTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    const recentMetrics = Array.from(this.metrics.entries())
      .filter(([timestamp]) => timestamp >= cutoffTime)
      .sort(([a], [b]) => a - b);

    return {
      timeRange: timeRangeMinutes,
      dataPoints: recentMetrics.length,
      metrics: {
        upload_latency: this.extractMetricSeries(recentMetrics, 'upload_latency'),
        cdn_response_time: this.extractMetricSeries(recentMetrics, 'cdn_response_time'),
        cache_hit_ratio: this.extractMetricSeries(recentMetrics, 'cache_hit_ratio'),
        error_rate: this.extractMetricSeries(recentMetrics, 'error_rate'),
        throughput: this.extractMetricSeries(recentMetrics, 'throughput')
      },
      thresholds: this.config.thresholds,
      baselines: this.baselines,
      recentAlerts: this.alertHistory.slice(-10)
    };
  }

  /**
   * Extract metric time series
   */
  extractMetricSeries(metricsEntries, metricName) {
    return metricsEntries.map(([timestamp, metrics]) => ({
      timestamp: timestamp,
      value: metrics[metricName]
    })).filter(entry => entry.value !== undefined);
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - this.config.monitoring.metricsRetention;
    const keysToDelete = Array.from(this.metrics.keys()).filter(timestamp => timestamp < cutoffTime);
    
    keysToDelete.forEach(key => this.metrics.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} old metric entries`);
    }
  }

  /**
   * Calculate percentile from array of values
   */
  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Export monitoring data for external analysis
   */
  exportMetrics(format = 'json') {
    const data = {
      config: this.config,
      baselines: this.baselines,
      metrics: Object.fromEntries(this.metrics),
      alertHistory: this.alertHistory,
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format for spreadsheet analysis
      return this.convertToCsv(data);
    }

    return data;
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCsv(data) {
    const headers = ['timestamp', 'upload_latency_p95', 'cdn_response_time_p95', 'cache_hit_ratio', 'error_rate', 'throughput_rps'];
    const rows = [headers.join(',')];

    Object.entries(data.metrics).forEach(([timestamp, metrics]) => {
      const row = [
        new Date(parseInt(timestamp)).toISOString(),
        metrics.upload_latency?.p95 || '',
        metrics.cdn_response_time?.p95 || '',
        metrics.cache_hit_ratio?.ratio || '',
        metrics.error_rate?.rate || '',
        metrics.throughput?.requests_per_second || ''
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }
}

module.exports = PerformanceMonitor;