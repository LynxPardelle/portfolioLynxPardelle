/**
 * Canary Deployment System
 * Pre-production validation, canary rollout management, and automated monitoring
 */

const { CloudFrontClient, CreateInvalidationCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand, ListMetricsCommand } = require('@aws-sdk/client-cloudwatch');
const axios = require('axios');
const EventEmitter = require('events');

class CanaryDeploymentManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Deployment configuration
      environment: config.environment || process.env.NODE_ENV || 'development',
      stagingUrl: config.stagingUrl || process.env.STAGING_URL,
      productionUrl: config.productionUrl || process.env.PRODUCTION_URL,
      
      // CloudFront configuration
      cloudfront: {
        distributionId: config.cloudfront?.distributionId || process.env.CLOUDFRONT_DISTRIBUTION_ID,
        domain: config.cloudfront?.domain || process.env.CLOUDFRONT_DOMAIN,
      },
      
      // Deployment configuration (S3-only mode)
      deployment: {
        name: config.deployment?.name || 'S3_CDN_STORAGE',
        stages: config.deployment?.stages || [0, 25, 50, 75, 100], // Percentage rollout stages
        userGroups: config.deployment?.userGroups || ['internal', 'beta', 'general'],
        mode: 's3-only',
      },
      
      // Monitoring thresholds
      thresholds: {
        errorRate: config.thresholds?.errorRate || 0.02, // 2% max error rate
        latencyP95: config.thresholds?.latencyP95 || 2000, // 2s p95 latency
        cacheHitRatio: config.thresholds?.cacheHitRatio || 0.85, // 85% cache hit ratio
        availability: config.thresholds?.availability || 0.995, // 99.5% availability
      },
      
      // Rollout timing
      timing: {
        stageDuration: config.timing?.stageDuration || 30 * 60 * 1000, // 30 minutes per stage
        monitoringInterval: config.timing?.monitoringInterval || 60 * 1000, // 1 minute checks
        cooldownPeriod: config.timing?.cooldownPeriod || 5 * 60 * 1000, // 5 minute cooldown
      },
      
      // Notifications
      notifications: {
        webhookUrl: config.notifications?.webhookUrl || process.env.CANARY_WEBHOOK_URL,
        emailEndpoint: config.notifications?.emailEndpoint || process.env.CANARY_EMAIL_ENDPOINT,
        slackChannel: config.notifications?.slackChannel || process.env.SLACK_CHANNEL,
      },
      
      // Rollback configuration
      rollback: {
        autoRollback: config.rollback?.autoRollback !== false,
        maxRetries: config.rollback?.maxRetries || 3,
        rollbackTimeout: config.rollback?.rollbackTimeout || 10 * 60 * 1000, // 10 minutes
      }
    };

    // Initialize AWS services
    this.cloudfront = new CloudFrontClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.NODE_ENV === 'development' ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'dev-placeholder',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'dev-placeholder'
      } : undefined
    });
    this.cloudwatch = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.NODE_ENV === 'development' ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'dev-placeholder',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'dev-placeholder'
      } : undefined
    });
    
    // Canary state management
    this.canaryState = {
      status: 'idle', // idle, validating, deploying, monitoring, completed, failed, rolled-back
      currentStage: 0,
      startTime: null,
      metrics: {},
      errors: [],
      rolloutHistory: []
    };
    
    // Monitoring intervals
    this.monitoringInterval = null;
    this.stageTimeout = null;
  }

  /**
   * Pre-production validation pipeline
   */
  async validatePreProduction() {
    console.log('🔍 Starting pre-production validation...');
    this.canaryState.status = 'validating';
    
    const validationResults = {
      cloudfront: await this.validateCloudFront(),
      staging: await this.validateStagingEnvironment(),
      performance: await this.validatePerformanceBaseline(),
      dependencies: await this.validateDependencies(),
      rollback: await this.validateRollbackCapability()
    };
    
    const allValidationsPass = Object.values(validationResults).every(result => result.success);
    
    if (allValidationsPass) {
      console.log('✅ Pre-production validation completed successfully');
      await this.notifyStakeholders({
        type: 'validation_success',
        message: 'Pre-production validation completed. Ready for canary deployment.',
        details: validationResults
      });
      return { success: true, results: validationResults };
    } else {
      console.error('❌ Pre-production validation failed');
      const failures = Object.entries(validationResults)
        .filter(([_, result]) => !result.success)
        .map(([key, result]) => `${key}: ${result.error}`);
      
      await this.notifyStakeholders({
        type: 'validation_failure',
        message: 'Pre-production validation failed. Canary deployment blocked.',
        details: { failures, results: validationResults }
      });
      
      return { success: false, failures, results: validationResults };
    }
  }

  /**
   * Validate CloudFront distribution status
   */
  async validateCloudFront() {
    try {
      console.log('📡 Validating CloudFront distribution...');
      
      if (!this.config.cloudfront.distributionId) {
        return {
          success: false,
          error: 'CloudFront distribution ID not configured'
        };
      }

      const command = new GetDistributionCommand({
        Id: this.config.cloudfront.distributionId
      });
      const distribution = await this.cloudfront.send(command);

      const status = distribution.Distribution.Status;
      const enabled = distribution.Distribution.DistributionConfig.Enabled;

      if (status !== 'Deployed') {
        return {
          success: false,
          error: `CloudFront distribution not deployed. Current status: ${status}`
        };
      }

      if (!enabled) {
        return {
          success: false,
          error: 'CloudFront distribution is disabled'
        };
      }

      // Test CDN response
      const testUrl = `https://${this.config.cloudfront.domain}/health`;
      const response = await axios.get(testUrl, { timeout: 10000 });
      
      return {
        success: true,
        status: status,
        enabled: enabled,
        testResponse: response.status,
        lastModified: distribution.Distribution.LastModifiedTime
      };
    } catch (error) {
      return {
        success: false,
        error: `CloudFront validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate staging environment readiness
   */
  async validateStagingEnvironment() {
    try {
      console.log('🧪 Validating staging environment...');
      
      if (!this.config.stagingUrl) {
        return {
          success: false,
          error: 'Staging URL not configured'
        };
      }

      // Health check
      const healthResponse = await axios.get(`${this.config.stagingUrl}/health`, {
        timeout: 10000
      });

      if (healthResponse.status !== 200) {
        return {
          success: false,
          error: `Staging health check failed with status ${healthResponse.status}`
        };
      }

      // Feature flag check
      const flagResponse = await axios.get(`${this.config.stagingUrl}/api/main/feature-flags`, {
        timeout: 5000
      });

      // S3 integration check
      const s3Response = await axios.get(`${this.config.stagingUrl}/api/main/s3-status`, {
        timeout: 5000
      });

      // Performance check
      const perfResponse = await axios.get(`${this.config.stagingUrl}/api/performance/health`, {
        timeout: 5000
      });

      return {
        success: true,
        health: healthResponse.data,
        storageMode: 's3-only',
        s3Status: s3Response.data,
        performanceMonitoring: perfResponse.data,
        responseTime: healthResponse.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        error: `Staging validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate performance baseline
   */
  async validatePerformanceBaseline() {
    try {
      console.log('📊 Validating performance baseline...');
      
      // Get current performance metrics
      const metricsResponse = await axios.get(`${this.config.stagingUrl}/api/performance/metrics/current`, {
        timeout: 10000
      });

      const metrics = metricsResponse.data.data;
      const thresholds = this.config.thresholds;

      const checks = {
        errorRate: metrics.error_rate?.rate <= thresholds.errorRate,
        latency: metrics.upload_latency?.p95 <= thresholds.latencyP95,
        cacheHitRatio: metrics.cache_hit_ratio?.ratio >= thresholds.cacheHitRatio
      };

      const allChecksPassed = Object.values(checks).every(Boolean);

      return {
        success: allChecksPassed,
        metrics: metrics,
        thresholds: thresholds,
        checks: checks,
        error: allChecksPassed ? null : 'Performance baseline validation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: `Performance baseline validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate system dependencies
   */
  async validateDependencies() {
    try {
      console.log('🔗 Validating system dependencies...');
      
      const checks = {
        mongodb: await this.checkMongoDB(),
        s3: await this.checkS3(),
        cloudwatch: await this.checkCloudWatch(),
        performanceMonitoring: await this.checkPerformanceMonitoring()
      };

      const allHealthy = Object.values(checks).every(check => check.healthy);

      return {
        success: allHealthy,
        checks: checks,
        error: allHealthy ? null : 'One or more dependencies are unhealthy'
      };
    } catch (error) {
      return {
        success: false,
        error: `Dependency validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate rollback capability
   */
  async validateRollbackCapability() {
    try {
      console.log('🔄 Validating rollback capability...');
      
      // Check if feature flags can be toggled
      const flagToggleTest = await this.testFeatureFlagToggle();
      
      // Check if performance monitoring is working
      const monitoringTest = await this.testPerformanceMonitoring();
      
      // Check if notification system is working
      const notificationTest = await this.testNotificationSystem();

      return {
        success: flagToggleTest && monitoringTest && notificationTest,
        tests: {
          featureFlagToggle: flagToggleTest,
          performanceMonitoring: monitoringTest,
          notifications: notificationTest
        },
        error: (!flagToggleTest || !monitoringTest || !notificationTest) ? 
          'Rollback capability validation failed' : null
      };
    } catch (error) {
      return {
        success: false,
        error: `Rollback validation failed: ${error.message}`
      };
    }
  }

  /**
   * Start canary deployment
   */
  async startCanaryDeployment(options = {}) {
    console.log('🚀 Starting canary deployment...');
    
    // Validate pre-production first
    const validation = await this.validatePreProduction();
    if (!validation.success) {
      throw new Error(`Pre-production validation failed: ${validation.failures?.join(', ')}`);
    }

    this.canaryState = {
      status: 'deploying',
      currentStage: 0,
      startTime: new Date(),
      metrics: {},
      errors: [],
      rolloutHistory: [],
      options: options
    };

    await this.notifyStakeholders({
      type: 'canary_start',
      message: 'Canary deployment started',
      details: {
        stages: this.config.featureFlag.stages,
        duration: this.config.timing.stageDuration,
        thresholds: this.config.thresholds
      }
    });

    // Start with first stage
    await this.deployStage(0);
    
    return {
      success: true,
      canaryId: this.generateCanaryId(),
      startTime: this.canaryState.startTime,
      stages: this.config.featureFlag.stages
    };
  }

  /**
   * Deploy specific canary stage
   */
  async deployStage(stageIndex) {
    const percentage = this.config.featureFlag.stages[stageIndex];
    console.log(`📈 Deploying canary stage ${stageIndex + 1}: ${percentage}%`);

    this.canaryState.currentStage = stageIndex;
    this.canaryState.status = 'monitoring';

    try {
      // Update feature flag percentage
      await this.updateFeatureFlagPercentage(percentage);
      
      // Record stage deployment
      this.canaryState.rolloutHistory.push({
        stage: stageIndex,
        percentage: percentage,
        deployedAt: new Date(),
        status: 'deployed'
      });

      // Start monitoring for this stage
      await this.startStageMonitoring(stageIndex);

      await this.notifyStakeholders({
        type: 'stage_deployed',
        message: `Canary stage ${stageIndex + 1} deployed: ${percentage}% traffic`,
        details: {
          stage: stageIndex,
          percentage: percentage,
          nextStage: stageIndex + 1 < this.config.featureFlag.stages.length ? 
            this.config.featureFlag.stages[stageIndex + 1] : null
        }
      });

    } catch (error) {
      console.error(`❌ Stage ${stageIndex} deployment failed:`, error);
      this.canaryState.errors.push({
        stage: stageIndex,
        error: error.message,
        timestamp: new Date()
      });
      
      if (this.config.rollback.autoRollback) {
        await this.rollbackCanary(`Stage ${stageIndex} deployment failed: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Monitor canary stage performance
   */
  async startStageMonitoring(stageIndex) {
    const percentage = this.config.featureFlag.stages[stageIndex];
    console.log(`👁️ Starting monitoring for stage ${stageIndex + 1} (${percentage}%)`);

    let stageStartTime = Date.now();
    let healthChecksPassed = 0;
    let totalHealthChecks = 0;

    // Set up stage timeout
    this.stageTimeout = setTimeout(async () => {
      console.log(`⏰ Stage ${stageIndex + 1} monitoring period completed`);
      
      if (stageIndex + 1 < this.config.featureFlag.stages.length) {
        // Move to next stage
        await this.deployStage(stageIndex + 1);
      } else {
        // Complete canary deployment
        await this.completeCanaryDeployment();
      }
    }, this.config.timing.stageDuration);

    // Start monitoring interval
    this.monitoringInterval = setInterval(async () => {
      try {
        totalHealthChecks++;
        const health = await this.checkCanaryHealth();
        
        if (health.healthy) {
          healthChecksPassed++;
        } else {
          console.warn(`⚠️ Health check failed: ${health.issues.join(', ')}`);
          
          // Check if we should auto-rollback
          if (this.shouldAutoRollback(health)) {
            await this.rollbackCanary(`Health checks failing: ${health.issues.join(', ')}`);
            return;
          }
        }

        // Update metrics
        this.canaryState.metrics[`stage_${stageIndex}`] = {
          healthChecksPassed: healthChecksPassed,
          totalHealthChecks: totalHealthChecks,
          successRate: healthChecksPassed / totalHealthChecks,
          currentHealth: health,
          runtime: Date.now() - stageStartTime
        };

        // Emit progress event
        this.emit('stage_progress', {
          stage: stageIndex,
          percentage: percentage,
          health: health,
          metrics: this.canaryState.metrics[`stage_${stageIndex}`]
        });

      } catch (error) {
        console.error('❌ Monitoring error:', error);
        this.canaryState.errors.push({
          stage: stageIndex,
          error: error.message,
          timestamp: new Date(),
          type: 'monitoring_error'
        });
      }
    }, this.config.timing.monitoringInterval);
  }

  /**
   * Check canary health across all metrics
   */
  async checkCanaryHealth() {
    try {
      // Get current performance metrics
      const response = await axios.get(`${this.config.productionUrl}/api/performance/metrics/current`, {
        timeout: 10000
      });

      const metrics = response.data.data;
      const thresholds = this.config.thresholds;
      
      const checks = {
        errorRate: {
          healthy: metrics.error_rate?.rate <= thresholds.errorRate,
          current: metrics.error_rate?.rate,
          threshold: thresholds.errorRate
        },
        latency: {
          healthy: metrics.upload_latency?.p95 <= thresholds.latencyP95,
          current: metrics.upload_latency?.p95,
          threshold: thresholds.latencyP95
        },
        cacheHitRatio: {
          healthy: metrics.cache_hit_ratio?.ratio >= thresholds.cacheHitRatio,
          current: metrics.cache_hit_ratio?.ratio,
          threshold: thresholds.cacheHitRatio
        }
      };

      const healthyChecks = Object.values(checks).filter(check => check.healthy).length;
      const totalChecks = Object.keys(checks).length;
      const overallHealthy = healthyChecks === totalChecks;

      const issues = Object.entries(checks)
        .filter(([_, check]) => !check.healthy)
        .map(([name, check]) => `${name}: ${check.current} (threshold: ${check.threshold})`);

      return {
        healthy: overallHealthy,
        score: healthyChecks / totalChecks,
        checks: checks,
        issues: issues,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        healthy: false,
        score: 0,
        checks: {},
        issues: [`Health check failed: ${error.message}`],
        timestamp: new Date()
      };
    }
  }

  /**
   * Update feature flag percentage
   */
  async updateFeatureFlagPercentage(percentage) {
    try {
      // In a real implementation, this would update your feature flag system
      // For now, we'll simulate by calling the application's feature flag endpoint
      
      const response = await axios.post(`${this.config.productionUrl}/api/main/feature-flags/update`, {
        flag: this.config.featureFlag.key,
        percentage: percentage,
        timestamp: new Date().toISOString()
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`✅ Feature flag updated: ${percentage}% rollout`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update feature flag: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete canary deployment
   */
  async completeCanaryDeployment() {
    console.log('🎉 Completing canary deployment...');
    
    // Clear monitoring intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.stageTimeout) {
      clearTimeout(this.stageTimeout);
      this.stageTimeout = null;
    }

    // Update canary state
    this.canaryState.status = 'completed';
    this.canaryState.completedAt = new Date();

    // Set feature flag to 100% permanently
    await this.updateFeatureFlagPercentage(100);

    // Generate completion report
    const report = this.generateCanaryReport();

    await this.notifyStakeholders({
      type: 'canary_complete',
      message: 'Canary deployment completed successfully! 🎉',
      details: {
        duration: Date.now() - this.canaryState.startTime,
        stages: this.config.featureFlag.stages.length,
        errors: this.canaryState.errors.length,
        report: report
      }
    });

    this.emit('canary_complete', {
      canaryState: this.canaryState,
      report: report
    });

    return report;
  }

  /**
   * Rollback canary deployment
   */
  async rollbackCanary(reason) {
    console.log(`🚨 Rolling back canary deployment: ${reason}`);
    
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.stageTimeout) {
      clearTimeout(this.stageTimeout);
      this.stageTimeout = null;
    }

    try {
      // Revert feature flag to 0%
      await this.updateFeatureFlagPercentage(0);
      
      // Update state
      this.canaryState.status = 'rolled-back';
      this.canaryState.rollbackReason = reason;
      this.canaryState.rolledBackAt = new Date();

      await this.notifyStakeholders({
        type: 'canary_rollback',
        message: `🚨 Canary deployment rolled back: ${reason}`,
        details: {
          reason: reason,
          stage: this.canaryState.currentStage,
          errors: this.canaryState.errors,
          duration: Date.now() - this.canaryState.startTime
        }
      });

      this.emit('canary_rollback', {
        reason: reason,
        canaryState: this.canaryState
      });

      return { success: true, reason: reason };
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      
      await this.notifyStakeholders({
        type: 'rollback_failed',
        message: `🔥 CRITICAL: Canary rollback failed: ${error.message}`,
        details: {
          originalReason: reason,
          rollbackError: error.message,
          canaryState: this.canaryState
        }
      });

      throw error;
    }
  }

  /**
   * Generate canary deployment report
   */
  generateCanaryReport() {
    const duration = this.canaryState.completedAt ? 
      this.canaryState.completedAt - this.canaryState.startTime :
      Date.now() - this.canaryState.startTime;

    return {
      canaryId: this.generateCanaryId(),
      status: this.canaryState.status,
      startTime: this.canaryState.startTime,
      completedAt: this.canaryState.completedAt,
      duration: duration,
      stages: {
        total: this.config.featureFlag.stages.length,
        completed: this.canaryState.currentStage + 1,
        rolloutHistory: this.canaryState.rolloutHistory
      },
      metrics: this.canaryState.metrics,
      errors: this.canaryState.errors,
      healthScore: this.calculateOverallHealthScore(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Helper methods
   */
  generateCanaryId() {
    return `canary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  shouldAutoRollback(health) {
    if (!this.config.rollback.autoRollback) return false;
    
    // Rollback if health score is too low
    return health.score < 0.5; // Less than 50% of checks passing
  }

  calculateOverallHealthScore() {
    const stageMetrics = Object.values(this.canaryState.metrics);
    if (stageMetrics.length === 0) return 0;
    
    const averageSuccessRate = stageMetrics.reduce((sum, stage) => 
      sum + (stage.successRate || 0), 0) / stageMetrics.length;
    
    return Math.round(averageSuccessRate * 100);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.canaryState.errors.length > 0) {
      recommendations.push('Review and address deployment errors for future rollouts');
    }
    
    if (this.calculateOverallHealthScore() < 95) {
      recommendations.push('Consider tightening health check thresholds');
    }
    
    recommendations.push('Document lessons learned and optimize deployment process');
    
    return recommendations;
  }

  // Dependency check methods
  async checkMongoDB() {
    try {
      const response = await axios.get(`${this.config.stagingUrl}/health`, { timeout: 5000 });
      return { healthy: response.data.status === 'healthy' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkS3() {
    try {
      const response = await axios.get(`${this.config.stagingUrl}/api/main/s3-status`, { timeout: 5000 });
      return { healthy: response.data.success === true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkCloudWatch() {
    try {
      const command = new ListMetricsCommand({ Namespace: 'PortfolioApp/Performance' });
      await this.cloudwatch.send(command);
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkPerformanceMonitoring() {
    try {
      const response = await axios.get(`${this.config.stagingUrl}/api/performance/health`, { timeout: 5000 });
      return { healthy: response.data.status === 'healthy' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async testFeatureFlagToggle() {
    try {
      // Test toggling feature flag
      await this.updateFeatureFlagPercentage(0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.updateFeatureFlagPercentage(1);
      return true;
    } catch (error) {
      console.error('Feature flag toggle test failed:', error);
      return false;
    }
  }

  async testPerformanceMonitoring() {
    try {
      const response = await axios.get(`${this.config.stagingUrl}/api/performance/metrics/current`, { timeout: 5000 });
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  async testNotificationSystem() {
    try {
      await this.notifyStakeholders({
        type: 'test',
        message: 'Notification system test - please ignore'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send notifications to stakeholders
   */
  async notifyStakeholders(notification) {
    const message = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      canaryId: this.generateCanaryId(),
      ...notification
    };

    console.log(`📢 Notification: ${message.message}`);

    // Send webhook notification
    if (this.config.notifications.webhookUrl) {
      try {
        await axios.post(this.config.notifications.webhookUrl, message, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error.message);
      }
    }

    // Send email notification for critical events
    if (['canary_start', 'canary_complete', 'canary_rollback', 'rollback_failed'].includes(notification.type)) {
      if (this.config.notifications.emailEndpoint) {
        try {
          await axios.post(this.config.notifications.emailEndpoint, {
            subject: `Canary Deployment: ${notification.message}`,
            message: JSON.stringify(message, null, 2),
            notification: message
          }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Failed to send email notification:', error.message);
        }
      }
    }
  }
}

module.exports = CanaryDeploymentManager;