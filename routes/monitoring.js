/**
 * Monitoring Window API Routes
 * 
 * RESTful API endpoints for managing post-release monitoring window.
 * Provides comprehensive control over monitoring, alerting, incidents, and reporting.
 */

const express = require('express');
const router = express.Router();
const monitoringWindow = require('../services/monitoring-window');

// Middleware for API logging
router.use((req, res, next) => {
  console.log(`📡 Monitoring API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/**
 * GET /api/monitoring/status
 * Get current monitoring window status and metrics
 */
router.get('/status', async (req, res) => {
  try {
    const status = await monitoringWindow.getMonitoringStatus();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: status
    });
    
  } catch (error) {
    console.error('❌ Error getting monitoring status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/start
 * Start a new monitoring window
 * 
 * Body:
 * {
 *   "duration": 48,                    // Hours (default: 48)
 *   "primaryResponder": "user@email",  // Primary on-call person
 *   "secondaryResponder": "user2@email", // Secondary on-call person
 *   "checkInInterval": 6               // Hours between check-ins (default: 6)
 * }
 */
router.post('/start', async (req, res) => {
  try {
    const options = {
      duration: req.body.duration || 48,
      primaryResponder: req.body.primaryResponder,
      secondaryResponder: req.body.secondaryResponder,
      checkInInterval: req.body.checkInInterval || 6
    };
    
    const result = await monitoringWindow.startMonitoringWindow(options);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Monitoring window started successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error starting monitoring window:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring window',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/stop
 * Stop the current monitoring window
 * 
 * Body:
 * {
 *   "reason": "manual|completed|incident"  // Reason for stopping
 * }
 */
router.post('/stop', async (req, res) => {
  try {
    const reason = req.body.reason || 'manual';
    const result = await monitoringWindow.stopMonitoringWindow(reason);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Monitoring window stopped successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error stopping monitoring window:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring window',
      details: error.message
    });
  }
});

/**
 * GET /api/monitoring/dashboard
 * Get comprehensive monitoring dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const status = await monitoringWindow.getMonitoringStatus();
    
    if (!status.active) {
      return res.json({
        success: true,
        active: false,
        message: 'No active monitoring window',
        timestamp: new Date().toISOString()
      });
    }
    
    // Enhance dashboard data
    const dashboardData = {
      ...status,
      summary: {
        windowProgress: status.window.progress,
        healthScore: calculateHealthScore(status.metrics),
        criticalAlerts: status.alerts.active,
        openIncidents: status.incidents.total,
        estimatedCompletion: calculateEstimatedCompletion(status.window)
      },
      quickActions: [
        { action: 'pause', label: 'Pause Monitoring', endpoint: '/api/monitoring/pause' },
        { action: 'stop', label: 'Stop Monitoring', endpoint: '/api/monitoring/stop' },
        { action: 'escalate', label: 'Escalate Issue', endpoint: '/api/monitoring/escalate' }
      ]
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dashboard: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      details: error.message
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get current metrics in real-time
 */
router.get('/metrics', async (req, res) => {
  try {
    const status = await monitoringWindow.getMonitoringStatus();
    
    if (!status.active) {
      return res.status(404).json({
        success: false,
        error: 'No active monitoring window'
      });
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: status.metrics,
      thresholds: status.thresholds
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
 * GET /api/monitoring/incidents
 * Get incidents and their status
 */
router.get('/incidents', async (req, res) => {
  try {
    const status = await monitoringWindow.getMonitoringStatus();
    
    if (!status.active) {
      return res.status(404).json({
        success: false,
        error: 'No active monitoring window'
      });
    }
    
    // Get full incident data from monitoring service
    const incidents = monitoringWindow.incidents || [];
    const alerts = monitoringWindow.alerts || [];
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      incidents: incidents,
      alerts: alerts,
      summary: {
        totalIncidents: incidents.length,
        openIncidents: incidents.filter(i => i.status === 'open').length,
        resolvedIncidents: incidents.filter(i => i.status === 'resolved').length,
        activeAlerts: alerts.filter(a => a.status === 'active').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incidents',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/incidents/:id/resolve
 * Resolve a specific incident
 */
router.post('/incidents/:id/resolve', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const resolution = req.body.resolution || 'Manually resolved';
    const resolvedBy = req.body.resolvedBy || 'Unknown';
    
    // Find and update incident
    const incidents = monitoringWindow.incidents || [];
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.resolution = resolution;
    incident.resolvedBy = resolvedBy;
    
    // Add to timeline
    incident.timeline.push({
      timestamp: new Date(),
      action: 'incident_resolved',
      details: resolution,
      actor: resolvedBy
    });
    
    console.log(`✅ Incident resolved: ${incidentId} by ${resolvedBy}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Incident resolved successfully',
      incident: incident
    });
    
  } catch (error) {
    console.error('❌ Error resolving incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve incident',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/escalate
 * Escalate current issues to management
 */
router.post('/escalate', async (req, res) => {
  try {
    const escalation = {
      timestamp: new Date(),
      reason: req.body.reason || 'Manual escalation',
      escalatedBy: req.body.escalatedBy || 'Unknown',
      priority: req.body.priority || 'high',
      context: req.body.context || 'No additional context provided'
    };
    
    // Get current status for escalation context
    const status = await monitoringWindow.getMonitoringStatus();
    
    // Send escalation notification
    await monitoringWindow._sendNotification('escalation', {
      escalation: escalation,
      currentStatus: status
    });
    
    console.log(`🚨 Issue escalated: ${escalation.reason} by ${escalation.escalatedBy}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Issue escalated successfully',
      escalation: escalation
    });
    
  } catch (error) {
    console.error('❌ Error escalating issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate issue',
      details: error.message
    });
  }
});

/**
 * GET /api/monitoring/health
 * Health check endpoint for monitoring system itself
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      monitoring: {
        configured: monitoringWindow.isConfigured,
        active: monitoringWindow.monitoringActive,
        windowId: monitoringWindow.currentWindow ? monitoringWindow.currentWindow.id : null
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
 * POST /api/monitoring/pause
 * Pause monitoring temporarily
 */
router.post('/pause', async (req, res) => {
  try {
    if (!monitoringWindow.monitoringActive) {
      return res.status(400).json({
        success: false,
        error: 'No active monitoring window to pause'
      });
    }
    
    // Stop monitoring tasks temporarily
    monitoringWindow._stopMonitoringTasks();
    
    const pauseInfo = {
      pausedAt: new Date(),
      pausedBy: req.body.pausedBy || 'Unknown',
      reason: req.body.reason || 'Manual pause',
      windowId: monitoringWindow.currentWindow.id
    };
    
    console.log(`⏸️  Monitoring paused: ${pauseInfo.reason} by ${pauseInfo.pausedBy}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Monitoring paused successfully',
      pauseInfo: pauseInfo
    });
    
  } catch (error) {
    console.error('❌ Error pausing monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause monitoring',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/resume
 * Resume paused monitoring
 */
router.post('/resume', async (req, res) => {
  try {
    if (!monitoringWindow.currentWindow) {
      return res.status(400).json({
        success: false,
        error: 'No monitoring window to resume'
      });
    }
    
    // Restart monitoring tasks
    await monitoringWindow._startMonitoringTasks();
    
    const resumeInfo = {
      resumedAt: new Date(),
      resumedBy: req.body.resumedBy || 'Unknown',
      windowId: monitoringWindow.currentWindow.id
    };
    
    console.log(`▶️  Monitoring resumed by ${resumeInfo.resumedBy}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Monitoring resumed successfully',
      resumeInfo: resumeInfo
    });
    
  } catch (error) {
    console.error('❌ Error resuming monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume monitoring',
      details: error.message
    });
  }
});

/**
 * GET /api/monitoring/report
 * Generate monitoring window report
 */
router.get('/report', async (req, res) => {
  try {
    const status = await monitoringWindow.getMonitoringStatus();
    
    if (!status.active && !monitoringWindow.currentWindow) {
      return res.status(404).json({
        success: false,
        error: 'No monitoring window data available'
      });
    }
    
    // Generate comprehensive report
    const report = await monitoringWindow._generateFinalReport();
    
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
 * GET /api/monitoring/logs
 * Get monitoring logs and audit trail
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const level = req.query.level || 'all'; // all, error, warn, info
    
    // Get logs from monitoring service
    const logs = {
      incidents: monitoringWindow.incidents || [],
      alerts: monitoringWindow.alerts || [],
      notifications: monitoringWindow.notifications || []
    };
    
    // Apply filtering
    let allLogs = [
      ...logs.incidents.map(i => ({ ...i, type: 'incident' })),
      ...logs.alerts.map(a => ({ ...a, type: 'alert' })),
      ...logs.notifications.map(n => ({ ...n, type: 'notification' }))
    ];
    
    // Sort by timestamp
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const paginatedLogs = allLogs.slice(offset, offset + limit);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      logs: paginatedLogs,
      pagination: {
        total: allLogs.length,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < allLogs.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      details: error.message
    });
  }
});

/**
 * POST /api/monitoring/test-alert
 * Trigger a test alert for system validation
 */
router.post('/test-alert', async (req, res) => {
  try {
    const testAlert = {
      id: `test-alert-${Date.now()}`,
      type: 'test_alert',
      severity: req.body.severity || 'low',
      message: req.body.message || 'This is a test alert',
      timestamp: new Date(),
      status: 'active',
      test: true
    };
    
    // Process the test alert
    await monitoringWindow._processAlert(testAlert);
    
    console.log(`🧪 Test alert triggered: ${testAlert.id}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Test alert triggered successfully',
      alert: testAlert
    });
    
  } catch (error) {
    console.error('❌ Error triggering test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger test alert',
      details: error.message
    });
  }
});

// Helper functions
function calculateHealthScore(metrics) {
  if (!metrics) return 0;
  
  let score = 100;
  
  if (metrics.cloudfront && metrics.cloudfront.errorRate > 1.0) {
    score -= 20;
  }
  
  if (metrics.s3 && metrics.s3.errorRate > 0.5) {
    score -= 20;
  }
  
  if (metrics.cloudfront && metrics.cloudfront.cacheHitRate < 85) {
    score -= 10;
  }
  
  return Math.max(0, score);
}

function calculateEstimatedCompletion(window) {
  if (!window) return null;
  
  const remainingMs = window.remainingHours * 60 * 60 * 1000;
  return new Date(Date.now() + remainingMs);
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Monitoring API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;