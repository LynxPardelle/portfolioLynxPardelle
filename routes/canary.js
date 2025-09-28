/**
 * Canary Deployment API Routes
 * RESTful API for managing canary deployments, monitoring, and rollbacks
 */

const express = require('express');
const router = express.Router();
const CanaryDeploymentManager = require('../services/canary-deployment');

// Initialize canary deployment manager
const canaryManager = new CanaryDeploymentManager({
  environment: process.env.NODE_ENV || 'development',
  stagingUrl: process.env.STAGING_URL || 'http://localhost:6164',
  productionUrl: process.env.PRODUCTION_URL || 'http://localhost:6165',
  
  cloudfront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    domain: process.env.CLOUDFRONT_DOMAIN,
  },
  
  deployment: {
    name: process.env.CANARY_DEPLOYMENT_NAME || 'S3_CDN_STORAGE',
    stages: process.env.CANARY_STAGES ? 
      process.env.CANARY_STAGES.split(',').map(Number) : 
      [0, 25, 50, 75, 100],
  },
  
  thresholds: {
    errorRate: parseFloat(process.env.CANARY_ERROR_THRESHOLD) || 0.02,
    latencyP95: parseInt(process.env.CANARY_LATENCY_THRESHOLD) || 2000,
    cacheHitRatio: parseFloat(process.env.CANARY_CACHE_THRESHOLD) || 0.85,
    availability: parseFloat(process.env.CANARY_AVAILABILITY_THRESHOLD) || 0.995,
  },
  
  timing: {
    stageDuration: parseInt(process.env.CANARY_STAGE_DURATION) || 30 * 60 * 1000, // 30 minutes
    monitoringInterval: parseInt(process.env.CANARY_MONITORING_INTERVAL) || 60 * 1000, // 1 minute
  },
  
  notifications: {
    webhookUrl: process.env.CANARY_WEBHOOK_URL,
    emailEndpoint: process.env.CANARY_EMAIL_ENDPOINT,
    slackChannel: process.env.SLACK_CHANNEL,
  },
  
  rollback: {
    autoRollback: process.env.CANARY_AUTO_ROLLBACK !== 'false',
    maxRetries: parseInt(process.env.CANARY_MAX_RETRIES) || 3,
  }
});

/**
 * GET /api/canary/status
 * Get current canary deployment status
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      canaryState: canaryManager.canaryState,
      config: {
        stages: canaryManager.config.featureFlag.stages,
        thresholds: canaryManager.config.thresholds,
        timing: canaryManager.config.timing,
        autoRollback: canaryManager.config.rollback.autoRollback
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Canary status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve canary status',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/validate
 * Run pre-production validation
 */
