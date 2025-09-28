/**
 * Performance Reporting System
 * Automated performance reports with charts and historical analysis
 */

const fs = require('fs').promises;
const path = require('path');
const ChartJSNodeCanvas = require('chartjs-node-canvas');

class PerformanceReporter {
  constructor(performanceMonitor, config = {}) {
    this.monitor = performanceMonitor;
    this.config = {
      output: {
        directory: config.output?.directory || 'logs/performance/reports',
        formats: config.output?.formats || ['html', 'json', 'pdf'],
        retention: config.output?.retention || 30 // days
      },
      charts: {
        width: config.charts?.width || 800,
        height: config.charts?.height || 400,
        backgroundColor: config.charts?.backgroundColor || '#ffffff',
        enabled: config.charts?.enabled !== false
      },
      reports: {
        schedule: config.reports?.schedule || 'daily', // daily, weekly, monthly
        recipients: config.reports?.recipients || [],
        includeCharts: config.reports?.includeCharts !== false,
        includeRecommendations: config.reports?.includeRecommendations !== false
      },
      thresholds: config.thresholds || {
        excellent: { color: '#28a745', threshold: 0.95 },
        good: { color: '#ffc107', threshold: 0.85 },
        poor: { color: '#dc3545', threshold: 0.0 }
      }
    };

    // Initialize chart renderer if charts are enabled
    if (this.config.charts.enabled) {
      this.chartRenderer = new ChartJSNodeCanvas({
        width: this.config.charts.width,
        height: this.config.charts.height,
        backgroundColor: this.config.charts.backgroundColor
      });
    }

    // Ensure output directory exists
    this.ensureOutputDirectory();
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(timeRangeHours = 24, reportType = 'standard') {
    console.log(`📊 Generating ${reportType} performance report (${timeRangeHours}h range)...`);

    try {
      // Collect data for the report
      const reportData = await this.collectReportData(timeRangeHours);
      
      // Generate report content
      const report = await this.buildReport(reportData, reportType);
      
      // Save report in requested formats
      const savedFiles = await this.saveReport(report, reportType);
      
      console.log(`✅ Performance report generated: ${savedFiles.join(', ')}`);
      
      return {
        success: true,
        reportData: reportData,
        savedFiles: savedFiles,
        summary: report.summary
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Collect data for performance report
   */
  async collectReportData(timeRangeHours) {
    const timeRangeMinutes = timeRangeHours * 60;
    const dashboardData = this.monitor.getDashboardData(timeRangeMinutes);
    
    // Calculate additional analytics
    const analytics = this.calculateAnalytics(dashboardData);
    
    // Get SLA compliance
    const slaCompliance = this.calculateSlaCompliance(dashboardData);
    
    // Get trend analysis
    const trends = this.analyzeTrends(dashboardData);
    
    // Get recommendations
    const recommendations = this.generateRecommendations(dashboardData, analytics);
    
    return {
      timeRange: {
        hours: timeRangeHours,
        startTime: new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000)).toISOString(),
        endTime: new Date().toISOString()
      },
      rawData: dashboardData,
      analytics: analytics,
      slaCompliance: slaCompliance,
      trends: trends,
      recommendations: recommendations,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate performance analytics
   */
  calculateAnalytics(dashboardData) {
    const metrics = dashboardData.metrics;
    
    return {
      upload_latency: this.calculateMetricAnalytics(metrics.upload_latency, 'p95'),
      cdn_response_time: this.calculateMetricAnalytics(metrics.cdn_response_time, 'p95'),
      cache_hit_ratio: this.calculateMetricAnalytics(metrics.cache_hit_ratio, 'ratio'),
      error_rate: this.calculateMetricAnalytics(metrics.error_rate, 'rate'),
      throughput: this.calculateMetricAnalytics(metrics.throughput, 'requests_per_second')
    };
  }

  /**
   * Calculate analytics for a specific metric
   */
  calculateMetricAnalytics(metricData, valueProperty) {
    if (!metricData || metricData.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        dataPoints: 0,
        trend: 'no-data'
      };
    }

    const values = metricData
      .map(entry => entry.value?.[valueProperty] || entry.value)
      .filter(val => val !== undefined && val >= 0);

    if (values.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        dataPoints: 0,
        trend: 'no-data'
      };
    }

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    
    // Calculate trend (comparing first half vs second half)
    const halfPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, halfPoint);
    const secondHalf = values.slice(halfPoint);
    
    let trend = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (percentChange > 10) {
        trend = 'increasing';
      } else if (percentChange < -10) {
        trend = 'decreasing';
      }
    }

    return {
      average: parseFloat(average.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      latest: parseFloat(latest.toFixed(2)),
      dataPoints: values.length,
      trend: trend
    };
  }

  /**
   * Calculate SLA compliance
   */
  calculateSlaCompliance(dashboardData) {
    const thresholds = dashboardData.thresholds;
    const analytics = this.calculateAnalytics(dashboardData);
    
    const compliance = {
      overall: 0,
      metrics: {}
    };

    // Upload latency compliance
    if (analytics.upload_latency.dataPoints > 0) {
      const target = thresholds.upload_latency_p95 || 2000;
      compliance.metrics.upload_latency = {
        target: target,
        actual: analytics.upload_latency.average,
        compliance: analytics.upload_latency.average <= target ? 100 : 
          Math.max(0, 100 - ((analytics.upload_latency.average - target) / target * 100)),
        status: analytics.upload_latency.average <= target ? 'pass' : 'fail'
      };
    }

    // CDN response time compliance
    if (analytics.cdn_response_time.dataPoints > 0) {
      const target = thresholds.cdn_response_time_p95 || 500;
      compliance.metrics.cdn_response_time = {
        target: target,
        actual: analytics.cdn_response_time.average,
        compliance: analytics.cdn_response_time.average <= target ? 100 : 
          Math.max(0, 100 - ((analytics.cdn_response_time.average - target) / target * 100)),
        status: analytics.cdn_response_time.average <= target ? 'pass' : 'fail'
      };
    }

    // Cache hit ratio compliance
    if (analytics.cache_hit_ratio.dataPoints > 0) {
      const target = thresholds.cache_hit_ratio_min || 0.85;
      compliance.metrics.cache_hit_ratio = {
        target: target * 100,
        actual: analytics.cache_hit_ratio.average * 100,
        compliance: analytics.cache_hit_ratio.average >= target ? 100 : 
          (analytics.cache_hit_ratio.average / target) * 100,
        status: analytics.cache_hit_ratio.average >= target ? 'pass' : 'fail'
      };
    }

    // Error rate compliance
    if (analytics.error_rate.dataPoints > 0) {
      const target = thresholds.error_rate_max || 0.02;
      compliance.metrics.error_rate = {
        target: target * 100,
        actual: analytics.error_rate.average * 100,
        compliance: analytics.error_rate.average <= target ? 100 : 
          Math.max(0, 100 - ((analytics.error_rate.average - target) / target * 100)),
        status: analytics.error_rate.average <= target ? 'pass' : 'fail'
      };
    }

    // Calculate overall compliance
    const metricCompliances = Object.values(compliance.metrics).map(m => m.compliance);
    compliance.overall = metricCompliances.length > 0 ? 
      metricCompliances.reduce((a, b) => a + b, 0) / metricCompliances.length : 0;

    return compliance;
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(dashboardData) {
    const analytics = this.calculateAnalytics(dashboardData);
    
    return {
      upload_latency: {
        trend: analytics.upload_latency.trend,
        direction: this.getTrendDirection(analytics.upload_latency),
        recommendation: this.getTrendRecommendation('upload_latency', analytics.upload_latency)
      },
      cdn_response_time: {
        trend: analytics.cdn_response_time.trend,
        direction: this.getTrendDirection(analytics.cdn_response_time),
        recommendation: this.getTrendRecommendation('cdn_response_time', analytics.cdn_response_time)
      },
      cache_hit_ratio: {
        trend: analytics.cache_hit_ratio.trend,
        direction: this.getTrendDirection(analytics.cache_hit_ratio),
        recommendation: this.getTrendRecommendation('cache_hit_ratio', analytics.cache_hit_ratio)
      },
      error_rate: {
        trend: analytics.error_rate.trend,
        direction: this.getTrendDirection(analytics.error_rate),
        recommendation: this.getTrendRecommendation('error_rate', analytics.error_rate)
      }
    };
  }

  /**
   * Get trend direction symbol
   */
  getTrendDirection(analytics) {
    switch (analytics.trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }

  /**
   * Get trend-based recommendation
   */
  getTrendRecommendation(metricName, analytics) {
    if (analytics.trend === 'no-data') {
      return 'Insufficient data for trend analysis';
    }

    const recommendations = {
      upload_latency: {
        increasing: 'Upload latency is increasing. Consider optimizing file processing or scaling infrastructure.',
        decreasing: 'Upload latency is improving. Current optimizations are working well.',
        stable: 'Upload latency is stable. Monitor for any changes.'
      },
      cdn_response_time: {
        increasing: 'CDN response times are increasing. Check cache hit ratios and origin server performance.',
        decreasing: 'CDN performance is improving. Good cache optimization results.',
        stable: 'CDN performance is stable. Continue monitoring cache metrics.'
      },
      cache_hit_ratio: {
        increasing: 'Cache hit ratio is improving. Good cache optimization strategy.',
        decreasing: 'Cache hit ratio is declining. Review caching policies and TTL settings.',
        stable: 'Cache hit ratio is stable. Monitor for content pattern changes.'
      },
      error_rate: {
        increasing: 'Error rate is increasing. Investigate recent changes and system health.',
        decreasing: 'Error rate is improving. Recent fixes are working well.',
        stable: 'Error rate is stable. Continue monitoring for anomalies.'
      }
    };

    return recommendations[metricName]?.[analytics.trend] || 'No specific recommendation available';
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(dashboardData, analytics) {
    const recommendations = [];
    const thresholds = dashboardData.thresholds;

    // Upload latency recommendations
    if (analytics.upload_latency.average > (thresholds.upload_latency_p95 || 2000)) {
      recommendations.push({
        category: 'Upload Performance',
        priority: 'high',
        issue: 'Upload latency exceeds target',
        current: `${analytics.upload_latency.average}ms`,
        target: `${thresholds.upload_latency_p95 || 2000}ms`,
        actions: [
          'Review file processing pipeline for bottlenecks',
          'Consider implementing parallel upload processing',
          'Optimize S3 multipart upload configuration',
          'Monitor database query performance during uploads'
        ]
      });
    }

    // CDN performance recommendations
    if (analytics.cdn_response_time.average > (thresholds.cdn_response_time_p95 || 500)) {
      recommendations.push({
        category: 'CDN Performance',
        priority: 'medium',
        issue: 'CDN response time exceeds target',
        current: `${analytics.cdn_response_time.average}ms`,
        target: `${thresholds.cdn_response_time_p95 || 500}ms`,
        actions: [
          'Review CloudFront cache settings and TTL values',
          'Optimize origin server response times',
          'Consider adding more edge locations',
          'Review cache headers and invalidation strategies'
        ]
      });
    }

    // Cache hit ratio recommendations
    if (analytics.cache_hit_ratio.average < (thresholds.cache_hit_ratio_min || 0.85)) {
      recommendations.push({
        category: 'Cache Optimization',
        priority: 'medium',
        issue: 'Cache hit ratio below target',
        current: `${(analytics.cache_hit_ratio.average * 100).toFixed(1)}%`,
        target: `${((thresholds.cache_hit_ratio_min || 0.85) * 100).toFixed(1)}%`,
        actions: [
          'Review and optimize cache TTL settings',
          'Analyze request patterns for cache-friendly optimizations',
          'Implement better cache warming strategies',
          'Review cache invalidation frequency and scope'
        ]
      });
    }

    // Error rate recommendations
    if (analytics.error_rate.average > (thresholds.error_rate_max || 0.02)) {
      recommendations.push({
        category: 'Reliability',
        priority: 'high',
        issue: 'Error rate exceeds acceptable threshold',
        current: `${(analytics.error_rate.average * 100).toFixed(2)}%`,
        target: `${((thresholds.error_rate_max || 0.02) * 100).toFixed(2)}%`,
        actions: [
          'Investigate recent error logs and patterns',
          'Review system health and resource utilization',
          'Implement better error handling and retry logic',
          'Monitor database and external service dependencies'
        ]
      });
    }

    // General performance recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Performance Optimization',
        priority: 'low',
        issue: 'All metrics within targets',
        current: 'Performance targets met',
        target: 'Continue monitoring',
        actions: [
          'Continue monitoring performance trends',
          'Review capacity planning for growth',
          'Consider proactive optimizations',
          'Update performance baselines based on current data'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Build complete performance report
   */
  async buildReport(reportData, reportType) {
    const report = {
      metadata: {
        title: `Performance Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
        generatedAt: reportData.generatedAt,
        timeRange: reportData.timeRange,
        reportType: reportType
      },
      summary: {
        overallHealth: this.calculateOverallHealth(reportData),
        slaCompliance: reportData.slaCompliance.overall,
        keyFindings: this.extractKeyFindings(reportData),
        alertsSummary: this.summarizeAlerts(reportData)
      },
      metrics: reportData.analytics,
      slaCompliance: reportData.slaCompliance,
      trends: reportData.trends,
      recommendations: reportData.recommendations,
      charts: this.config.charts.enabled ? await this.generateCharts(reportData) : null,
      rawData: reportType === 'detailed' ? reportData.rawData : null
    };

    return report;
  }

  /**
   * Calculate overall system health score
   */
  calculateOverallHealth(reportData) {
    const slaScore = reportData.slaCompliance.overall;
    const errorRate = reportData.analytics.error_rate.average * 100;
    const trendPenalty = this.calculateTrendPenalty(reportData.trends);
    
    let healthScore = slaScore - trendPenalty;
    
    // Additional penalties for high error rates
    if (errorRate > 2) {
      healthScore -= 10;
    } else if (errorRate > 1) {
      healthScore -= 5;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    let healthStatus = 'poor';
    if (healthScore >= 90) {
      healthStatus = 'excellent';
    } else if (healthScore >= 75) {
      healthStatus = 'good';
    } else if (healthScore >= 60) {
      healthStatus = 'fair';
    }
    
    return {
      score: Math.round(healthScore),
      status: healthStatus,
      color: this.getHealthColor(healthStatus)
    };
  }

  /**
   * Calculate trend penalty for health score
   */
  calculateTrendPenalty(trends) {
    let penalty = 0;
    
    Object.values(trends).forEach(trend => {
      if (trend.trend === 'increasing') {
        penalty += 5; // Penalty for degrading metrics
      }
    });
    
    return penalty;
  }

  /**
   * Get color for health status
   */
  getHealthColor(status) {
    const colors = {
      excellent: '#28a745',
      good: '#17a2b8',
      fair: '#ffc107',
      poor: '#dc3545'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Extract key findings from report data
   */
  extractKeyFindings(reportData) {
    const findings = [];
    const analytics = reportData.analytics;
    const compliance = reportData.slaCompliance;
    
    // SLA compliance findings
    const passedMetrics = Object.values(compliance.metrics).filter(m => m.status === 'pass').length;
    const totalMetrics = Object.keys(compliance.metrics).length;
    
    if (passedMetrics === totalMetrics) {
      findings.push({
        type: 'positive',
        message: `All ${totalMetrics} performance metrics meet SLA targets`
      });
    } else {
      findings.push({
        type: 'warning',
        message: `${totalMetrics - passedMetrics} of ${totalMetrics} metrics below SLA targets`
      });
    }
    
    // Performance trends
    const improvingTrends = Object.values(reportData.trends).filter(t => 
      (t.trend === 'decreasing' && ['upload_latency', 'cdn_response_time', 'error_rate'].includes(t)) ||
      (t.trend === 'increasing' && t === reportData.trends.cache_hit_ratio)
    ).length;
    
    if (improvingTrends > 0) {
      findings.push({
        type: 'positive',
        message: `${improvingTrends} performance metrics showing improvement trends`
      });
    }
    
    // High-priority recommendations
    const highPriorityRecs = reportData.recommendations.filter(r => r.priority === 'high').length;
    if (highPriorityRecs > 0) {
      findings.push({
        type: 'warning',
        message: `${highPriorityRecs} high-priority performance issues identified`
      });
    }
    
    return findings;
  }

  /**
   * Summarize alerts from report period
   */
  summarizeAlerts(reportData) {
    const recentAlerts = reportData.rawData.recentAlerts || [];
    
    const alertsByType = {};
    const alertsBySeverity = {};
    
    recentAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });
    
    return {
      total: recentAlerts.length,
      byType: alertsByType,
      bySeverity: alertsBySeverity,
      mostCommon: Object.entries(alertsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
    };
  }

  /**
   * Generate performance charts
   */
  async generateCharts(reportData) {
    if (!this.chartRenderer) {
      return null;
    }

    const charts = {};

    try {
      // Upload latency chart
      charts.upload_latency = await this.createTimeSeriesChart(
        reportData.rawData.metrics.upload_latency,
        'Upload Latency Over Time',
        'ms',
        '#007bff'
      );

      // CDN response time chart
      charts.cdn_response_time = await this.createTimeSeriesChart(
        reportData.rawData.metrics.cdn_response_time,
        'CDN Response Time Over Time',
        'ms',
        '#28a745'
      );

      // Cache hit ratio chart
      charts.cache_hit_ratio = await this.createTimeSeriesChart(
        reportData.rawData.metrics.cache_hit_ratio,
        'Cache Hit Ratio Over Time',
        '%',
        '#17a2b8'
      );

      // SLA compliance chart
      charts.sla_compliance = await this.createComplianceChart(reportData.slaCompliance);

    } catch (error) {
      console.error('Error generating charts:', error);
    }

    return charts;
  }

  /**
   * Create time series chart
   */
  async createTimeSeriesChart(data, title, unit, color) {
    if (!data || data.length === 0) {
      return null;
    }

    const labels = data.map(entry => new Date(entry.timestamp).toLocaleTimeString());
    const values = data.map(entry => entry.value?.p95 || entry.value?.average || entry.value?.ratio || entry.value);

    const configuration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: unit
            }
          }
        }
      }
    };

    return await this.chartRenderer.renderToBuffer(configuration);
  }

  /**
   * Create SLA compliance chart
   */
  async createComplianceChart(complianceData) {
    const metrics = Object.keys(complianceData.metrics);
    const compliance = metrics.map(metric => complianceData.metrics[metric].compliance);
    
    const configuration = {
      type: 'bar',
      data: {
        labels: metrics.map(m => m.replace('_', ' ').toUpperCase()),
        datasets: [{
          label: 'SLA Compliance %',
          data: compliance,
          backgroundColor: compliance.map(c => c >= 95 ? '#28a745' : c >= 85 ? '#ffc107' : '#dc3545')
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'SLA Compliance by Metric'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Compliance %'
            }
          }
        }
      }
    };

    return await this.chartRenderer.renderToBuffer(configuration);
  }

  /**
   * Save report in multiple formats
   */
  async saveReport(report, reportType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const baseFilename = `performance-report-${reportType}-${timestamp}`;
    const savedFiles = [];

    // JSON format
    if (this.config.output.formats.includes('json')) {
      const jsonPath = path.join(this.config.output.directory, `${baseFilename}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
      savedFiles.push(jsonPath);
    }

    // HTML format
    if (this.config.output.formats.includes('html')) {
      const htmlContent = this.generateHtmlReport(report);
      const htmlPath = path.join(this.config.output.directory, `${baseFilename}.html`);
      await fs.writeFile(htmlPath, htmlContent);
      savedFiles.push(htmlPath);
    }

    return savedFiles;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(report) {
    const summary = report.summary;
    const metrics = report.metrics;
    const compliance = report.slaCompliance;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.metadata.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #ddd; border-radius: 5px; padding: 15px; text-align: center; }
        .metric { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric-header { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; }
        .metric-value { font-size: 1.5em; font-weight: bold; }
        .status-excellent { color: #28a745; }
        .status-good { color: #17a2b8; }
        .status-fair { color: #ffc107; }
        .status-poor { color: #dc3545; }
        .recommendations { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: white; }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .trend-up { color: #dc3545; }
        .trend-down { color: #28a745; }
        .trend-stable { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.metadata.title}</h1>
        <p><strong>Generated:</strong> ${new Date(report.metadata.generatedAt).toLocaleString()}</p>
        <p><strong>Time Range:</strong> ${report.metadata.timeRange.hours} hours (${new Date(report.metadata.timeRange.startTime).toLocaleString()} - ${new Date(report.metadata.timeRange.endTime).toLocaleString()})</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Overall Health</h3>
            <div class="metric-value status-${summary.overallHealth.status}">${summary.overallHealth.score}/100</div>
            <div>${summary.overallHealth.status.charAt(0).toUpperCase() + summary.overallHealth.status.slice(1)}</div>
        </div>
        <div class="summary-card">
            <h3>SLA Compliance</h3>
            <div class="metric-value ${summary.slaCompliance >= 95 ? 'status-excellent' : summary.slaCompliance >= 85 ? 'status-good' : 'status-poor'}">${Math.round(summary.slaCompliance)}%</div>
            <div>${Object.values(compliance.metrics).filter(m => m.status === 'pass').length}/${Object.keys(compliance.metrics).length} metrics</div>
        </div>
        <div class="summary-card">
            <h3>Recent Alerts</h3>
            <div class="metric-value ${summary.alertsSummary.total === 0 ? 'status-excellent' : summary.alertsSummary.total < 5 ? 'status-good' : 'status-poor'}">${summary.alertsSummary.total}</div>
            <div>Total alerts</div>
        </div>
    </div>

    <h2>Performance Metrics</h2>
    
    <div class="metric">
        <div class="metric-header">Upload Latency</div>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Trend</th></tr>
            <tr><td>Average</td><td>${metrics.upload_latency.average}ms</td><td class="trend-${report.trends.upload_latency.trend === 'increasing' ? 'up' : report.trends.upload_latency.trend === 'decreasing' ? 'down' : 'stable'}">${report.trends.upload_latency.direction}</td></tr>
            <tr><td>Min / Max</td><td>${metrics.upload_latency.min}ms / ${metrics.upload_latency.max}ms</td><td></td></tr>
            <tr><td>Data Points</td><td>${metrics.upload_latency.dataPoints}</td><td></td></tr>
        </table>
    </div>

    <div class="metric">
        <div class="metric-header">CDN Response Time</div>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Trend</th></tr>
            <tr><td>Average</td><td>${metrics.cdn_response_time.average}ms</td><td class="trend-${report.trends.cdn_response_time.trend === 'increasing' ? 'up' : report.trends.cdn_response_time.trend === 'decreasing' ? 'down' : 'stable'}">${report.trends.cdn_response_time.direction}</td></tr>
            <tr><td>Min / Max</td><td>${metrics.cdn_response_time.min}ms / ${metrics.cdn_response_time.max}ms</td><td></td></tr>
            <tr><td>Data Points</td><td>${metrics.cdn_response_time.dataPoints}</td><td></td></tr>
        </table>
    </div>

    <div class="metric">
        <div class="metric-header">Cache Hit Ratio</div>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Trend</th></tr>
            <tr><td>Average</td><td>${(metrics.cache_hit_ratio.average * 100).toFixed(1)}%</td><td class="trend-${report.trends.cache_hit_ratio.trend === 'increasing' ? 'down' : report.trends.cache_hit_ratio.trend === 'decreasing' ? 'up' : 'stable'}">${report.trends.cache_hit_ratio.direction}</td></tr>
            <tr><td>Min / Max</td><td>${(metrics.cache_hit_ratio.min * 100).toFixed(1)}% / ${(metrics.cache_hit_ratio.max * 100).toFixed(1)}%</td><td></td></tr>
            <tr><td>Data Points</td><td>${metrics.cache_hit_ratio.dataPoints}</td><td></td></tr>
        </table>
    </div>

    <h2>SLA Compliance</h2>
    <table>
        <tr><th>Metric</th><th>Target</th><th>Actual</th><th>Compliance</th><th>Status</th></tr>
        ${Object.entries(compliance.metrics).map(([metric, data]) => `
        <tr>
            <td>${metric.replace('_', ' ').toUpperCase()}</td>
            <td>${data.target}${metric.includes('ratio') || metric.includes('rate') ? '%' : 'ms'}</td>
            <td>${data.actual.toFixed(2)}${metric.includes('ratio') || metric.includes('rate') ? '%' : 'ms'}</td>
            <td>${Math.round(data.compliance)}%</td>
            <td class="${data.status === 'pass' ? 'status-excellent' : 'status-poor'}">${data.status.toUpperCase()}</td>
        </tr>
        `).join('')}
    </table>

    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
        <div class="recommendation ${rec.priority}">
            <h4>${rec.category} - ${rec.priority.toUpperCase()} Priority</h4>
            <p><strong>Issue:</strong> ${rec.issue}</p>
            <p><strong>Current:</strong> ${rec.current} | <strong>Target:</strong> ${rec.target}</p>
            <ul>
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
            </ul>
        </div>
        `).join('')}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
        <p>This report was automatically generated by the Performance Monitoring System.</p>
        <p>For questions or issues, please contact the development team.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.config.output.directory, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  /**
   * Schedule automatic report generation
   */
  scheduleReports() {
    const scheduleIntervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    const interval = scheduleIntervals[this.config.reports.schedule];
    if (interval) {
      setInterval(async () => {
        try {
          await this.generateReport(24, 'scheduled');
        } catch (error) {
          console.error('Scheduled report generation failed:', error);
        }
      }, interval);

      console.log(`📅 Performance reports scheduled ${this.config.reports.schedule}`);
    }
  }

  /**
   * Clean up old reports
   */
  async cleanupOldReports() {
    try {
      const files = await fs.readdir(this.config.output.directory);
      const cutoffDate = new Date(Date.now() - (this.config.output.retention * 24 * 60 * 60 * 1000));

      for (const file of files) {
        const filePath = path.join(this.config.output.directory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted old report: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
    }
  }
}

module.exports = PerformanceReporter;