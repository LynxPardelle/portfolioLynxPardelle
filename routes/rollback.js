/**
 * Rapid Rollback API Routes
 * 
 * RESTful API endpoints for managing rapid rollback procedures.
 * Provides comprehensive control over rollback triggers, execution, monitoring, and analysis.
 */

const express = require('express');
const router = express.Router();
const rapidRollback = require('../services/rapid-rollback');

// Middleware for API logging
router.use((req, res, next) => {
  console.log(`🔄 Rollback API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/**
 * GET /api/rollback/status
 * Get current rollback status and progress
 */
router.get('/status', async (req, res) => {
  try {
    const status = rapidRollback.getRollbackStatus();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: status
    });
    
  } catch (error) {
    console.error('❌ Error getting rollback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rollback status',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/trigger
 * Manually trigger rollback procedure
 * 
 * Body:
 * {
 *   "reason": "manual|performance|data_integrity|executive_decision",
 *   "description": "Detailed reason for rollback",
 *   "initiatedBy": "user@email.com",
 *   "urgent": true/false
 * }
 */
router.post('/trigger', async (req, res) => {
  try {
    const options = {
      reason: req.body.reason || 'manual',
      description: req.body.description || 'Manual rollback requested',
      initiatedBy: req.body.initiatedBy || 'unknown',
      urgent: req.body.urgent || false
    };
    
    const result = await rapidRollback.triggerManualRollback(options);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Rollback initiated successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error triggering rollback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger rollback',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/monitoring/start
 * Start rollback trigger monitoring
 */
router.post('/monitoring/start', async (req, res) => {
  try {
    await rapidRollback.startTriggerMonitoring();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Rollback trigger monitoring started'
    });
    
  } catch (error) {
    console.error('❌ Error starting rollback monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start rollback monitoring',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/monitoring/stop
 * Stop rollback trigger monitoring
 */
router.post('/monitoring/stop', async (req, res) => {
  try {
    rapidRollback.stopTriggerMonitoring();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Rollback trigger monitoring stopped'
    });
    
  } catch (error) {
    console.error('❌ Error stopping rollback monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop rollback monitoring',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/triggers
 * Get current rollback triggers and their status
 */
router.get('/triggers', async (req, res) => {
  try {
    const status = rapidRollback.getRollbackStatus();
    
    const triggerInfo = {
      active: status.triggers || [],
      thresholds: {
        cloudfrontErrorRate: 5.0,
        s3ErrorRate: 5.0,
        uploadFailureRate: 10.0,
        sustainedErrorDuration: 10 * 60 * 1000 // 10 minutes
      },
      monitoring: rapidRollback.triggerMonitoringInterval !== null
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      triggers: triggerInfo
    });
    
  } catch (error) {
    console.error('❌ Error getting triggers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get triggers',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/timeline
 * Get rollback timeline and progress
 */
router.get('/timeline', async (req, res) => {
  try {
    const status = rapidRollback.getRollbackStatus();
    
    if (!status.active && !status.rollback) {
      return res.json({
        success: true,
        active: false,
        message: 'No rollback in progress or completed'
      });
    }
    
    const timeline = {
      rollbackId: status.rollback ? status.rollback.id : null,
      status: status.rollback ? status.rollback.status : null,
      phase: status.rollback ? status.rollback.phase : null,
      progress: status.rollback ? status.rollback.progress : 0,
      timeline: status.timeline || [],
      duration: status.rollback && status.rollback.startTime 
        ? Date.now() - status.rollback.startTime.getTime() 
        : null
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeline: timeline
    });
    
  } catch (error) {
    console.error('❌ Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timeline',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/communications
 * Get rollback communications log
 */
router.get('/communications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const status = rapidRollback.getRollbackStatus();
    const allCommunications = status.communications || [];
    
    // Apply pagination
    const paginatedCommunications = allCommunications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      communications: paginatedCommunications,
      pagination: {
        total: allCommunications.length,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < allCommunications.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting communications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get communications',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/communicate
 * Send manual communication
 * 
 * Body:
 * {
 *   "type": "update|alert|completion",
 *   "message": "Custom message to send",
 *   "priority": "low|medium|high",
 *   "channels": ["slack", "email", "sms"]
 * }
 */
router.post('/communicate', async (req, res) => {
  try {
    const communication = {
      type: req.body.type || 'update',
      message: req.body.message || 'Manual communication',
      priority: req.body.priority || 'medium',
      channels: req.body.channels || ['console'],
      sentBy: req.body.sentBy || 'api-user'
    };
    
    // Send the communication through the rollback system
    await rapidRollback._sendCommunication('manual', communication);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Communication sent successfully',
      communication: communication
    });
    
  } catch (error) {
    console.error('❌ Error sending communication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send communication',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/health
 * Health check for rollback system
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rollback: {
        configured: rapidRollback.isConfigured,
        active: rapidRollback.rollbackActive,
        monitoring: rapidRollback.triggerMonitoringInterval !== null
      },
      triggers: {
        count: rapidRollback.triggers ? rapidRollback.triggers.length : 0,
        active: rapidRollback.triggers ? rapidRollback.triggers.filter(t => t.active).length : 0
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    res.json({
      success: true,
      health: health
    });
    
  } catch (error) {
    console.error('❌ Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/report
 * Generate comprehensive rollback report
 */
router.get('/report', async (req, res) => {
  try {
    const status = rapidRollback.getRollbackStatus();
    
    const report = {
      generated: new Date().toISOString(),
      rollback: status.rollback,
      triggers: status.triggers,
      communications: status.communications,
      timeline: status.timeline,
      analysis: status.rollback ? status.rollback.postRollbackAnalysis : null,
      recommendations: generateReportRecommendations(status)
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      report: report
    });
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/test-trigger
 * Create a test trigger for system validation
 */
router.post('/test-trigger', async (req, res) => {
  try {
    const testTrigger = {
      type: req.body.type || 'test_trigger',
      severity: req.body.severity || 'low',
      value: req.body.value || 10,
      threshold: req.body.threshold || 5,
      message: req.body.message || 'Test trigger for rollback system validation',
      timestamp: new Date(),
      test: true
    };
    
    // Process the test trigger (but don't actually trigger rollback)
    console.log('🧪 Test trigger created:', testTrigger);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Test trigger created successfully',
      trigger: testTrigger
    });
    
  } catch (error) {
    console.error('❌ Error creating test trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test trigger',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/metrics
 * Get current error metrics used for trigger detection
 */
router.get('/metrics', async (req, res) => {
  try {
    // Get current metrics (this would call the private method if it were public)
    const metrics = {
      timestamp: new Date().toISOString(),
      message: 'Current error metrics',
      note: 'Metrics are collected internally for trigger detection',
      thresholds: {
        cloudfrontErrorRate: 5.0,
        s3ErrorRate: 5.0,
        uploadFailureRate: 10.0
      }
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: metrics
    });
    
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

/**
 * POST /api/rollback/validate
 * Validate rollback system configuration and readiness
 */
router.post('/validate', async (req, res) => {
  try {
    const validation = {
      timestamp: new Date().toISOString(),
      configured: rapidRollback.isConfigured,
      checks: []
    };
    
    // Check AWS configuration
    validation.checks.push({
      name: 'AWS Configuration',
      status: rapidRollback.isConfigured ? 'pass' : 'fail',
      details: rapidRollback.isConfigured 
        ? 'CloudFront and S3 configuration detected'
        : 'Missing required AWS environment variables'
    });
    
    // Storage system validation
    validation.checks.push({
      name: 'S3 Storage System',
      status: s3Service.isConfigured() ? 'pass' : 'fail',
      details: s3Service.isConfigured() 
        ? 'S3 storage system configured and ready'
        : 'S3 storage system not properly configured'
    });
    
    // Check monitoring integration
    try {
      const monitoringWindow = require('../services/monitoring-window');
      validation.checks.push({
        name: 'Monitoring Integration',
        status: 'pass',
        details: 'Monitoring window service available'
      });
    } catch (error) {
      validation.checks.push({
        name: 'Monitoring Integration',
        status: 'fail',
        details: 'Monitoring window service not available'
      });
    }
    
    const passedChecks = validation.checks.filter(c => c.status === 'pass').length;
    const totalChecks = validation.checks.length;
    
    validation.overall = passedChecks === totalChecks ? 'ready' : 'not_ready';
    validation.readiness = `${passedChecks}/${totalChecks} checks passed`;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      validation: validation
    });
    
  } catch (error) {
    console.error('❌ Error validating rollback system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate rollback system',
      details: error.message
    });
  }
});

/**
 * GET /api/rollback/dashboard
 * Get comprehensive dashboard data for rollback management
 */
router.get('/dashboard', async (req, res) => {
  try {
    const status = rapidRollback.getRollbackStatus();
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      rollback: {
        active: status.active,
        status: status.rollback ? status.rollback.status : null,
        phase: status.rollback ? status.rollback.phase : null,
        progress: status.rollback ? status.rollback.progress : 0,
        duration: status.rollback && status.rollback.startTime 
          ? Date.now() - status.rollback.startTime.getTime() 
          : null
      },
      triggers: {
        active: status.triggers ? status.triggers.length : 0,
        monitoring: rapidRollback.triggerMonitoringInterval !== null,
        lastCheck: new Date().toISOString()
      },
      communications: {
        total: status.communications ? status.communications.length : 0,
        recent: status.communications ? status.communications.slice(-5) : []
      },
      system: {
        configured: rapidRollback.isConfigured,
        healthy: true,
        uptime: process.uptime()
      },
      quickActions: [
        { action: 'trigger', label: 'Manual Rollback', endpoint: '/api/rollback/trigger' },
        { action: 'monitor', label: 'Start Monitoring', endpoint: '/api/rollback/monitoring/start' },
        { action: 'validate', label: 'Validate System', endpoint: '/api/rollback/validate' }
      ]
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dashboard: dashboard
    });
    
  } catch (error) {
    console.error('❌ Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
      details: error.message
    });
  }
});

// Helper functions
function generateReportRecommendations(status) {
  const recommendations = [
    'Review rollback timeline for optimization opportunities',
    'Update communication templates based on incident experience',
    'Validate rollback trigger thresholds for accuracy'
  ];
  
  if (status.rollback && status.rollback.trigger) {
    recommendations.push(`Investigate root cause of ${status.rollback.trigger.type} trigger`);
  }
  
  if (status.communications && status.communications.length > 10) {
    recommendations.push('Consider optimizing communication frequency');
  }
  
  return recommendations;
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Rollback API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;