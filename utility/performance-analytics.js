#!/usr/bin/env node
/**
 * Performance Analytics and Monitoring System
 * Real-time performance tracking for S3/CloudFront operations
 * Integrates with application metrics and AWS CloudWatch
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class PerformanceAnalytics extends EventEmitter {
  constructor() {
    super();
    
    this.cloudWatch = new AWS.CloudWatch({ region: process.env.S3_REGION || 'us-east-1' });
    this.s3 = new AWS.S3({ region: process.env.S3_REGION || 'us-east-1' });
    
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    // Performance tracking
    this.metrics = {
      uploads: [],
      downloads: [],
      cacheHits: [],
      errors: []
    };
    
    // Real-time monitoring configuration
    this.monitoringConfig = {
      enabled: false,
      interval: 60000,        // 1 minute
      batchSize: 100,         // Process 100 metrics at a time
      retentionDays: 30       // Keep metrics for 30 days
    };
    
    this.metricsDir = './metrics/performance';
    this.initializeMetricsDir();
  }

  async initializeMetricsDir() {
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create metrics directory:', error.message);
    }
  }

  /**
   * Start real-time performance monitoring
   */
  async startMonitoring() {
    if (this.monitoringConfig.enabled) {
      console.log('⚠️  Monitoring already started');
      return;
    }

    console.log('🚀 Starting performance monitoring...');
    this.monitoringConfig.enabled = true;
    
    // Start periodic metric collection
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectRealTimeMetrics();
      } catch (error) {
        console.error('❌ Metric collection failed:', error);
        this.emit('error', error);
      }
    }, this.monitoringConfig.interval);

    // Start performance analysis
    this.analysisInterval = setInterval(async () => {
      try {
        await this.analyzePerformanceTrends();
      } catch (error) {
        console.error('❌ Performance analysis failed:', error);
      }
    }, this.monitoringConfig.interval * 5); // Every 5 minutes

    console.log('✅ Performance monitoring started');
    this.emit('monitoring-started');
  }

  /**
   * Stop real-time performance monitoring
   */
  stopMonitoring() {
    if (!this.monitoringConfig.enabled) {
      console.log('⚠️  Monitoring not running');
      return;
    }

    console.log('🛑 Stopping performance monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.monitoringConfig.enabled = false;
    console.log('✅ Performance monitoring stopped');
    this.emit('monitoring-stopped');
  }

  /**
   * Collect real-time metrics from CloudWatch and application
   */
  async collectRealTimeMetrics() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      // CloudFront metrics
      const cloudFrontMetrics = await this.getCloudFrontRealTimeMetrics(fiveMinutesAgo, now);
      
      // S3 metrics
      const s3Metrics = await this.getS3RealTimeMetrics(fiveMinutesAgo, now);
      
      // Application metrics (from internal tracking)
      const appMetrics = await this.getApplicationRealTimeMetrics(fiveMinutesAgo, now);
      
      // Store metrics
      const metricsSnapshot = {
        timestamp: now.toISOString(),
        cloudFront: cloudFrontMetrics,
        s3: s3Metrics,
        application: appMetrics
      };
      
      await this.storeMetrics(metricsSnapshot);
      
      // Emit metrics for real-time processing
      this.emit('metrics-collected', metricsSnapshot);
      
      // Check for alerts
      await this.checkRealTimeAlerts(metricsSnapshot);
      
    } catch (error) {
      console.warn('⚠️  Real-time metric collection failed:', error.message);
    }
  }

  /**
   * Get CloudFront real-time metrics
   */
  async getCloudFrontRealTimeMetrics(startTime, endTime) {
    const params = {
      Namespace: 'AWS/CloudFront',
      Dimensions: [
        {
          Name: 'DistributionId',
          Value: this.distributionId
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Sum', 'Average']
    };

    try {
      const [requests, cacheHitRate, bytesDownloaded, errors] = await Promise.all([
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'Requests' }).promise(),
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'CacheHitRate' }).promise(),
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'BytesDownloaded' }).promise(),
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: '4xxErrorRate' }).promise()
      ]);

      return {
        requests: this.getLatestDatapoint(requests.Datapoints),
        cacheHitRate: this.getLatestDatapoint(cacheHitRate.Datapoints),
        bytesDownloaded: this.getLatestDatapoint(bytesDownloaded.Datapoints),
        errorRate: this.getLatestDatapoint(errors.Datapoints)
      };

    } catch (error) {
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get S3 real-time metrics
   */
  async getS3RealTimeMetrics(startTime, endTime) {
    const params = {
      Namespace: 'AWS/S3',
      Dimensions: [
        {
          Name: 'BucketName',
          Value: this.bucketName
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Sum', 'Average']
    };

    try {
      const [requests, errors, latency] = await Promise.all([
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'AllRequests' }).promise(),
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: '4xxErrors' }).promise(),
        this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'FirstByteLatency' }).promise()
      ]);

      return {
        requests: this.getLatestDatapoint(requests.Datapoints),
        errors: this.getLatestDatapoint(errors.Datapoints),
        latency: this.getLatestDatapoint(latency.Datapoints)
      };

    } catch (error) {
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get application-specific real-time metrics
   */
  async getApplicationRealTimeMetrics(startTime, endTime) {
    // This would integrate with your application's metric collection
    // For now, return simulated data based on recent activity
    
    return {
      uploadLatency: {
        average: Math.random() * 2000 + 1000, // 1-3 seconds
        count: Math.floor(Math.random() * 10)
      },
      downloadLatency: {
        average: Math.random() * 500 + 200, // 200-700ms
        count: Math.floor(Math.random() * 50)
      },
      featureFlagUsage: {
        s3CDNStorage: Math.random() > 0.1, // 90% using S3
        legacyFilesystem: Math.random() > 0.8 // 20% fallback
      }
    };
  }

  /**
   * Analyze performance trends and generate insights
   */
  async analyzePerformanceTrends() {
    console.log('📊 Analyzing performance trends...');
    
    try {
      // Load recent metrics
      const recentMetrics = await this.loadRecentMetrics(24); // Last 24 hours
      
      if (recentMetrics.length < 5) {
        console.log('⚠️  Insufficient data for trend analysis');
        return;
      }

      // Analyze trends
      const trends = {
        cacheHitRate: this.analyzeTrend(recentMetrics.map(m => m.cloudFront?.cacheHitRate?.Average || 0)),
        requestVolume: this.analyzeTrend(recentMetrics.map(m => m.cloudFront?.requests?.Sum || 0)),
        errorRate: this.analyzeTrend(recentMetrics.map(m => m.cloudFront?.errorRate?.Average || 0)),
        s3Latency: this.analyzeTrend(recentMetrics.map(m => m.s3?.latency?.Average || 0))
      };

      // Generate performance insights
      const insights = this.generatePerformanceInsights(trends, recentMetrics);
      
      // Save trend analysis
      await this.saveTrendAnalysis({
        timestamp: new Date().toISOString(),
        trends: trends,
        insights: insights,
        dataPoints: recentMetrics.length
      });

      // Emit trend analysis
      this.emit('trend-analysis', { trends, insights });

    } catch (error) {
      console.error('❌ Trend analysis failed:', error);
    }
  }

  /**
   * Analyze trend direction and strength
   */
  analyzeTrend(values) {
    if (values.length < 3) return { direction: 'unknown', strength: 0 };
    
    // Simple linear regression to determine trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for trend strength
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      strength: Math.abs(rSquared),
      slope: slope,
      correlation: rSquared
    };
  }

  /**
   * Generate performance insights based on trends
   */
  generatePerformanceInsights(trends, recentMetrics) {
    const insights = [];
    
    // Cache hit rate insights
    if (trends.cacheHitRate.direction === 'decreasing' && trends.cacheHitRate.strength > 0.5) {
      insights.push({
        type: 'warning',
        category: 'cache',
        message: 'Cache hit rate is decreasing, which may increase costs and latency',
        recommendation: 'Review cache behaviors and TTL settings'
      });
    }
    
    // Request volume insights
    if (trends.requestVolume.direction === 'increasing' && trends.requestVolume.strength > 0.7) {
      insights.push({
        type: 'info',
        category: 'traffic',
        message: 'Request volume is steadily increasing',
        recommendation: 'Monitor capacity and consider scaling optimizations'
      });
    }
    
    // Error rate insights
    if (trends.errorRate.direction === 'increasing') {
      insights.push({
        type: 'critical',
        category: 'errors',
        message: 'Error rate is increasing',
        recommendation: 'Investigate error patterns and root causes immediately'
      });
    }
    
    // Latency insights
    if (trends.s3Latency.direction === 'increasing' && trends.s3Latency.strength > 0.6) {
      insights.push({
        type: 'warning',
        category: 'performance',
        message: 'S3 latency is increasing',
        recommendation: 'Check S3 request patterns and consider regional optimization'
      });
    }

    return insights;
  }

  /**
   * Check for real-time performance alerts
   */
  async checkRealTimeAlerts(metricsSnapshot) {
    const alerts = [];
    
    // Cache hit rate alert
    const cacheHitRate = metricsSnapshot.cloudFront?.cacheHitRate?.Average || 0;
    if (cacheHitRate < 75) {
      alerts.push({
        severity: 'warning',
        type: 'cache_hit_rate_low',
        message: `Cache hit rate dropped to ${cacheHitRate.toFixed(1)}%`,
        threshold: 75,
        value: cacheHitRate
      });
    }
    
    // Error rate alert
    const errorRate = metricsSnapshot.cloudFront?.errorRate?.Average || 0;
    if (errorRate > 5) {
      alerts.push({
        severity: 'critical',
        type: 'error_rate_high',
        message: `Error rate elevated to ${errorRate.toFixed(1)}%`,
        threshold: 5,
        value: errorRate
      });
    }
    
    // S3 latency alert
    const s3Latency = metricsSnapshot.s3?.latency?.Average || 0;
    if (s3Latency > 1000) {
      alerts.push({
        severity: 'warning',
        type: 's3_latency_high',
        message: `S3 latency increased to ${s3Latency.toFixed(0)}ms`,
        threshold: 1000,
        value: s3Latency
      });
    }

    if (alerts.length > 0) {
      this.emit('performance-alerts', alerts);
      await this.saveAlerts(alerts);
    }
  }

  /**
   * Store metrics to file system
   */
  async storeMetrics(metricsSnapshot) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `performance-metrics-${date}.jsonl`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      const line = JSON.stringify(metricsSnapshot) + '\n';
      await fs.appendFile(filepath, line);
    } catch (error) {
      console.warn('⚠️  Failed to store metrics:', error.message);
    }
  }

  /**
   * Load recent metrics for analysis
   */
  async loadRecentMetrics(hours) {
    const metrics = [];
    const now = new Date();
    
    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const filename = `performance-metrics-${dateStr}.jsonl`;
      const filepath = path.join(this.metricsDir, filename);
      
      try {
        const content = await fs.readFile(filepath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        for (const line of lines) {
          try {
            const metric = JSON.parse(line);
            const metricTime = new Date(metric.timestamp);
            
            // Only include metrics from the specified time window
            if (metricTime >= new Date(now.getTime() - hours * 60 * 60 * 1000)) {
              metrics.push(metric);
            }
          } catch (parseError) {
            // Skip invalid JSON lines
          }
        }
      } catch (error) {
        // File doesn't exist or can't be read, skip
      }
    }
    
    return metrics.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(hours = 24) {
    console.log(`📊 Generating ${hours}-hour performance report...`);
    
    try {
      const metrics = await this.loadRecentMetrics(hours);
      
      if (metrics.length === 0) {
        return {
          error: 'No metrics available for the specified time period',
          timeWindow: `${hours} hours`,
          dataPoints: 0
        };
      }

      // Calculate aggregated statistics
      const report = {
        timeWindow: `${hours} hours`,
        dataPoints: metrics.length,
        generatedAt: new Date().toISOString(),
        
        cloudFront: this.aggregateCloudFrontMetrics(metrics),
        s3: this.aggregateS3Metrics(metrics),
        application: this.aggregateApplicationMetrics(metrics),
        
        trends: {
          cacheHitRate: this.analyzeTrend(metrics.map(m => m.cloudFront?.cacheHitRate?.Average || 0)),
          requestVolume: this.analyzeTrend(metrics.map(m => m.cloudFront?.requests?.Sum || 0)),
          errorRate: this.analyzeTrend(metrics.map(m => m.cloudFront?.errorRate?.Average || 0))
        },
        
        insights: []
      };

      // Generate insights
      report.insights = this.generatePerformanceInsights(report.trends, metrics);
      
      // Save report
      await this.savePerformanceReport(report);
      
      return report;

    } catch (error) {
      console.error('❌ Performance report generation failed:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  getLatestDatapoint(datapoints) {
    if (!datapoints || datapoints.length === 0) return null;
    return datapoints.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))[0];
  }

  getEmptyMetrics() {
    return {
      requests: null,
      cacheHitRate: null,
      bytesDownloaded: null,
      errorRate: null
    };
  }

  async saveTrendAnalysis(analysis) {
    const filename = `trend-analysis-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(analysis, null, 2));
    } catch (error) {
      console.warn('⚠️  Failed to save trend analysis:', error.message);
    }
  }

  async saveAlerts(alerts) {
    const filename = `performance-alerts-${new Date().toISOString().split('T')[0]}.jsonl`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        alerts: alerts
      }) + '\n';
      await fs.appendFile(filepath, line);
    } catch (error) {
      console.warn('⚠️  Failed to save alerts:', error.message);
    }
  }

  async savePerformanceReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${report.timeWindow.replace(' ', '-')}-${timestamp}.json`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`📄 Performance report saved: ${filepath}`);
    } catch (error) {
      console.warn('⚠️  Failed to save performance report:', error.message);
    }
  }

  aggregateCloudFrontMetrics(metrics) {
    const values = {
      requests: metrics.map(m => m.cloudFront?.requests?.Sum || 0).filter(v => v > 0),
      cacheHitRate: metrics.map(m => m.cloudFront?.cacheHitRate?.Average || 0).filter(v => v > 0),
      bytesDownloaded: metrics.map(m => m.cloudFront?.bytesDownloaded?.Sum || 0).filter(v => v > 0),
      errorRate: metrics.map(m => m.cloudFront?.errorRate?.Average || 0)
    };

    return {
      requests: {
        total: values.requests.reduce((sum, val) => sum + val, 0),
        average: values.requests.length ? values.requests.reduce((sum, val) => sum + val, 0) / values.requests.length : 0,
        peak: values.requests.length ? Math.max(...values.requests) : 0
      },
      cacheHitRate: {
        average: values.cacheHitRate.length ? values.cacheHitRate.reduce((sum, val) => sum + val, 0) / values.cacheHitRate.length : 0,
        minimum: values.cacheHitRate.length ? Math.min(...values.cacheHitRate) : 0,
        maximum: values.cacheHitRate.length ? Math.max(...values.cacheHitRate) : 0
      },
      bytesDownloaded: {
        total: values.bytesDownloaded.reduce((sum, val) => sum + val, 0),
        average: values.bytesDownloaded.length ? values.bytesDownloaded.reduce((sum, val) => sum + val, 0) / values.bytesDownloaded.length : 0
      },
      errorRate: {
        average: values.errorRate.length ? values.errorRate.reduce((sum, val) => sum + val, 0) / values.errorRate.length : 0,
        maximum: values.errorRate.length ? Math.max(...values.errorRate) : 0
      }
    };
  }

  aggregateS3Metrics(metrics) {
    const values = {
      requests: metrics.map(m => m.s3?.requests?.Sum || 0).filter(v => v > 0),
      errors: metrics.map(m => m.s3?.errors?.Sum || 0),
      latency: metrics.map(m => m.s3?.latency?.Average || 0).filter(v => v > 0)
    };

    return {
      requests: {
        total: values.requests.reduce((sum, val) => sum + val, 0),
        average: values.requests.length ? values.requests.reduce((sum, val) => sum + val, 0) / values.requests.length : 0
      },
      errors: {
        total: values.errors.reduce((sum, val) => sum + val, 0),
        rate: values.requests.length ? (values.errors.reduce((sum, val) => sum + val, 0) / values.requests.reduce((sum, val) => sum + val, 0)) * 100 : 0
      },
      latency: {
        average: values.latency.length ? values.latency.reduce((sum, val) => sum + val, 0) / values.latency.length : 0,
        maximum: values.latency.length ? Math.max(...values.latency) : 0,
        minimum: values.latency.length ? Math.min(...values.latency) : 0
      }
    };
  }

  aggregateApplicationMetrics(metrics) {
    return {
      uploadLatency: {
        average: metrics.reduce((sum, m) => sum + (m.application?.uploadLatency?.average || 0), 0) / metrics.length,
        samples: metrics.reduce((sum, m) => sum + (m.application?.uploadLatency?.count || 0), 0)
      },
      downloadLatency: {
        average: metrics.reduce((sum, m) => sum + (m.application?.downloadLatency?.average || 0), 0) / metrics.length,
        samples: metrics.reduce((sum, m) => sum + (m.application?.downloadLatency?.count || 0), 0)
      }
    };
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const analytics = new PerformanceAnalytics();

  console.log('📊 Performance Analytics');
  console.log('═'.repeat(40));

  try {
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    if (args.includes('--start-monitoring')) {
      await analytics.startMonitoring();
      
      // Keep running until interrupted
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down monitoring...');
        analytics.stopMonitoring();
        process.exit(0);
      });
      
      // Keep the process alive
      setInterval(() => {}, 1000);
      
    } else if (args.includes('--report')) {
      const hours = parseInt(args[args.indexOf('--report') + 1]) || 24;
      const report = await analytics.generatePerformanceReport(hours);
      
      console.log('\n📋 PERFORMANCE SUMMARY');
      console.log('═'.repeat(30));
      console.log(`Time Window: ${report.timeWindow}`);
      console.log(`Data Points: ${report.dataPoints}`);
      console.log(`Cache Hit Rate: ${report.cloudFront?.cacheHitRate?.average?.toFixed(1) || 0}%`);
      console.log(`Total Requests: ${report.cloudFront?.requests?.total || 0}`);
      console.log(`Error Rate: ${report.cloudFront?.errorRate?.average?.toFixed(2) || 0}%`);
      
      if (args.includes('--verbose')) {
        console.log('\n📊 DETAILED METRICS');
        console.log(JSON.stringify(report, null, 2));
      }
      
    } else {
      console.log('❌ No action specified. Use --help for usage information.');
    }

  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('Usage: node performance-analytics.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --start-monitoring     Start real-time performance monitoring');
  console.log('  --report [hours]       Generate performance report (default: 24 hours)');
  console.log('  --verbose             Show detailed metrics');
  console.log('  --help, -h            Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node performance-analytics.js --start-monitoring');
  console.log('  node performance-analytics.js --report 48 --verbose');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceAnalytics;