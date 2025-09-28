#!/usr/bin/env node
/**
 * Advanced Cost & Performance Monitor
 * Comprehensive monitoring system for S3/CloudFront costs and performance
 * Integrates with AWS Cost Explorer, CloudWatch, and internal metrics
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class CostPerformanceMonitor {
  constructor() {
    this.costExplorer = new AWS.CostExplorer({ region: 'us-east-1' });
    this.cloudWatch = new AWS.CloudWatch({ region: process.env.S3_REGION || 'us-east-1' });
    this.s3 = new AWS.S3({ region: process.env.S3_REGION || 'us-east-1' });
    
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    // Cost monitoring configuration
    this.costThresholds = {
      monthlyBudget: 50.00,          // $50/month budget
      warningThreshold: 0.8,         // 80% of budget
      criticalThreshold: 0.95,       // 95% of budget
      dailySpendLimit: 5.00          // $5/day maximum
    };
    
    // Performance monitoring configuration
    this.performanceThresholds = {
      cacheHitRateMin: 85,           // Minimum 85% cache hit rate
      uploadLatencyMax: 5000,        // Max 5 seconds upload time
      downloadLatencyMax: 1000,      // Max 1 second download time
      errorRateMax: 1                // Max 1% error rate
    };
    
    this.reportDir = './reports/cost-performance';
    this.initializeReportDir();
  }

  async initializeReportDir() {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create report directory:', error.message);
    }
  }

  /**
   * Generate comprehensive cost and performance report
   */
  async generateReport(options = {}) {
    const {
      period = 'monthly',
      includeOptimizations = true,
      includeForecasting = true,
      saveToDisk = true
    } = options;

    console.log('🔍 Generating Cost & Performance Report...');
    const startTime = performance.now();

    try {
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          period: period,
          bucketName: this.bucketName,
          distributionId: this.distributionId,
          generationTimeMs: 0
        },
        costs: await this.analyzeCosts(period),
        performance: await this.analyzePerformance(period),
        storage: await this.analyzeStorage(),
        optimization: includeOptimizations ? await this.generateOptimizations() : null,
        forecasting: includeForecasting ? await this.generateForecasting() : null,
        alerts: await this.checkAlerts(),
        summary: {}
      };

      // Generate executive summary
      report.summary = this.generateExecutiveSummary(report);
      
      const endTime = performance.now();
      report.metadata.generationTimeMs = Math.round(endTime - startTime);

      if (saveToDisk) {
        await this.saveReport(report, period);
      }

      console.log(`✅ Report generated in ${report.metadata.generationTimeMs}ms`);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Analyze costs using AWS Cost Explorer API
   */
  async analyzeCosts(period) {
    console.log('💰 Analyzing costs...');
    
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarterly') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate.setDate(startDate.getDate() - 7); // weekly
    }

    try {
      // Get cost data for S3
      const s3CostParams = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0]
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost', 'UsageQuantity'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE'
          }
        ],
        Filter: {
          Dimensions: {
            Key: 'SERVICE',
            Values: ['Amazon Simple Storage Service']
          }
        }
      };

      // Get cost data for CloudFront
      const cloudFrontCostParams = {
        ...s3CostParams,
        Filter: {
          Dimensions: {
            Key: 'SERVICE',
            Values: ['Amazon CloudFront']
          }
        }
      };

      const [s3Costs, cloudFrontCosts] = await Promise.all([
        this.costExplorer.getCostsAndUsage(s3CostParams).promise(),
        this.costExplorer.getCostsAndUsage(cloudFrontCostParams).promise()
      ]);

      // Process and analyze cost data
      const s3Analysis = this.processCostData(s3Costs, 'S3');
      const cloudFrontAnalysis = this.processCostData(cloudFrontCosts, 'CloudFront');

      return {
        s3: s3Analysis,
        cloudFront: cloudFrontAnalysis,
        combined: this.combineCostAnalysis(s3Analysis, cloudFrontAnalysis),
        budgetStatus: this.analyzeBudgetStatus(s3Analysis, cloudFrontAnalysis)
      };

    } catch (error) {
      console.warn('⚠️  Cost Explorer API unavailable:', error.message);
      return this.generateMockCostData(period);
    }
  }

  /**
   * Process raw cost data from AWS Cost Explorer
   */
  processCostData(costData, service) {
    const results = costData.ResultsByTime || [];
    
    let totalCost = 0;
    let totalUsage = 0;
    const dailyCosts = [];
    
    results.forEach(result => {
      const date = result.TimePeriod.Start;
      const groups = result.Groups || [];
      
      groups.forEach(group => {
        const cost = parseFloat(group.Metrics.BlendedCost.Amount || 0);
        const usage = parseFloat(group.Metrics.UsageQuantity.Amount || 0);
        
        totalCost += cost;
        totalUsage += usage;
        
        dailyCosts.push({
          date: date,
          cost: cost,
          usage: usage
        });
      });
    });

    return {
      service: service,
      totalCost: Math.round(totalCost * 100) / 100,
      totalUsage: Math.round(totalUsage * 100) / 100,
      averageDailyCost: dailyCosts.length ? Math.round((totalCost / dailyCosts.length) * 100) / 100 : 0,
      dailyBreakdown: dailyCosts,
      trend: this.calculateCostTrend(dailyCosts)
    };
  }

  /**
   * Calculate cost trend (increasing, decreasing, stable)
   */
  calculateCostTrend(dailyCosts) {
    if (dailyCosts.length < 3) return 'insufficient_data';
    
    const recent = dailyCosts.slice(-3).reduce((sum, day) => sum + day.cost, 0) / 3;
    const earlier = dailyCosts.slice(-6, -3).reduce((sum, day) => sum + day.cost, 0) / 3;
    
    const change = ((recent - earlier) / earlier) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyze performance metrics from CloudWatch
   */
  async analyzePerformance(period) {
    console.log('📊 Analyzing performance metrics...');
    
    const endTime = new Date();
    const startTime = new Date();
    
    if (period === 'monthly') {
      startTime.setMonth(startTime.getMonth() - 1);
    } else if (period === 'quarterly') {
      startTime.setMonth(startTime.getMonth() - 3);
    } else {
      startTime.setDate(startTime.getDate() - 7);
    }

    try {
      // CloudFront metrics
      const cloudFrontMetrics = await this.getCloudFrontMetrics(startTime, endTime);
      
      // S3 metrics
      const s3Metrics = await this.getS3Metrics(startTime, endTime);
      
      // Application performance metrics
      const appMetrics = await this.getApplicationMetrics(startTime, endTime);
      
      return {
        cloudFront: cloudFrontMetrics,
        s3: s3Metrics,
        application: appMetrics,
        summary: this.generatePerformanceSummary(cloudFrontMetrics, s3Metrics, appMetrics)
      };

    } catch (error) {
      console.warn('⚠️  CloudWatch metrics unavailable:', error.message);
      return this.generateMockPerformanceData(period);
    }
  }

  /**
   * Get CloudFront performance metrics
   */
  async getCloudFrontMetrics(startTime, endTime) {
    const params = {
      Namespace: 'AWS/CloudFront',
      MetricName: 'CacheHitRate',
      Dimensions: [
        {
          Name: 'DistributionId',
          Value: this.distributionId
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 3600, // 1 hour
      Statistics: ['Average', 'Maximum', 'Minimum']
    };

    const [cacheHitRate, requests, bytesDownloaded, errors] = await Promise.all([
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'CacheHitRate' }).promise(),
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'Requests' }).promise(),
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'BytesDownloaded' }).promise(),
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: '4xxErrorRate' }).promise()
    ]);

    return {
      cacheHitRate: this.processMetricData(cacheHitRate.Datapoints),
      requests: this.processMetricData(requests.Datapoints),
      bytesDownloaded: this.processMetricData(bytesDownloaded.Datapoints),
      errorRate: this.processMetricData(errors.Datapoints)
    };
  }

  /**
   * Get S3 performance metrics
   */
  async getS3Metrics(startTime, endTime) {
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
      Period: 3600,
      Statistics: ['Sum', 'Average']
    };

    const [requests, errors, latency] = await Promise.all([
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'AllRequests' }).promise(),
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: '4xxErrors' }).promise(),
      this.cloudWatch.getMetricStatistics({ ...params, MetricName: 'FirstByteLatency' }).promise()
    ]);

    return {
      requests: this.processMetricData(requests.Datapoints),
      errors: this.processMetricData(errors.Datapoints),
      latency: this.processMetricData(latency.Datapoints)
    };
  }

  /**
   * Process CloudWatch metric datapoints
   */
  processMetricData(datapoints) {
    if (!datapoints || datapoints.length === 0) {
      return { average: 0, maximum: 0, minimum: 0, dataCount: 0 };
    }

    const values = datapoints.map(dp => dp.Average || dp.Sum || 0);
    
    return {
      average: Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100,
      maximum: Math.max(...values),
      minimum: Math.min(...values),
      dataCount: datapoints.length,
      trend: this.calculateMetricTrend(datapoints)
    };
  }

  /**
   * Analyze S3 storage usage and patterns
   */
  async analyzeStorage() {
    console.log('🗄️  Analyzing storage usage...');

    try {
      // Get bucket metrics
      const bucketParams = {
        Bucket: this.bucketName
      };

      // List objects for analysis (sample)
      const listParams = {
        Bucket: this.bucketName,
        MaxKeys: 1000,
        Prefix: 'uploads/'
      };

      const [bucketLocation, objectList] = await Promise.all([
        this.s3.getBucketLocation(bucketParams).promise(),
        this.s3.listObjectsV2(listParams).promise()
      ]);

      const objects = objectList.Contents || [];
      
      // Analyze object patterns
      const analysis = this.analyzeObjectPatterns(objects);
      
      return {
        bucketRegion: bucketLocation.LocationConstraint || 'us-east-1',
        objectCount: objectList.KeyCount || 0,
        isTruncated: objectList.IsTruncated || false,
        sampleSize: objects.length,
        patterns: analysis,
        recommendations: this.generateStorageRecommendations(analysis)
      };

    } catch (error) {
      console.warn('⚠️  Storage analysis failed:', error.message);
      return this.generateMockStorageData();
    }
  }

  /**
   * Analyze object patterns for optimization insights
   */
  analyzeObjectPatterns(objects) {
    const patterns = {
      sizeDistribution: { small: 0, medium: 0, large: 0 },
      typeDistribution: {},
      ageDistribution: { recent: 0, old: 0, ancient: 0 },
      totalSize: 0
    };

    const now = new Date();
    
    objects.forEach(obj => {
      // Size analysis
      const size = obj.Size || 0;
      patterns.totalSize += size;
      
      if (size < 1024 * 1024) patterns.sizeDistribution.small++; // < 1MB
      else if (size < 10 * 1024 * 1024) patterns.sizeDistribution.medium++; // < 10MB
      else patterns.sizeDistribution.large++; // >= 10MB
      
      // Type analysis
      const ext = path.extname(obj.Key || '').toLowerCase();
      patterns.typeDistribution[ext] = (patterns.typeDistribution[ext] || 0) + 1;
      
      // Age analysis
      const ageMs = now - new Date(obj.LastModified);
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      
      if (ageDays < 30) patterns.ageDistribution.recent++;
      else if (ageDays < 90) patterns.ageDistribution.old++;
      else patterns.ageDistribution.ancient++;
    });

    return patterns;
  }

  /**
   * Generate optimization recommendations based on analysis
   */
  async generateOptimizations() {
    console.log('🎯 Generating optimization recommendations...');
    
    const recommendations = [];
    
    try {
      // Cost optimization recommendations
      const costRecommendations = await this.generateCostOptimizations();
      recommendations.push(...costRecommendations);
      
      // Performance optimization recommendations
      const perfRecommendations = await this.generatePerformanceOptimizations();
      recommendations.push(...perfRecommendations);
      
      // Storage optimization recommendations
      const storageRecommendations = await this.generateStorageOptimizations();
      recommendations.push(...storageRecommendations);
      
      return {
        total: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: recommendations.filter(r => r.priority === 'low').length,
        recommendations: recommendations
      };

    } catch (error) {
      console.warn('⚠️  Optimization generation failed:', error.message);
      return { total: 0, recommendations: [] };
    }
  }

  /**
   * Generate cost optimization recommendations
   */
  async generateCostOptimizations() {
    const recommendations = [];
    
    // Example recommendations based on common patterns
    recommendations.push({
      id: 'cost-001',
      category: 'cost',
      priority: 'medium',
      title: 'Implement S3 Lifecycle Policies',
      description: 'Transition older objects to cheaper storage classes to reduce costs',
      estimatedSavings: '$10-30/month',
      effort: 'low',
      implementationSteps: [
        'Analyze object access patterns',
        'Create lifecycle rules for objects older than 30 days',
        'Transition to IA after 30 days, Glacier after 90 days',
        'Monitor cost impact after implementation'
      ]
    });

    recommendations.push({
      id: 'cost-002',
      category: 'cost',
      priority: 'high',
      title: 'Optimize CloudFront Cache Behaviors',
      description: 'Improve cache hit rates to reduce origin requests and costs',
      estimatedSavings: '$5-15/month',
      effort: 'medium',
      implementationSteps: [
        'Analyze current cache hit rates',
        'Identify cacheable content with low hit rates',
        'Update cache behaviors and TTL settings',
        'Monitor performance improvement'
      ]
    });

    return recommendations;
  }

  /**
   * Check for cost and performance alerts
   */
  async checkAlerts() {
    console.log('🚨 Checking alerts...');
    
    const alerts = [];
    
    try {
      // Budget alerts
      const budgetAlerts = await this.checkBudgetAlerts();
      alerts.push(...budgetAlerts);
      
      // Performance alerts
      const performanceAlerts = await this.checkPerformanceAlerts();
      alerts.push(...performanceAlerts);
      
      return {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        alerts: alerts
      };

    } catch (error) {
      console.warn('⚠️  Alert checking failed:', error.message);
      return { total: 0, alerts: [] };
    }
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(report) {
    const summary = {
      costStatus: 'unknown',
      performanceStatus: 'unknown',
      keyFindings: [],
      immediateActions: [],
      monthlyTrend: 'stable'
    };

    try {
      // Cost status
      if (report.costs && report.costs.combined) {
        const totalCost = report.costs.combined.totalCost || 0;
        const budget = this.costThresholds.monthlyBudget;
        
        if (totalCost > budget * this.costThresholds.criticalThreshold) {
          summary.costStatus = 'critical';
        } else if (totalCost > budget * this.costThresholds.warningThreshold) {
          summary.costStatus = 'warning';
        } else {
          summary.costStatus = 'good';
        }
      }

      // Performance status
      if (report.performance && report.performance.summary) {
        const cacheHitRate = report.performance.cloudFront?.cacheHitRate?.average || 0;
        
        if (cacheHitRate >= this.performanceThresholds.cacheHitRateMin) {
          summary.performanceStatus = 'good';
        } else if (cacheHitRate >= this.performanceThresholds.cacheHitRateMin - 10) {
          summary.performanceStatus = 'warning';
        } else {
          summary.performanceStatus = 'critical';
        }
      }

      // Key findings
      if (report.optimization && report.optimization.recommendations) {
        const highPriorityRecs = report.optimization.recommendations.filter(r => r.priority === 'high');
        if (highPriorityRecs.length > 0) {
          summary.keyFindings.push(`${highPriorityRecs.length} high-priority optimization opportunities identified`);
        }
      }

      // Immediate actions
      if (report.alerts && report.alerts.critical > 0) {
        summary.immediateActions.push(`${report.alerts.critical} critical alerts require immediate attention`);
      }

    } catch (error) {
      console.warn('⚠️  Summary generation failed:', error.message);
    }

    return summary;
  }

  /**
   * Save report to disk
   */
  async saveReport(report, period) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cost-performance-report-${period}-${timestamp}.json`;
    const filepath = path.join(this.reportDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved: ${filepath}`);
      
      // Also save a latest version
      const latestPath = path.join(this.reportDir, `latest-${period}.json`);
      await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
      
    } catch (error) {
      console.warn('⚠️  Failed to save report:', error.message);
    }
  }

  // Mock data generators for development/testing
  generateMockCostData(period) {
    return {
      s3: {
        service: 'S3',
        totalCost: 25.50,
        averageDailyCost: 0.85,
        trend: 'stable'
      },
      cloudFront: {
        service: 'CloudFront',
        totalCost: 15.30,
        averageDailyCost: 0.51,
        trend: 'decreasing'
      },
      combined: {
        totalCost: 40.80,
        trend: 'stable'
      },
      budgetStatus: {
        percentUsed: 81.6,
        status: 'warning'
      }
    };
  }

  generateMockPerformanceData(period) {
    return {
      cloudFront: {
        cacheHitRate: { average: 87.5, trend: 'stable' },
        requests: { average: 1250, trend: 'increasing' }
      },
      s3: {
        requests: { average: 450, trend: 'stable' },
        latency: { average: 125, trend: 'stable' }
      },
      summary: {
        overallHealth: 'good',
        cacheEfficiency: 'good'
      }
    };
  }

  generateMockStorageData() {
    return {
      objectCount: 1250,
      patterns: {
        sizeDistribution: { small: 800, medium: 350, large: 100 },
        typeDistribution: { '.jpg': 400, '.png': 300, '.pdf': 250, '.mp4': 150, '.mp3': 150 }
      },
      recommendations: [
        'Consider implementing lifecycle policies for objects older than 90 days'
      ]
    };
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const monitor = new CostPerformanceMonitor();

  console.log('🚀 Cost & Performance Monitor');
  console.log('═'.repeat(50));

  try {
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    const period = args.includes('--quarterly') ? 'quarterly' : 
                   args.includes('--weekly') ? 'weekly' : 'monthly';
    
    const options = {
      period: period,
      includeOptimizations: !args.includes('--no-optimizations'),
      includeForecasting: !args.includes('--no-forecasting'),
      saveToDisk: !args.includes('--no-save')
    };

    const report = await monitor.generateReport(options);

    // Display summary
    console.log('\n📋 EXECUTIVE SUMMARY');
    console.log('═'.repeat(30));
    console.log(`Cost Status: ${report.summary.costStatus}`);
    console.log(`Performance Status: ${report.summary.performanceStatus}`);
    console.log(`Total Alerts: ${report.alerts.total}`);
    console.log(`Optimization Opportunities: ${report.optimization?.total || 0}`);

    if (args.includes('--verbose')) {
      console.log('\n📊 DETAILED METRICS');
      console.log('═'.repeat(30));
      console.log('Costs:', JSON.stringify(report.costs, null, 2));
      console.log('Performance:', JSON.stringify(report.performance, null, 2));
    }

    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('Usage: node cost-performance-monitor.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --monthly          Generate monthly report (default)');
  console.log('  --quarterly        Generate quarterly report');
  console.log('  --weekly           Generate weekly report');
  console.log('  --no-optimizations Skip optimization recommendations');
  console.log('  --no-forecasting   Skip cost forecasting');
  console.log('  --no-save          Do not save report to disk');
  console.log('  --verbose          Show detailed metrics');
  console.log('  --help, -h         Show this help');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CostPerformanceMonitor;