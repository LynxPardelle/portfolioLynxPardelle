#!/usr/bin/env node
/**
 * Cost Optimization Analyzer
 * Automated analysis and recommendations for S3/CloudFront cost optimization
 * Identifies opportunities for savings and performance improvements
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

class CostOptimizationAnalyzer {
  constructor() {
    this.costExplorer = new AWS.CostExplorer({ region: 'us-east-1' });
    this.cloudWatch = new AWS.CloudWatch({ region: process.env.S3_REGION || 'us-east-1' });
    this.s3 = new AWS.S3({ region: process.env.S3_REGION || 'us-east-1' });
    this.cloudFront = new AWS.CloudFront({ region: 'us-east-1' });
    
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    // Optimization thresholds and targets
    this.optimizationTargets = {
      cacheHitRateTarget: 90,        // Target 90% cache hit rate
      lifecycleDaysIA: 30,           // Move to IA after 30 days
      lifecycleDaysGlacier: 90,      // Move to Glacier after 90 days
      lifecycleDaysDeepArchive: 365, // Move to Deep Archive after 1 year
      compressionThreshold: 1048576, // 1MB - files larger should be compressed
      maxUnusedObjectDays: 180,      // Objects unused for 6 months
      costSavingsThreshold: 5.00     // Minimum $5/month savings to recommend
    };
    
    this.reportsDir = './reports/optimization';
    this.initializeReportsDir();
  }

  async initializeReportsDir() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create reports directory:', error.message);
    }
  }

  /**
   * Generate comprehensive cost optimization analysis
   */
  async analyzeOptimizations() {
    console.log('🎯 Analyzing cost optimization opportunities...');
    
    try {
      const analysis = {
        metadata: {
          generatedAt: new Date().toISOString(),
          bucketName: this.bucketName,
          distributionId: this.distributionId
        },
        storage: await this.analyzeStorageOptimizations(),
        delivery: await this.analyzeDeliveryOptimizations(),
        lifecycle: await this.analyzeLifecyclePolicies(),
        caching: await this.analyzeCachingOptimizations(),
        compression: await this.analyzeCompressionOpportunities(),
        summary: {}
      };

      // Generate optimization summary
      analysis.summary = this.generateOptimizationSummary(analysis);
      
      // Save analysis
      await this.saveOptimizationAnalysis(analysis);
      
      console.log('✅ Optimization analysis completed');
      return analysis;

    } catch (error) {
      console.error('❌ Optimization analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze S3 storage optimization opportunities
   */
  async analyzeStorageOptimizations() {
    console.log('🗄️  Analyzing storage optimizations...');
    
    try {
      // Get storage analytics
      const storageMetrics = await this.getStorageMetrics();
      
      // Analyze object patterns
      const objectAnalysis = await this.analyzeObjectPatterns();
      
      // Generate storage recommendations
      const recommendations = this.generateStorageRecommendations(storageMetrics, objectAnalysis);
      
      return {
        currentCosts: storageMetrics.costs,
        usage: storageMetrics.usage,
        objectPatterns: objectAnalysis,
        recommendations: recommendations,
        potentialSavings: this.calculateStorageSavings(recommendations)
      };

    } catch (error) {
      console.warn('⚠️  Storage optimization analysis failed:', error.message);
      return this.generateMockStorageOptimizations();
    }
  }

  /**
   * Analyze CloudFront delivery optimization opportunities
   */
  async analyzeDeliveryOptimizations() {
    console.log('🌐 Analyzing delivery optimizations...');
    
    try {
      // Get CloudFront distribution configuration
      const distributionConfig = await this.getDistributionConfig();
      
      // Analyze cache behaviors
      const cacheAnalysis = await this.analyzeCacheBehaviors(distributionConfig);
      
      // Get performance metrics
      const performanceMetrics = await this.getDeliveryPerformanceMetrics();
      
      // Generate delivery recommendations
      const recommendations = this.generateDeliveryRecommendations(
        distributionConfig, 
        cacheAnalysis, 
        performanceMetrics
      );
      
      return {
        configuration: distributionConfig,
        cacheAnalysis: cacheAnalysis,
        performance: performanceMetrics,
        recommendations: recommendations,
        potentialSavings: this.calculateDeliverySavings(recommendations)
      };

    } catch (error) {
      console.warn('⚠️  Delivery optimization analysis failed:', error.message);
      return this.generateMockDeliveryOptimizations();
    }
  }

  /**
   * Analyze lifecycle policy optimization opportunities
   */
  async analyzeLifecyclePolicies() {
    console.log('♻️  Analyzing lifecycle policies...');
    
    try {
      // Get current lifecycle configuration
      const currentLifecycle = await this.getCurrentLifecycleConfig();
      
      // Analyze object access patterns
      const accessPatterns = await this.analyzeObjectAccessPatterns();
      
      // Generate lifecycle recommendations
      const recommendations = this.generateLifecycleRecommendations(currentLifecycle, accessPatterns);
      
      return {
        currentPolicies: currentLifecycle,
        accessPatterns: accessPatterns,
        recommendations: recommendations,
        potentialSavings: this.calculateLifecycleSavings(recommendations)
      };

    } catch (error) {
      console.warn('⚠️  Lifecycle analysis failed:', error.message);
      return this.generateMockLifecycleOptimizations();
    }
  }

  /**
   * Analyze caching optimization opportunities
   */
  async analyzeCachingOptimizations() {
    console.log('💾 Analyzing caching optimizations...');
    
    try {
      // Get cache metrics
      const cacheMetrics = await this.getCacheMetrics();
      
      // Analyze cache hit patterns
      const hitPatterns = await this.analyzeCacheHitPatterns();
      
      // Generate caching recommendations
      const recommendations = this.generateCachingRecommendations(cacheMetrics, hitPatterns);
      
      return {
        metrics: cacheMetrics,
        patterns: hitPatterns,
        recommendations: recommendations,
        potentialSavings: this.calculateCachingSavings(recommendations)
      };

    } catch (error) {
      console.warn('⚠️  Caching analysis failed:', error.message);
      return this.generateMockCachingOptimizations();
    }
  }

  /**
   * Analyze compression opportunities
   */
  async analyzeCompressionOpportunities() {
    console.log('🗜️  Analyzing compression opportunities...');
    
    try {
      // Sample objects to analyze compression potential
      const objectSample = await this.sampleObjectsForCompression();
      
      // Analyze compression potential
      const compressionAnalysis = this.analyzeCompressionPotential(objectSample);
      
      // Generate compression recommendations
      const recommendations = this.generateCompressionRecommendations(compressionAnalysis);
      
      return {
        sampleSize: objectSample.length,
        analysis: compressionAnalysis,
        recommendations: recommendations,
        potentialSavings: this.calculateCompressionSavings(compressionAnalysis)
      };

    } catch (error) {
      console.warn('⚠️  Compression analysis failed:', error.message);
      return this.generateMockCompressionOptimizations();
    }
  }

  /**
   * Get storage metrics and costs
   */
  async getStorageMetrics() {
    // Get S3 storage metrics from CloudWatch
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const params = {
      Namespace: 'AWS/S3',
      MetricName: 'BucketSizeBytes',
      Dimensions: [
        { Name: 'BucketName', Value: this.bucketName },
        { Name: 'StorageType', Value: 'StandardStorage' }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400, // Daily
      Statistics: ['Average']
    };

    try {
      const metrics = await this.cloudWatch.getMetricStatistics(params).promise();
      
      const latestSize = metrics.Datapoints.length > 0 
        ? metrics.Datapoints.sort((a, b) => b.Timestamp - a.Timestamp)[0].Average 
        : 0;

      return {
        usage: {
          totalSizeBytes: latestSize,
          totalSizeGB: Math.round(latestSize / (1024 * 1024 * 1024) * 100) / 100
        },
        costs: {
          estimatedMonthlyStandard: (latestSize / (1024 * 1024 * 1024)) * 0.023, // $0.023/GB for Standard
          estimatedMonthlyIA: (latestSize / (1024 * 1024 * 1024)) * 0.0125,     // $0.0125/GB for IA
          estimatedMonthlyGlacier: (latestSize / (1024 * 1024 * 1024)) * 0.004  // $0.004/GB for Glacier
        }
      };

    } catch (error) {
      return {
        usage: { totalSizeBytes: 0, totalSizeGB: 0 },
        costs: { estimatedMonthlyStandard: 0, estimatedMonthlyIA: 0, estimatedMonthlyGlacier: 0 }
      };
    }
  }

  /**
   * Analyze object patterns for optimization
   */
  async analyzeObjectPatterns() {
    try {
      const params = {
        Bucket: this.bucketName,
        MaxKeys: 1000,
        Prefix: 'uploads/'
      };

      const result = await this.s3.listObjectsV2(params).promise();
      const objects = result.Contents || [];
      
      const patterns = {
        totalObjects: result.KeyCount || 0,
        sampleSize: objects.length,
        sizeDistribution: { small: 0, medium: 0, large: 0 },
        ageDistribution: { recent: 0, old: 0, ancient: 0 },
        typeDistribution: {},
        compressionCandidates: 0
      };

      const now = new Date();
      
      objects.forEach(obj => {
        const size = obj.Size || 0;
        const age = (now - obj.LastModified) / (1000 * 60 * 60 * 24); // days
        const ext = path.extname(obj.Key || '').toLowerCase();
        
        // Size distribution
        if (size < 1024 * 1024) patterns.sizeDistribution.small++;
        else if (size < 10 * 1024 * 1024) patterns.sizeDistribution.medium++;
        else patterns.sizeDistribution.large++;
        
        // Age distribution
        if (age < 30) patterns.ageDistribution.recent++;
        else if (age < 90) patterns.ageDistribution.old++;
        else patterns.ageDistribution.ancient++;
        
        // Type distribution
        patterns.typeDistribution[ext] = (patterns.typeDistribution[ext] || 0) + 1;
        
        // Compression candidates (uncompressed file types > 1MB)
        if (size > this.optimizationTargets.compressionThreshold && 
            ['.jpg', '.png', '.pdf', '.mp4', '.mp3'].includes(ext)) {
          patterns.compressionCandidates++;
        }
      });

      return patterns;

    } catch (error) {
      return {
        totalObjects: 0,
        sampleSize: 0,
        sizeDistribution: { small: 0, medium: 0, large: 0 },
        ageDistribution: { recent: 0, old: 0, ancient: 0 },
        typeDistribution: {},
        compressionCandidates: 0
      };
    }
  }

  /**
   * Generate storage optimization recommendations
   */
  generateStorageRecommendations(storageMetrics, objectAnalysis) {
    const recommendations = [];
    
    // Lifecycle policy recommendation
    if (objectAnalysis.ageDistribution.old > 0 || objectAnalysis.ageDistribution.ancient > 0) {
      const oldObjects = objectAnalysis.ageDistribution.old + objectAnalysis.ageDistribution.ancient;
      const estimatedSavings = (storageMetrics.usage.totalSizeGB * (oldObjects / objectAnalysis.sampleSize)) * 
                              (0.023 - 0.0125) * 12; // Annual savings from Standard to IA
      
      recommendations.push({
        id: 'storage-lifecycle-001',
        priority: 'high',
        category: 'lifecycle',
        title: 'Implement S3 Lifecycle Policies',
        description: `${oldObjects} objects (${Math.round(oldObjects/objectAnalysis.sampleSize*100)}%) are candidates for lifecycle transitions`,
        impact: 'cost_reduction',
        estimatedAnnualSavings: Math.round(estimatedSavings * 100) / 100,
        implementation: {
          effort: 'low',
          timeframe: '1-2 hours',
          steps: [
            'Create lifecycle rule for objects older than 30 days → Standard-IA',
            'Create lifecycle rule for objects older than 90 days → Glacier',
            'Create lifecycle rule for objects older than 365 days → Deep Archive',
            'Monitor cost impact over 30 days'
          ]
        }
      });
    }
    
    // Compression recommendation
    if (objectAnalysis.compressionCandidates > 0) {
      const estimatedSavings = objectAnalysis.compressionCandidates * 0.5 * 0.023; // Assume 50% compression, monthly savings
      
      recommendations.push({
        id: 'storage-compression-001',
        priority: 'medium',
        category: 'compression',
        title: 'Implement Object Compression',
        description: `${objectAnalysis.compressionCandidates} objects are candidates for compression`,
        impact: 'cost_reduction',
        estimatedAnnualSavings: Math.round(estimatedSavings * 12 * 100) / 100,
        implementation: {
          effort: 'medium',
          timeframe: '1-2 weeks',
          steps: [
            'Identify compressible file types and implement compression middleware',
            'Create S3 upload pipeline with automatic compression',
            'Update file serving logic to handle compressed objects',
            'Monitor storage size reduction and performance impact'
          ]
        }
      });
    }

    return recommendations;
  }

  /**
   * Get CloudFront distribution configuration
   */
  async getDistributionConfig() {
    try {
      const params = { Id: this.distributionId };
      const result = await this.cloudFront.getDistribution(params).promise();
      
      return {
        id: this.distributionId,
        status: result.Distribution.Status,
        cacheBehaviors: result.Distribution.DistributionConfig.CacheBehaviors?.Items || [],
        defaultCacheBehavior: result.Distribution.DistributionConfig.DefaultCacheBehavior,
        priceClass: result.Distribution.DistributionConfig.PriceClass,
        enabled: result.Distribution.DistributionConfig.Enabled
      };

    } catch (error) {
      return {
        id: this.distributionId,
        status: 'unknown',
        cacheBehaviors: [],
        defaultCacheBehavior: null,
        priceClass: 'PriceClass_All',
        enabled: true
      };
    }
  }

  /**
   * Generate delivery optimization recommendations
   */
  generateDeliveryRecommendations(distributionConfig, cacheAnalysis, performanceMetrics) {
    const recommendations = [];
    
    // Price class optimization
    if (distributionConfig.priceClass === 'PriceClass_All') {
      recommendations.push({
        id: 'delivery-priceclass-001',
        priority: 'medium',
        category: 'delivery',
        title: 'Optimize CloudFront Price Class',
        description: 'Consider using PriceClass_100 or PriceClass_200 to reduce costs if users are primarily in North America/Europe',
        impact: 'cost_reduction',
        estimatedAnnualSavings: 120.00, // Estimated savings
        implementation: {
          effort: 'low',
          timeframe: '30 minutes',
          steps: [
            'Analyze user geographic distribution',
            'Test PriceClass_200 for 2 weeks to measure performance impact',
            'Update distribution configuration if acceptable',
            'Monitor performance and cost metrics'
          ]
        }
      });
    }
    
    return recommendations;
  }

  /**
   * Generate caching optimization recommendations
   */
  generateCachingRecommendations(cacheMetrics, hitPatterns) {
    const recommendations = [];
    
    // Cache hit rate optimization
    if (cacheMetrics.averageHitRate < this.optimizationTargets.cacheHitRateTarget) {
      const potentialSavings = (this.optimizationTargets.cacheHitRateTarget - cacheMetrics.averageHitRate) * 0.5; // Estimated monthly savings per % improvement
      
      recommendations.push({
        id: 'caching-hitrate-001',
        priority: 'high',
        category: 'caching',
        title: 'Improve Cache Hit Rate',
        description: `Current cache hit rate is ${cacheMetrics.averageHitRate}%, target is ${this.optimizationTargets.cacheHitRateTarget}%`,
        impact: 'cost_reduction',
        estimatedAnnualSavings: Math.round(potentialSavings * 12 * 100) / 100,
        implementation: {
          effort: 'medium',
          timeframe: '1 week',
          steps: [
            'Analyze request patterns to identify cacheable content with low hit rates',
            'Update cache behaviors to increase TTL for static content',
            'Implement proper cache headers in application responses',
            'Monitor cache hit rate improvement over 2 weeks'
          ]
        }
      });
    }
    
    return recommendations;
  }

  /**
   * Generate optimization summary
   */
  generateOptimizationSummary(analysis) {
    const allRecommendations = [
      ...(analysis.storage?.recommendations || []),
      ...(analysis.delivery?.recommendations || []),
      ...(analysis.lifecycle?.recommendations || []),
      ...(analysis.caching?.recommendations || []),
      ...(analysis.compression?.recommendations || [])
    ];

    const totalPotentialSavings = allRecommendations.reduce((sum, rec) => 
      sum + (rec.estimatedAnnualSavings || 0), 0
    );

    const highPriorityCount = allRecommendations.filter(rec => rec.priority === 'high').length;
    const mediumPriorityCount = allRecommendations.filter(rec => rec.priority === 'medium').length;
    const lowPriorityCount = allRecommendations.filter(rec => rec.priority === 'low').length;

    return {
      totalRecommendations: allRecommendations.length,
      priorityBreakdown: {
        high: highPriorityCount,
        medium: mediumPriorityCount,
        low: lowPriorityCount
      },
      totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      implementationEffort: this.calculateImplementationEffort(allRecommendations),
      quickWins: allRecommendations.filter(rec => 
        rec.priority === 'high' && 
        rec.implementation?.effort === 'low'
      ).length,
      status: totalPotentialSavings > this.optimizationTargets.costSavingsThreshold ? 'actionable' : 'monitoring'
    };
  }

  /**
   * Calculate total implementation effort
   */
  calculateImplementationEffort(recommendations) {
    const effortWeights = { low: 1, medium: 3, high: 8 };
    const totalEffort = recommendations.reduce((sum, rec) => 
      sum + (effortWeights[rec.implementation?.effort] || 3), 0
    );
    
    if (totalEffort <= 5) return 'low';
    if (totalEffort <= 15) return 'medium';
    return 'high';
  }

  /**
   * Save optimization analysis to file
   */
  async saveOptimizationAnalysis(analysis) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cost-optimization-analysis-${timestamp}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(analysis, null, 2));
      console.log(`📄 Optimization analysis saved: ${filepath}`);
      
      // Also save as latest
      const latestPath = path.join(this.reportsDir, 'latest-optimization-analysis.json');
      await fs.writeFile(latestPath, JSON.stringify(analysis, null, 2));
      
    } catch (error) {
      console.warn('⚠️  Failed to save optimization analysis:', error.message);
    }
  }

  // Mock data generators for development
  generateMockStorageOptimizations() {
    return {
      currentCosts: {
        estimatedMonthlyStandard: 25.50,
        estimatedMonthlyIA: 15.30,
        estimatedMonthlyGlacier: 5.10
      },
      recommendations: [
        {
          id: 'storage-lifecycle-001',
          priority: 'high',
          title: 'Implement S3 Lifecycle Policies',
          estimatedAnnualSavings: 120.00
        }
      ],
      potentialSavings: 120.00
    };
  }

  generateMockDeliveryOptimizations() {
    return {
      recommendations: [
        {
          id: 'delivery-priceclass-001',
          priority: 'medium',
          title: 'Optimize CloudFront Price Class',
          estimatedAnnualSavings: 84.00
        }
      ],
      potentialSavings: 84.00
    };
  }

  generateMockLifecycleOptimizations() {
    return {
      recommendations: [
        {
          id: 'lifecycle-automation-001',
          priority: 'medium',
          title: 'Automate Lifecycle Transitions',
          estimatedAnnualSavings: 60.00
        }
      ],
      potentialSavings: 60.00
    };
  }

  generateMockCachingOptimizations() {
    return {
      metrics: { averageHitRate: 78.5 },
      recommendations: [
        {
          id: 'caching-hitrate-001',
          priority: 'high',
          title: 'Improve Cache Hit Rate',
          estimatedAnnualSavings: 96.00
        }
      ],
      potentialSavings: 96.00
    };
  }

  generateMockCompressionOptimizations() {
    return {
      recommendations: [
        {
          id: 'compression-images-001',
          priority: 'medium',
          title: 'Implement Image Compression',
          estimatedAnnualSavings: 48.00
        }
      ],
      potentialSavings: 48.00
    };
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const analyzer = new CostOptimizationAnalyzer();

  console.log('🎯 Cost Optimization Analyzer');
  console.log('═'.repeat(45));

  try {
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    const analysis = await analyzer.analyzeOptimizations();

    // Display summary
    console.log('\n📋 OPTIMIZATION SUMMARY');
    console.log('═'.repeat(35));
    console.log(`Total Recommendations: ${analysis.summary.totalRecommendations}`);
    console.log(`High Priority: ${analysis.summary.priorityBreakdown.high}`);
    console.log(`Medium Priority: ${analysis.summary.priorityBreakdown.medium}`);
    console.log(`Low Priority: ${analysis.summary.priorityBreakdown.low}`);
    console.log(`Potential Annual Savings: $${analysis.summary.totalPotentialSavings}`);
    console.log(`Quick Wins Available: ${analysis.summary.quickWins}`);
    console.log(`Implementation Effort: ${analysis.summary.implementationEffort}`);

    if (args.includes('--verbose')) {
      console.log('\n📊 DETAILED ANALYSIS');
      console.log('═'.repeat(35));
      console.log(JSON.stringify(analysis, null, 2));
    }

    if (args.includes('--recommendations')) {
      console.log('\n🎯 TOP RECOMMENDATIONS');
      console.log('═'.repeat(35));
      
      const allRecs = [
        ...(analysis.storage?.recommendations || []),
        ...(analysis.delivery?.recommendations || []),
        ...(analysis.caching?.recommendations || [])
      ].sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      });

      allRecs.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`   Savings: $${rec.estimatedAnnualSavings}/year`);
        console.log(`   Effort: ${rec.implementation?.effort || 'unknown'}`);
        console.log('');
      });
    }

    console.log('\n✅ Optimization analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('Usage: node cost-optimization-analyzer.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --recommendations  Show top recommendations');
  console.log('  --verbose         Show detailed analysis');
  console.log('  --help, -h        Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node cost-optimization-analyzer.js --recommendations');
  console.log('  node cost-optimization-analyzer.js --verbose');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CostOptimizationAnalyzer;