router.post('/validate', async (req, res) => {
  try {
    const validation = await canaryManager.validatePreProduction();
    
    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pre-production validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Pre-production validation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/start
 * Start canary deployment
 */
router.post('/start', async (req, res) => {
  try {
    const options = req.body || {};
    
    // Check if canary is already running
    if (['deploying', 'monitoring'].includes(canaryManager.canaryState.status)) {
      return res.status(409).json({
        success: false,
        error: 'Canary deployment already in progress',
        currentStatus: canaryManager.canaryState.status
      });
    }
    
    const result = await canaryManager.startCanaryDeployment(options);
    
    res.json({
      success: true,
      data: result,
      message: 'Canary deployment started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start canary deployment',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/rollback
 * Manually rollback canary deployment
 */
router.post('/rollback', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rollback reason is required'
      });
    }
    
    const result = await canaryManager.rollbackCanary(reason);
    
    res.json({
      success: true,
      data: result,
      message: 'Canary deployment rolled back successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary rollback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback canary deployment',
      message: error.message
    });
  }
});

/**
 * GET /api/canary/health
 * Get current canary health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await canaryManager.checkCanaryHealth();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check canary health',
      message: error.message
    });
  }
});

/**
 * GET /api/canary/metrics
 * Get canary deployment metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      canaryState: canaryManager.canaryState,
      metrics: canaryManager.canaryState.metrics,
      errors: canaryManager.canaryState.errors,
      rolloutHistory: canaryManager.canaryState.rolloutHistory,
      healthScore: canaryManager.calculateOverallHealthScore()
    };
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve canary metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/canary/report
 * Generate canary deployment report
 */
router.get('/report', (req, res) => {
  try {
    const report = canaryManager.generateCanaryReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate canary report',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/stage/next
 * Manually advance to next canary stage
 */
router.post('/stage/next', async (req, res) => {
  try {
    const currentStage = canaryManager.canaryState.currentStage;
    const nextStage = currentStage + 1;
    
    if (nextStage >= canaryManager.config.featureFlag.stages.length) {
      return res.status(400).json({
        success: false,
        error: 'Already at final stage'
      });
    }
    
    if (canaryManager.canaryState.status !== 'monitoring') {
      return res.status(409).json({
        success: false,
        error: 'Cannot advance stage when not in monitoring status',
        currentStatus: canaryManager.canaryState.status
      });
    }
    
    // Clear current monitoring
    if (canaryManager.monitoringInterval) {
      clearInterval(canaryManager.monitoringInterval);
    }
    if (canaryManager.stageTimeout) {
      clearTimeout(canaryManager.stageTimeout);
    }
    
    await canaryManager.deployStage(nextStage);
    
    res.json({
      success: true,
      data: {
        previousStage: currentStage,
        currentStage: nextStage,
        percentage: canaryManager.config.featureFlag.stages[nextStage]
      },
      message: `Advanced to stage ${nextStage + 1}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stage advance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to advance to next stage',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/pause
 * Pause canary deployment
 */
router.post('/pause', (req, res) => {
  try {
    // Clear monitoring intervals
    if (canaryManager.monitoringInterval) {
      clearInterval(canaryManager.monitoringInterval);
      canaryManager.monitoringInterval = null;
    }
    
    if (canaryManager.stageTimeout) {
      clearTimeout(canaryManager.stageTimeout);
      canaryManager.stageTimeout = null;
    }
    
    canaryManager.canaryState.status = 'paused';
    canaryManager.canaryState.pausedAt = new Date();
    
    res.json({
      success: true,
      data: {
        status: 'paused',
        pausedAt: canaryManager.canaryState.pausedAt,
        currentStage: canaryManager.canaryState.currentStage
      },
      message: 'Canary deployment paused',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary pause error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause canary deployment',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/resume
 * Resume paused canary deployment
 */
router.post('/resume', async (req, res) => {
  try {
    if (canaryManager.canaryState.status !== 'paused') {
      return res.status(409).json({
        success: false,
        error: 'Canary deployment is not paused',
        currentStatus: canaryManager.canaryState.status
      });
    }
    
    // Resume monitoring for current stage
    await canaryManager.startStageMonitoring(canaryManager.canaryState.currentStage);
    
    canaryManager.canaryState.status = 'monitoring';
    canaryManager.canaryState.resumedAt = new Date();
    
    res.json({
      success: true,
      data: {
        status: 'monitoring',
        resumedAt: canaryManager.canaryState.resumedAt,
        currentStage: canaryManager.canaryState.currentStage
      },
      message: 'Canary deployment resumed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary resume error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume canary deployment',
      message: error.message
    });
  }
});

/**
 * GET /api/canary/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const health = await canaryManager.checkCanaryHealth();
    const report = canaryManager.generateCanaryReport();
    
    const dashboard = {
      status: canaryManager.canaryState.status,
      currentStage: canaryManager.canaryState.currentStage,
      stages: canaryManager.config.featureFlag.stages,
      health: health,
      metrics: canaryManager.canaryState.metrics,
      errors: canaryManager.canaryState.errors.slice(-10), // Last 10 errors
      rolloutHistory: canaryManager.canaryState.rolloutHistory,
      config: {
        thresholds: canaryManager.config.thresholds,
        timing: canaryManager.config.timing,
        autoRollback: canaryManager.config.rollback.autoRollback
      },
      report: report
    };
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve canary dashboard',
      message: error.message
    });
  }
});

/**
 * POST /api/canary/config
 * Update canary configuration
 */
router.post('/config', (req, res) => {
  try {
    const { thresholds, timing, rollback } = req.body;
    
    if (thresholds) {
      Object.assign(canaryManager.config.thresholds, thresholds);
    }
    
    if (timing) {
      Object.assign(canaryManager.config.timing, timing);
    }
    
    if (rollback) {
      Object.assign(canaryManager.config.rollback, rollback);
    }
    
    res.json({
      success: true,
      data: {
        thresholds: canaryManager.config.thresholds,
        timing: canaryManager.config.timing,
        rollback: canaryManager.config.rollback
      },
      message: 'Canary configuration updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update canary configuration',
      message: error.message
    });
  }
});

/**
 * GET /api/canary/logs
 * Get canary deployment logs
 */
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level; // error, warning, info
    
    let logs = [
      ...canaryManager.canaryState.errors.map(error => ({
        ...error,
        level: 'error'
      })),
      ...canaryManager.canaryState.rolloutHistory.map(history => ({
        ...history,
        level: 'info',
        message: `Stage ${history.stage} deployed: ${history.percentage}%`
      }))
    ];
    
    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    // Sort by timestamp and limit
    logs = logs
      .sort((a, b) => new Date(b.timestamp || b.deployedAt) - new Date(a.timestamp || a.deployedAt))
      .slice(0, limit);
    
    res.json({
      success: true,
      data: logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Canary logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve canary logs',
      message: error.message
    });
  }
});

// Event handlers for real-time updates
canaryManager.on('stage_progress', (data) => {
  console.log(`📊 Stage ${data.stage + 1} progress: ${data.health.score * 100}% healthy`);
});

canaryManager.on('canary_complete', (data) => {
  console.log('🎉 Canary deployment completed successfully');
});

canaryManager.on('canary_rollback', (data) => {
  console.log(`🚨 Canary deployment rolled back: ${data.reason}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping canary deployment manager...');
  if (canaryManager.monitoringInterval) {
    clearInterval(canaryManager.monitoringInterval);
  }
  if (canaryManager.stageTimeout) {
    clearTimeout(canaryManager.stageTimeout);
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping canary deployment manager...');
  if (canaryManager.monitoringInterval) {
    clearInterval(canaryManager.monitoringInterval);
  }
  if (canaryManager.stageTimeout) {
    clearTimeout(canaryManager.stageTimeout);
  }
  process.exit(0);
});

module.exports = router;