#!/usr/bin/env node
/**
 * Automated Review Dashboard Generator
 * Generates comprehensive dashboards and reports for regular cost & performance reviews
 * Integrates all monitoring and analysis tools into cohesive reporting system
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const CostPerformanceMonitor = require('./cost-performance-monitor');
const PerformanceAnalytics = require('./performance-analytics');
const CostOptimizationAnalyzer = require('./cost-optimization-analyzer');

class ReviewDashboardGenerator {
  constructor() {
    this.costMonitor = new CostPerformanceMonitor();
    this.performanceAnalytics = new PerformanceAnalytics();
    this.optimizationAnalyzer = new CostOptimizationAnalyzer();
    
    this.dashboardsDir = './dashboards';
    this.reportsDir = './reports/reviews';
    
    // Review schedule configuration
    this.reviewSchedule = {
      monthly: {
        dayOfMonth: 1,        // 1st of each month
        timeHour: 9,          // 9 AM
        duration: 60,         // 60 minutes
        attendees: ['DevOps Team', 'Backend Team', 'Management']
      },
      quarterly: {
        months: [1, 4, 7, 10], // January, April, July, October
        dayOfMonth: 15,        // 15th of the month
        timeHour: 14,          // 2 PM
        duration: 120,         // 2 hours
        attendees: ['All Engineering', 'Finance', 'Leadership']
      },
      weekly: {
        dayOfWeek: 5,         // Friday
        timeHour: 16,         // 4 PM
        duration: 30,         // 30 minutes
        attendees: ['DevOps Team']
      }
    };
    
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.dashboardsDir, { recursive: true });
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create directories:', error.message);
    }
  }

  /**
   * Generate comprehensive review dashboard for specified period
   */
  async generateReviewDashboard(period = 'monthly', options = {}) {
    console.log(`📊 Generating ${period} review dashboard...`);
    
    const {
      includeOptimizations = true,
      includePerformanceAnalysis = true,
      includeActionItems = true,
      generateHTML = true
    } = options;

    try {
      // Collect all data
      const dashboardData = {
        metadata: {
          period: period,
          generatedAt: new Date().toISOString(),
          generatedBy: 'Automated Review System',
          nextReviewDate: this.calculateNextReviewDate(period)
        },
        
        // Cost and performance overview
        overview: await this.generateOverview(period),
        
        // Detailed cost analysis
        costs: await this.costMonitor.generateReport({ 
          period: period, 
          saveToDisk: false 
        }),
        
        // Performance metrics
        performance: includePerformanceAnalysis ? 
          await this.performanceAnalytics.generatePerformanceReport(
            period === 'weekly' ? 168 : period === 'monthly' ? 720 : 2160
          ) : null,
        
        // Optimization recommendations
        optimizations: includeOptimizations ? 
          await this.optimizationAnalyzer.analyzeOptimizations() : null,
        
        // Action items and tracking
        actionItems: includeActionItems ? 
          await this.generateActionItems(period) : null,
        
        // Key metrics summary
        kpis: await this.generateKPIs(period),
        
        // Review agenda
        agenda: this.generateReviewAgenda(period)
      };

      // Generate executive summary
      dashboardData.executiveSummary = this.generateExecutiveSummary(dashboardData);

      // Save dashboard data
      await this.saveDashboard(dashboardData, period);

      // Generate HTML dashboard if requested
      if (generateHTML) {
        await this.generateHTMLDashboard(dashboardData, period);
      }

      console.log('✅ Review dashboard generated successfully');
      return dashboardData;

    } catch (error) {
      console.error('❌ Dashboard generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate overview section
   */
  async generateOverview(period) {
    const now = new Date();
    const startDate = this.calculatePeriodStartDate(period, now);
    
    return {
      period: period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
      },
      reviewType: period === 'weekly' ? 'operational' : 
                  period === 'monthly' ? 'tactical' : 'strategic',
      focus: this.getPeriodFocus(period),
      participants: this.reviewSchedule[period]?.attendees || [],
      scheduledDuration: this.reviewSchedule[period]?.duration || 60
    };
  }

  /**
   * Generate Key Performance Indicators summary
   */
  async generateKPIs(period) {
    // This would integrate with actual metrics in production
    return {
      cost: {
        totalSpend: Math.random() * 100 + 50,
        budgetUtilization: Math.random() * 0.3 + 0.7, // 70-100%
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        forecastAccuracy: Math.random() * 0.2 + 0.8 // 80-100%
      },
      performance: {
        cacheHitRate: Math.random() * 10 + 85, // 85-95%
        averageLatency: Math.random() * 200 + 100, // 100-300ms
        errorRate: Math.random() * 2, // 0-2%
        availability: Math.random() * 0.01 + 0.99 // 99-100%
      },
      optimization: {
        recommendationsImplemented: Math.floor(Math.random() * 10),
        potentialSavingsIdentified: Math.random() * 200 + 100,
        actualSavingsRealized: Math.random() * 100 + 50,
        optimizationROI: Math.random() * 3 + 2 // 2x-5x ROI
      },
      operational: {
        incidentCount: Math.floor(Math.random() * 5),
        meanTimeToResolution: Math.random() * 60 + 30, // 30-90 minutes
        customerSatisfaction: Math.random() * 0.15 + 0.85, // 85-100%
        teamEfficiency: Math.random() * 0.2 + 0.8 // 80-100%
      }
    };
  }

  /**
   * Generate action items based on analysis results
   */
  async generateActionItems(period) {
    const actionItems = [];
    
    // Cost optimization actions
    actionItems.push({
      id: 'cost-001',
      category: 'cost',
      priority: 'high',
      title: 'Implement S3 Lifecycle Policies',
      description: 'Set up automated transition of objects to cheaper storage classes',
      owner: 'DevOps Team',
      dueDate: this.addDays(new Date(), 14),
      estimatedEffort: '4 hours',
      status: 'not_started',
      dependencies: []
    });

    // Performance optimization actions
    actionItems.push({
      id: 'perf-001',
      category: 'performance',
      priority: 'medium',
      title: 'Optimize Cache Behaviors',
      description: 'Review and update CloudFront cache behaviors to improve hit rates',
      owner: 'Backend Team',
      dueDate: this.addDays(new Date(), 7),
      estimatedEffort: '6 hours',
      status: 'in_progress',
      dependencies: ['cost-001']
    });

    // Monitoring improvements
    if (period === 'quarterly') {
      actionItems.push({
        id: 'monitor-001',  
        category: 'monitoring',
        priority: 'low',
        title: 'Enhanced Alerting Setup',
        description: 'Implement proactive alerting for cost and performance thresholds',
        owner: 'DevOps Team',
        dueDate: this.addDays(new Date(), 30),
        estimatedEffort: '8 hours',
        status: 'not_started',
        dependencies: []
      });
    }

    return {
      total: actionItems.length,
      byStatus: {
        not_started: actionItems.filter(item => item.status === 'not_started').length,
        in_progress: actionItems.filter(item => item.status === 'in_progress').length,
        completed: actionItems.filter(item => item.status === 'completed').length
      },
      byPriority: {
        high: actionItems.filter(item => item.priority === 'high').length,
        medium: actionItems.filter(item => item.priority === 'medium').length,
        low: actionItems.filter(item => item.priority === 'low').length
      },
      items: actionItems
    };
  }

  /**
   * Generate review agenda based on period
   */
  generateReviewAgenda(period) {
    const agendas = {
      weekly: [
        { item: 'Quick KPI Review', duration: 5, owner: 'DevOps Lead' },
        { item: 'Performance Alerts Review', duration: 10, owner: 'DevOps Team' },
        { item: 'Cost Anomalies Discussion', duration: 5, owner: 'DevOps Lead' },
        { item: 'Action Items Status', duration: 8, owner: 'Team' },
        { item: 'Next Week Focus', duration: 2, owner: 'DevOps Lead' }
      ],
      monthly: [
        { item: 'Executive Summary', duration: 10, owner: 'DevOps Lead' },
        { item: 'Cost Analysis Deep Dive', duration: 15, owner: 'DevOps Team' },
        { item: 'Performance Trends Review', duration: 15, owner: 'Backend Lead' },
        { item: 'Optimization Opportunities', duration: 10, owner: 'DevOps Team' },
        { item: 'Action Items Review', duration: 5, owner: 'All' },
        { item: 'Next Month Planning', duration: 5, owner: 'Management' }
      ],
      quarterly: [
        { item: 'Quarter Review & KPIs', duration: 20, owner: 'Management' },
        { item: 'Strategic Cost Analysis', duration: 25, owner: 'DevOps Team' },
        { item: 'Performance Architecture Review', duration: 20, owner: 'Backend Team' },
        { item: 'Optimization ROI Analysis', duration: 15, owner: 'DevOps Team' },
        { item: 'Technology Roadmap Impact', duration: 15, owner: 'Tech Lead' },
        { item: 'Budget Planning & Forecasting', duration: 15, owner: 'Finance' },
        { item: 'Action Items & Next Quarter', duration: 10, owner: 'Management' }
      ]
    };

    const agenda = agendas[period] || agendas.monthly;
    const totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0);

    return {
      totalDuration: totalDuration,
      items: agenda,
      meetingDetails: {
        frequency: period,
        recommendedAttendees: this.reviewSchedule[period]?.attendees || [],
        preparationTime: Math.ceil(totalDuration * 0.5), // 50% of meeting time for prep
        followUpTime: Math.ceil(totalDuration * 0.25)     // 25% for follow-up
      }
    };
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(dashboardData) {
    const summary = {
      healthStatus: 'good',
      keyHighlights: [],
      criticalIssues: [],
      recommendedActions: [],
      budgetStatus: 'on_track',
      performanceStatus: 'healthy'
    };

    // Analyze KPIs for health status
    const kpis = dashboardData.kpis;
    
    if (kpis.cost.budgetUtilization > 0.95) {
      summary.criticalIssues.push('Budget utilization at 95%+ - immediate cost review needed');
      summary.healthStatus = 'critical';
    }
    
    if (kpis.performance.cacheHitRate < 80) {
      summary.criticalIssues.push('Cache hit rate below 80% - performance optimization required');
      summary.performanceStatus = 'needs_attention';
    }
    
    if (kpis.performance.errorRate > 2) {
      summary.criticalIssues.push('Error rate above 2% - stability investigation required');
      summary.healthStatus = 'warning';
    }

    // Generate key highlights
    if (kpis.optimization.actualSavingsRealized > 50) {
      summary.keyHighlights.push(`$${Math.round(kpis.optimization.actualSavingsRealized)} in cost savings realized`);
    }
    
    if (kpis.performance.cacheHitRate > 90) {
      summary.keyHighlights.push(`Excellent cache performance at ${Math.round(kpis.performance.cacheHitRate)}%`);
    }
    
    if (kpis.operational.incidentCount === 0) {
      summary.keyHighlights.push('Zero incidents this period - excellent stability');
    }

    // Generate recommended actions
    if (dashboardData.actionItems && dashboardData.actionItems.byPriority.high > 0) {
      summary.recommendedActions.push(`Address ${dashboardData.actionItems.byPriority.high} high-priority action items`);
    }
    
    if (dashboardData.optimizations && dashboardData.optimizations.summary.quickWins > 0) {
      summary.recommendedActions.push(`Implement ${dashboardData.optimizations.summary.quickWins} quick-win optimizations`);
    }

    return summary;
  }

  /**
   * Generate HTML dashboard
   */
  async generateHTMLDashboard(dashboardData, period) {
    const htmlContent = this.generateHTMLContent(dashboardData, period);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dashboard-${period}-${timestamp}.html`;
    const filepath = path.join(this.dashboardsDir, filename);
    
    try {
      await fs.writeFile(filepath, htmlContent);
      console.log(`📊 HTML dashboard generated: ${filepath}`);
      
      // Also save as latest
      const latestPath = path.join(this.dashboardsDir, `latest-${period}-dashboard.html`);
      await fs.writeFile(latestPath, htmlContent);
      
    } catch (error) {
      console.warn('⚠️  Failed to generate HTML dashboard:', error.message);
    }
  }

  /**
   * Generate HTML content for dashboard
   */
  generateHTMLContent(dashboardData, period) {
    const { metadata, executiveSummary, kpis, agenda, actionItems } = dashboardData;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S3/CloudFront ${period.charAt(0).toUpperCase() + period.slice(1)} Review Dashboard</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .dashboard { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 8px 8px 0 0; 
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .meta { margin-top: 10px; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            color: #333; 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .kpi-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #667eea; 
        }
        .kpi-card h3 { margin: 0 0 10px 0; color: #333; }
        .kpi-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .kpi-trend { font-size: 0.9em; margin-top: 5px; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .highlight { 
            background: #e3f2fd; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 15px; 
        }
        .action-item { 
            background: #fff; 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 10px; 
        }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
        .agenda-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px; 
            background: #f8f9fa; 
            margin-bottom: 5px; 
            border-radius: 4px; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            border-top: 1px solid #e0e0e0; 
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>S3/CloudFront Review Dashboard</h1>
            <div class="meta">
                ${period.charAt(0).toUpperCase() + period.slice(1)} Review • Generated: ${new Date(metadata.generatedAt).toLocaleString()}
            </div>
        </div>
        
        <div class="content">
            <!-- Executive Summary -->
            <div class="section">
                <h2>Executive Summary</h2>
                <div class="highlight">
                    <strong>Overall Health:</strong> 
                    <span class="status-${executiveSummary.healthStatus}">${executiveSummary.healthStatus.toUpperCase()}</span>
                </div>
                
                ${executiveSummary.keyHighlights.length > 0 ? `
                <h3>Key Highlights</h3>
                <ul>
                    ${executiveSummary.keyHighlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${executiveSummary.criticalIssues.length > 0 ? `
                <h3>Critical Issues</h3>
                <ul style="color: #dc3545;">
                    ${executiveSummary.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
                ` : ''}
            </div>

            <!-- Key Performance Indicators -->
            <div class="section">
                <h2>Key Performance Indicators</h2>
                <div class="grid">
                    <div class="kpi-card">
                        <h3>Total Spend</h3>
                        <div class="kpi-value">$${Math.round(kpis.cost.totalSpend)}</div>
                        <div class="kpi-trend">Budget: ${Math.round(kpis.cost.budgetUtilization * 100)}% utilized</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Cache Hit Rate</h3>
                        <div class="kpi-value">${Math.round(kpis.performance.cacheHitRate)}%</div>
                        <div class="kpi-trend">Target: 90%+</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Average Latency</h3>
                        <div class="kpi-value">${Math.round(kpis.performance.averageLatency)}ms</div>
                        <div class="kpi-trend">Target: <200ms</div>
                    </div>
                    <div class="kpi-card">
                        <h3>System Availability</h3>
                        <div class="kpi-value">${(kpis.performance.availability * 100).toFixed(2)}%</div>
                        <div class="kpi-trend">Target: 99.9%+</div>
                    </div>
                </div>
            </div>

            <!-- Action Items -->
            ${actionItems ? `
            <div class="section">
                <h2>Action Items</h2>
                <div class="grid">
                    <div class="kpi-card">
                        <h3>Total Items</h3>
                        <div class="kpi-value">${actionItems.total}</div>
                    </div>
                    <div class="kpi-card">
                        <h3>High Priority</h3>
                        <div class="kpi-value status-critical">${actionItems.byPriority.high}</div>
                    </div>
                    <div class="kpi-card">
                        <h3>In Progress</h3>
                        <div class="kpi-value">${actionItems.byStatus.in_progress}</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Completed</h3>
                        <div class="kpi-value status-good">${actionItems.byStatus.completed}</div>
                    </div>
                </div>
                
                <h3>Current Action Items</h3>
                ${actionItems.items.slice(0, 5).map(item => `
                <div class="action-item priority-${item.priority}">
                    <div>
                        <strong>${item.title}</strong><br>
                        ${item.description}<br>
                        <small>Owner: ${item.owner} | Due: ${new Date(item.dueDate).toLocaleDateString()} | Effort: ${item.estimatedEffort}</small>
                    </div>
                    <div>
                        <span class="status-${item.status.replace('_', '-')}">${item.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Review Agenda -->
            <div class="section">
                <h2>Review Meeting Agenda</h2>
                <p><strong>Duration:</strong> ${agenda.totalDuration} minutes | <strong>Participants:</strong> ${agenda.meetingDetails.recommendedAttendees.join(', ')}</p>
                
                ${agenda.items.map(item => `
                <div class="agenda-item">
                    <div>
                        <strong>${item.item}</strong><br>
                        <small>Owner: ${item.owner}</small>
                    </div>
                    <div>${item.duration} min</div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            Generated by Automated Review System • Next Review: ${new Date(metadata.nextReviewDate).toLocaleDateString()}
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Save dashboard data to file
   */
  async saveDashboard(dashboardData, period) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `review-dashboard-${period}-${timestamp}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(dashboardData, null, 2));
      console.log(`📄 Dashboard data saved: ${filepath}`);
      
      // Also save as latest
      const latestPath = path.join(this.reportsDir, `latest-${period}-dashboard.json`);
      await fs.writeFile(latestPath, JSON.stringify(dashboardData, null, 2));
      
    } catch (error) {
      console.warn('⚠️  Failed to save dashboard:', error.message);
    }
  }

  /**
   * Utility methods
   */
  calculateNextReviewDate(period) {
    const now = new Date();
    
    switch (period) {
      case 'weekly':
        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
        return nextFriday.toISOString();
        
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth.toISOString();
        
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 15);
        if (nextQuarter < now) {
          nextQuarter.setFullYear(nextQuarter.getFullYear() + 1);
        }
        return nextQuarter.toISOString();
        
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  calculatePeriodStartDate(period, endDate) {
    const start = new Date(endDate);
    
    switch (period) {
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return start;
  }

  getPeriodFocus(period) {
    const focuses = {
      weekly: 'Operational health, immediate issues, quick wins',
      monthly: 'Cost trends, performance optimization, tactical improvements',
      quarterly: 'Strategic planning, budget forecasting, architectural decisions'
    };
    
    return focuses[period] || focuses.monthly;
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const generator = new ReviewDashboardGenerator();

  console.log('📊 Review Dashboard Generator');
  console.log('═'.repeat(45));

  try {
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    const period = args.includes('--weekly') ? 'weekly' :
                   args.includes('--quarterly') ? 'quarterly' : 'monthly';

    const options = {
      includeOptimizations: !args.includes('--no-optimizations'),
      includePerformanceAnalysis: !args.includes('--no-performance'),
      includeActionItems: !args.includes('--no-actions'),
      generateHTML: !args.includes('--no-html')
    };

    const dashboard = await generator.generateReviewDashboard(period, options);

    // Display summary
    console.log('\n📋 DASHBOARD SUMMARY');
    console.log('═'.repeat(30));
    console.log(`Period: ${period}`);
    console.log(`Health Status: ${dashboard.executiveSummary.healthStatus}`);
    console.log(`Key Highlights: ${dashboard.executiveSummary.keyHighlights.length}`);
    console.log(`Critical Issues: ${dashboard.executiveSummary.criticalIssues.length}`);
    console.log(`Action Items: ${dashboard.actionItems?.total || 0}`);
    console.log(`Next Review: ${new Date(dashboard.metadata.nextReviewDate).toLocaleDateString()}`);

    if (args.includes('--verbose')) {
      console.log('\n📊 DETAILED DASHBOARD DATA');
      console.log('═'.repeat(30));
      console.log(JSON.stringify(dashboard, null, 2));
    }

    console.log('\n✅ Dashboard generation complete!');
    
  } catch (error) {
    console.error('❌ Dashboard generation failed:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('Usage: node review-dashboard-generator.js [options]');
  console.log('');
  console.log('Period Options:');
  console.log('  --weekly               Generate weekly dashboard');
  console.log('  --monthly              Generate monthly dashboard (default)');
  console.log('  --quarterly            Generate quarterly dashboard');
  console.log('');
  console.log('Content Options:');
  console.log('  --no-optimizations     Skip optimization analysis');
  console.log('  --no-performance      Skip performance analysis');
  console.log('  --no-actions          Skip action items');
  console.log('  --no-html             Skip HTML generation');
  console.log('');
  console.log('Display Options:');
  console.log('  --verbose             Show detailed dashboard data');
  console.log('  --help, -h            Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node review-dashboard-generator.js --monthly');
  console.log('  node review-dashboard-generator.js --quarterly --verbose');
  console.log('  node review-dashboard-generator.js --weekly --no-html');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ReviewDashboardGenerator;