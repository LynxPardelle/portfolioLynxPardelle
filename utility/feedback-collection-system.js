#!/usr/bin/env node
/**
 * Feedback Collection System
 * 
 * Automated system to collect, analyze, and process feedback from all
 * operational processes, stakeholders, and system users to drive
 * continuous improvement across the entire framework.
 * 
 * Features:
 * - Multi-channel feedback collection
 * - Automated sentiment analysis
 * - Categorization and prioritization
 * - Integration with improvement analytics
 * - Real-time feedback processing
 * - Stakeholder engagement tracking
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class FeedbackCollectionSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Collection Configuration
            collection: {
                channels: ['web', 'api', 'email', 'slack', 'automated'],
                retention: '365d',
                anonymization: true,
                realTimeProcessing: true
            },
            
            // Storage Configuration
            storage: {
                feedbackDir: './logs/feedback/',
                rawFeedback: 'raw-feedback.jsonl',
                processedFeedback: 'processed-feedback.json',
                analytics: 'feedback-analytics.json',
                reports: 'feedback-reports/'
            },
            
            // Processing Configuration
            processing: {
                batchSize: 50,
                processingInterval: 300000, // 5 minutes
                sentimentThreshold: 0.7,
                priorityScoring: true,
                autoResponders: true
            },
            
            // Categories for feedback classification
            categories: {
                automation: ['automation', 'tools', 'workflow', 'efficiency'],
                runbooks: ['runbook', 'procedure', 'documentation', 'execution'],
                training: ['training', 'learning', 'knowledge', 'skill'],
                performance: ['performance', 'cost', 'optimization', 'review'],
                system: ['system', 'technical', 'bug', 'feature'],
                process: ['process', 'improvement', 'suggestion', 'enhancement']
            },
            
            // Notification settings
            notifications: {
                criticalFeedback: true,
                dailySummary: true,
                weeklyReport: true,
                stakeholderAlerts: true
            },
            
            ...options
        };
        
        this.feedbackStore = new Map();
        this.processingQueue = [];
        this.analytics = {
            totalFeedback: 0,
            sentimentDistribution: {},
            categoryDistribution: {},
            stakeholderEngagement: {},
            trends: {}
        };
        
        this.stakeholders = new Map();
        this.autoResponders = new Map();
        
        this._initializeSystem();
    }
    
    /**
     * Initialize the feedback collection system
     */
    async _initializeSystem() {
        try {
            // Create storage directories
            await fs.mkdir(this.config.storage.feedbackDir, { recursive: true });
            await fs.mkdir(path.join(this.config.storage.feedbackDir, this.config.storage.reports), { recursive: true });
            
            // Initialize feedback channels
            await this._initializeFeedbackChannels();
            
            // Set up processing pipeline
            this._setupProcessingPipeline();
            
            // Initialize stakeholder registry
            await this._initializeStakeholderRegistry();
            
            // Set up auto-responders
            this._setupAutoResponders();
            
            // Load existing feedback
            await this._loadExistingFeedback();
            
            this.emit('system-initialized', {
                timestamp: new Date().toISOString(),
                channels: this.config.collection.channels.length,
                stakeholders: this.stakeholders.size
            });
            
            console.log('✅ Feedback Collection System initialized');
            
        } catch (error) {
            this.emit('system-error', { error: error.message, stack: error.stack });
            throw error;
        }
    }
    
    /**
     * Initialize feedback collection channels
     */
    async _initializeFeedbackChannels() {
        const channels = {
            web: this._initializeWebChannel.bind(this),
            api: this._initializeApiChannel.bind(this),
            email: this._initializeEmailChannel.bind(this),
            slack: this._initializeSlackChannel.bind(this),
            automated: this._initializeAutomatedChannel.bind(this)
        };
        
        this.feedbackChannels = {};
        
        for (const [channel, initializer] of Object.entries(channels)) {
            if (this.config.collection.channels.includes(channel)) {
                this.feedbackChannels[channel] = await initializer();
            }
        }
        
        console.log(`📡 Initialized ${Object.keys(this.feedbackChannels).length} feedback channels`);
    }
    
    /**
     * Initialize web-based feedback channel
     */
    async _initializeWebChannel() {
        return {
            type: 'web',
            endpoint: '/api/feedback',
            methods: ['POST'],
            authentication: false,
            rateLimit: '10/min',
            validation: {
                required: ['category', 'content'],
                optional: ['rating', 'stakeholder', 'context']
            }
        };
    }
    
    /**
     * Initialize API-based feedback channel
     */
    async _initializeApiChannel() {
        return {
            type: 'api',
            endpoint: '/api/v1/feedback',
            methods: ['POST', 'PUT'],
            authentication: true,
            rateLimit: '50/min',
            validation: {
                required: ['source', 'category', 'content'],
                optional: ['priority', 'metadata', 'stakeholder']
            }
        };
    }
    
    /**
     * Initialize email-based feedback channel
     */
    async _initializeEmailChannel() {
        return {
            type: 'email',
            address: 'feedback@lynxpardelle.com',
            parser: 'structured',
            autoAck: true,
            classification: 'automatic'
        };
    }
    
    /**
     * Initialize Slack-based feedback channel
     */
    async _initializeSlackChannel() {
        return {
            type: 'slack',
            webhook: process.env.SLACK_FEEDBACK_WEBHOOK,
            commands: ['/feedback', '/suggestion', '/issue'],
            channels: ['#operations', '#feedback', '#improvements'],
            botResponses: true
        };
    }
    
    /**
     * Initialize automated feedback channel
     */
    async _initializeAutomatedChannel() {
        return {
            type: 'automated',
            sources: [
                'automation-tools',
                'runbook-execution',
                'training-completion',
                'performance-monitoring'
            ],
            triggers: [
                'task-completion',
                'error-occurrence',
                'performance-threshold',
                'user-interaction'
            ]
        };
    }
    
    /**
     * Set up feedback processing pipeline
     */
    _setupProcessingPipeline() {
        // Real-time processing
        if (this.config.processing.realTimeProcessing) {
            this.on('feedback-received', this._processFeedbackRealTime.bind(this));
        }
        
        // Batch processing
        this.processingInterval = setInterval(() => {
            this._processBatchFeedback().catch(console.error);
        }, this.config.processing.processingInterval);
        
        // Analytics generation
        this.analyticsInterval = setInterval(() => {
            this._generateAnalytics().catch(console.error);
        }, this.config.processing.processingInterval * 2);
        
        console.log('⚙️ Feedback processing pipeline configured');
    }
    
    /**
     * Initialize stakeholder registry
     */
    async _initializeStakeholderRegistry() {
        const stakeholders = [
            {
                id: 'operations-team',
                name: 'Operations Team',
                role: 'operator',
                interests: ['automation', 'runbooks', 'performance'],
                contactMethod: 'slack',
                engagement: 'high'
            },
            {
                id: 'development-team',
                name: 'Development Team',
                role: 'developer',
                interests: ['system', 'performance', 'automation'],
                contactMethod: 'email',
                engagement: 'medium'
            },
            {
                id: 'management',
                name: 'Management',
                role: 'stakeholder',
                interests: ['cost', 'performance', 'strategic'],
                contactMethod: 'email',
                engagement: 'low'
            },
            {
                id: 'end-users',
                name: 'End Users',
                role: 'user',
                interests: ['system', 'performance', 'features'],
                contactMethod: 'web',
                engagement: 'variable'
            }
        ];
        
        stakeholders.forEach(stakeholder => {
            this.stakeholders.set(stakeholder.id, {
                ...stakeholder,
                feedbackCount: 0,
                lastFeedback: null,
                satisfactionScore: null,
                engagementTrend: 'stable'
            });
        });
        
        console.log(`👥 Stakeholder registry initialized with ${this.stakeholders.size} stakeholders`);
    }
    
    /**
     * Set up automated response system
     */
    _setupAutoResponders() {
        const responders = [
            {
                trigger: 'high-priority-feedback',
                condition: (feedback) => feedback.priority === 'high',
                response: 'Thank you for the urgent feedback. We will review this within 4 hours.',
                action: 'notify-team'
            },
            {
                trigger: 'negative-sentiment',
                condition: (feedback) => feedback.sentiment && feedback.sentiment.score < -0.5,
                response: 'We appreciate your feedback and take concerns seriously. A team member will follow up.',
                action: 'escalate'
            },
            {
                trigger: 'training-feedback',
                condition: (feedback) => feedback.category === 'training',
                response: 'Thank you for the training feedback. This helps us improve our programs.',
                action: 'route-to-training-team'
            },
            {
                trigger: 'automation-suggestion',
                condition: (feedback) => feedback.category === 'automation' && feedback.type === 'suggestion',
                response: 'Great automation suggestion! We will evaluate this for our next sprint.',
                action: 'add-to-backlog'
            }
        ];
        
        responders.forEach(responder => {
            this.autoResponders.set(responder.trigger, responder);
        });
        
        console.log(`🤖 Auto-responders configured: ${this.autoResponders.size} responders`);
    }
    
    /**
     * Load existing feedback from storage
     */
    async _loadExistingFeedback() {
        try {
            const processedPath = path.join(
                this.config.storage.feedbackDir,
                this.config.storage.processedFeedback
            );
            
            const data = await fs.readFile(processedPath, 'utf8');
            const existingFeedback = JSON.parse(data);
            
            existingFeedback.forEach(feedback => {
                this.feedbackStore.set(feedback.id, feedback);
            });
            
            this.analytics.totalFeedback = this.feedbackStore.size;
            
            console.log(`📂 Loaded ${this.feedbackStore.size} existing feedback items`);
            
        } catch (error) {
            // No existing feedback - starting fresh
            console.log('📂 No existing feedback found - starting fresh');
        }
    }
    
    /**
     * Collect feedback from any source
     */
    async collectFeedback(feedbackData) {
        try {
            // Generate unique ID
            const feedbackId = crypto.randomUUID();
            
            // Normalize feedback structure
            const normalizedFeedback = this._normalizeFeedback(feedbackData, feedbackId);
            
            // Store raw feedback
            await this._storeRawFeedback(normalizedFeedback);
            
            // Add to processing queue
            this.processingQueue.push(normalizedFeedback);
            
            // Emit event for real-time processing
            this.emit('feedback-received', normalizedFeedback);
            
            console.log(`📝 Feedback collected: ${feedbackId} (${normalizedFeedback.category})`);
            
            return {
                id: feedbackId,
                status: 'received',
                timestamp: normalizedFeedback.timestamp
            };
            
        } catch (error) {
            this.emit('collection-error', { error: error.message, feedbackData });
            throw error;
        }
    }
    
    /**
     * Normalize feedback from different sources
     */
    _normalizeFeedback(feedbackData, id) {
        const normalized = {
            id,
            timestamp: new Date().toISOString(),
            source: feedbackData.source || 'unknown',
            channel: feedbackData.channel || 'api',
            
            // Content
            content: feedbackData.content || feedbackData.message || feedbackData.text,
            category: this._categorizeFeedback(feedbackData),
            type: feedbackData.type || 'general',
            
            // Metadata
            stakeholder: feedbackData.stakeholder || 'anonymous',
            context: feedbackData.context || {},
            priority: feedbackData.priority || 'medium',
            
            // Optional fields
            rating: feedbackData.rating || null,
            metadata: feedbackData.metadata || {},
            
            // Processing status
            processed: false,
            sentiment: null,
            actions: []
        };
        
        return normalized;
    }
    
    /**
     * Categorize feedback based on content and context
     */
    _categorizeFeedback(feedbackData) {
        // Explicit category
        if (feedbackData.category) {
            return feedbackData.category;
        }
        
        // Content-based categorization
        const content = (feedbackData.content || feedbackData.message || '').toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.config.categories)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }
    
    /**
     * Store raw feedback to JSONL file
     */
    async _storeRawFeedback(feedback) {
        const rawPath = path.join(
            this.config.storage.feedbackDir,
            this.config.storage.rawFeedback
        );
        
        const line = JSON.stringify(feedback) + '\n';
        await fs.appendFile(rawPath, line);
    }
    
    /**
     * Process feedback in real-time
     */
    async _processFeedbackRealTime(feedback) {
        try {
            // Perform sentiment analysis
            feedback.sentiment = this._analyzeSentiment(feedback.content);
            
            // Apply priority scoring
            if (this.config.processing.priorityScoring) {
                feedback.priority = this._calculatePriority(feedback);
            }
            
            // Store processed feedback
            this.feedbackStore.set(feedback.id, feedback);
            
            // Trigger auto-responders
            if (this.config.processing.autoResponders) {
                await this._triggerAutoResponders(feedback);
            }
            
            // Update stakeholder engagement
            this._updateStakeholderEngagement(feedback);
            
            // Mark as processed
            feedback.processed = true;
            feedback.processedAt = new Date().toISOString();
            
            this.emit('feedback-processed', feedback);
            
        } catch (error) {
            this.emit('processing-error', { feedbackId: feedback.id, error: error.message });
        }
    }
    
    /**
     * Process feedback in batches
     */
    async _processBatchFeedback() {
        if (this.processingQueue.length === 0) return;
        
        const batch = this.processingQueue.splice(0, this.config.processing.batchSize);
        
        console.log(`⚙️ Processing feedback batch: ${batch.length} items`);
        
        for (const feedback of batch) {
            if (!feedback.processed) {
                await this._processFeedbackRealTime(feedback);
            }
        }
        
        // Save processed feedback
        await this._saveProcessedFeedback();
        
        console.log(`✅ Batch processing complete: ${batch.length} items processed`);
    }
    
    /**
     * Analyze sentiment of feedback content
     */
    _analyzeSentiment(content) {
        // Simple sentiment analysis (in production, use NLP service)
        const positiveWords = ['good', 'great', 'excellent', 'helpful', 'easy', 'fast', 'love', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'slow', 'difficult', 'hate', 'broken', 'problem', 'issue'];
        
        const words = content.toLowerCase().split(/\s+/);
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });
        
        const totalScore = positiveScore - negativeScore;
        const normalizedScore = Math.max(-1, Math.min(1, totalScore / Math.max(1, words.length * 0.1)));
        
        return {
            score: normalizedScore,
            confidence: Math.abs(normalizedScore),
            classification: normalizedScore > 0.1 ? 'positive' : 
                          normalizedScore < -0.1 ? 'negative' : 'neutral'
        };
    }
    
    /**
     * Calculate feedback priority
     */
    _calculatePriority(feedback) {
        let score = 0;
        
        // Sentiment impact
        if (feedback.sentiment) {
            if (feedback.sentiment.score < -0.5) score += 3; // Very negative
            else if (feedback.sentiment.score < -0.2) score += 2; // Negative
            else if (feedback.sentiment.score > 0.5) score += 1; // Very positive
        }
        
        // Category impact
        const highImpactCategories = ['system', 'performance', 'automation'];
        if (highImpactCategories.includes(feedback.category)) {
            score += 2;
        }
        
        // Stakeholder influence
        const stakeholder = this.stakeholders.get(feedback.stakeholder);
        if (stakeholder && stakeholder.role === 'stakeholder') {
            score += 2;
        }
        
        // Explicit priority
        if (feedback.priority === 'high') score += 3;
        else if (feedback.priority === 'medium') score += 1;
        
        // Determine final priority
        if (score >= 5) return 'critical';
        else if (score >= 3) return 'high';
        else if (score >= 1) return 'medium';
        else return 'low';
    }
    
    /**
     * Trigger auto-responders based on feedback
     */
    async _triggerAutoResponders(feedback) {
        for (const [trigger, responder] of this.autoResponders) {
            if (responder.condition(feedback)) {
                // Log auto-response
                feedback.actions.push({
                    type: 'auto-response',
                    trigger,
                    response: responder.response,
                    action: responder.action,
                    timestamp: new Date().toISOString()
                });
                
                // Execute action
                await this._executeAutoResponderAction(responder.action, feedback);
                
                console.log(`🤖 Auto-responder triggered: ${trigger} for feedback ${feedback.id}`);
            }
        }
    }
    
    /**
     * Execute auto-responder actions
     */
    async _executeAutoResponderAction(action, feedback) {
        switch (action) {
            case 'notify-team':
                this.emit('team-notification', {
                    feedbackId: feedback.id,
                    priority: feedback.priority,
                    category: feedback.category
                });
                break;
                
            case 'escalate':
                this.emit('escalation', {
                    feedbackId: feedback.id,
                    reason: 'negative-sentiment',
                    severity: 'high'
                });
                break;
                
            case 'route-to-training-team':
                this.emit('route-feedback', {
                    feedbackId: feedback.id,
                    destination: 'training-team',
                    category: feedback.category
                });
                break;
                
            case 'add-to-backlog':
                this.emit('backlog-addition', {
                    feedbackId: feedback.id,
                    type: 'improvement-suggestion',
                    category: feedback.category
                });
                break;
                
            default:
                console.log(`⚠️ Unknown auto-responder action: ${action}`);
        }
    }
    
    /**
     * Update stakeholder engagement metrics
     */
    _updateStakeholderEngagement(feedback) {
        const stakeholder = this.stakeholders.get(feedback.stakeholder);
        if (stakeholder) {
            stakeholder.feedbackCount++;
            stakeholder.lastFeedback = feedback.timestamp;
            
            // Update satisfaction score if rating provided
            if (feedback.rating) {
                stakeholder.satisfactionScore = stakeholder.satisfactionScore
                    ? (stakeholder.satisfactionScore + feedback.rating) / 2
                    : feedback.rating;
            }
            
            // Update engagement trend (simplified)
            const daysSinceLastFeedback = stakeholder.lastFeedback
                ? (Date.now() - new Date(stakeholder.lastFeedback).getTime()) / (1000 * 60 * 60 * 24)
                : 999;
            
            if (daysSinceLastFeedback < 7) stakeholder.engagementTrend = 'increasing';
            else if (daysSinceLastFeedback > 30) stakeholder.engagementTrend = 'decreasing';
            else stakeholder.engagementTrend = 'stable';
        }
    }
    
    /**
     * Generate analytics from collected feedback
     */
    async _generateAnalytics() {
        console.log('📊 Generating feedback analytics...');
        
        const feedbackArray = Array.from(this.feedbackStore.values());
        
        // Update analytics
        this.analytics = {
            totalFeedback: feedbackArray.length,
            
            // Sentiment distribution
            sentimentDistribution: this._calculateSentimentDistribution(feedbackArray),
            
            // Category distribution
            categoryDistribution: this._calculateCategoryDistribution(feedbackArray),
            
            // Priority distribution
            priorityDistribution: this._calculatePriorityDistribution(feedbackArray),
            
            // Stakeholder engagement
            stakeholderEngagement: this._calculateStakeholderEngagement(),
            
            // Trends over time
            trends: this._calculateTrends(feedbackArray),
            
            // Response metrics
            responseMetrics: this._calculateResponseMetrics(feedbackArray),
            
            // Improvement insights
            insights: this._generateFeedbackInsights(feedbackArray),
            
            generatedAt: new Date().toISOString()
        };
        
        // Save analytics
        await this._saveAnalytics();
        
        console.log('✅ Feedback analytics generated');
    }
    
    /**
     * Calculate sentiment distribution
     */
    _calculateSentimentDistribution(feedback) {
        const distribution = { positive: 0, neutral: 0, negative: 0 };
        
        feedback.forEach(item => {
            if (item.sentiment) {
                distribution[item.sentiment.classification]++;
            }
        });
        
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        return {
            counts: distribution,
            percentages: {
                positive: total > 0 ? (distribution.positive / total * 100).toFixed(1) : 0,
                neutral: total > 0 ? (distribution.neutral / total * 100).toFixed(1) : 0,
                negative: total > 0 ? (distribution.negative / total * 100).toFixed(1) : 0
            },
            averageScore: this._calculateAverageSentiment(feedback)
        };
    }
    
    /**
     * Calculate category distribution
     */
    _calculateCategoryDistribution(feedback) {
        const distribution = {};
        
        feedback.forEach(item => {
            distribution[item.category] = (distribution[item.category] || 0) + 1;
        });
        
        const total = feedback.length;
        const percentages = {};
        
        Object.entries(distribution).forEach(([category, count]) => {
            percentages[category] = total > 0 ? (count / total * 100).toFixed(1) : 0;
        });
        
        return {
            counts: distribution,
            percentages,
            topCategories: Object.entries(distribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => ({ category, count }))
        };
    }
    
    /**
     * Calculate priority distribution
     */
    _calculatePriorityDistribution(feedback) {
        const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
        
        feedback.forEach(item => {
            distribution[item.priority]++;
        });
        
        return distribution;
    }
    
    /**
     * Calculate stakeholder engagement metrics
     */
    _calculateStakeholderEngagement() {
        const engagement = {};
        
        this.stakeholders.forEach((data, id) => {
            engagement[id] = {
                feedbackCount: data.feedbackCount,
                lastFeedback: data.lastFeedback,
                satisfactionScore: data.satisfactionScore,
                engagementTrend: data.engagementTrend,
                engagementLevel: this._calculateEngagementLevel(data)
            };
        });
        
        return engagement;
    }
    
    /**
     * Calculate engagement level for stakeholder
     */
    _calculateEngagementLevel(stakeholderData) {
        let score = 0;
        
        // Feedback frequency
        if (stakeholderData.feedbackCount >= 10) score += 3;
        else if (stakeholderData.feedbackCount >= 5) score += 2;
        else if (stakeholderData.feedbackCount >= 1) score += 1;
        
        // Recency
        if (stakeholderData.lastFeedback) {
            const daysSinceLastFeedback = (Date.now() - new Date(stakeholderData.lastFeedback).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastFeedback <= 7) score += 2;
            else if (daysSinceLastFeedback <= 30) score += 1;
        }
        
        // Satisfaction
        if (stakeholderData.satisfactionScore >= 4) score += 2;
        else if (stakeholderData.satisfactionScore >= 3) score += 1;
        
        if (score >= 5) return 'high';
        else if (score >= 3) return 'medium';
        else return 'low';
    }
    
    /**
     * Calculate trends over time
     */
    _calculateTrends(feedback) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentFeedback = feedback.filter(item => 
            new Date(item.timestamp) >= thirtyDaysAgo
        );
        
        const weeklyFeedback = feedback.filter(item => 
            new Date(item.timestamp) >= sevenDaysAgo
        );
        
        return {
            volumeTrend: {
                lastWeek: weeklyFeedback.length,
                last30Days: recentFeedback.length,
                trend: this._calculateTrendDirection(feedback)
            },
            sentimentTrend: {
                current: this._calculateAverageSentiment(weeklyFeedback),
                previous: this._calculateAverageSentiment(recentFeedback),
                trend: 'stable'
            },
            categoryTrends: this._calculateCategoryTrends(feedback)
        };
    }
    
    /**
     * Calculate response metrics
     */
    _calculateResponseMetrics(feedback) {
        const respondedFeedback = feedback.filter(item => item.actions.length > 0);
        
        return {
            responseRate: feedback.length > 0 ? (respondedFeedback.length / feedback.length * 100).toFixed(1) : 0,
            averageResponseTime: this._calculateAverageResponseTime(respondedFeedback),
            autoResponseRate: this._calculateAutoResponseRate(feedback),
            escalationRate: this._calculateEscalationRate(feedback)
        };
    }
    
    /**
     * Generate insights from feedback data
     */
    _generateFeedbackInsights(feedback) {
        const insights = [];
        
        // Sentiment insights
        const sentimentDist = this._calculateSentimentDistribution(feedback);
        if (parseFloat(sentimentDist.percentages.negative) > 20) {
            insights.push({
                type: 'alert',
                category: 'sentiment',
                message: `High negative feedback rate: ${sentimentDist.percentages.negative}%`,
                priority: 'high',
                recommendation: 'Review recent changes and address common concerns'
            });
        }
        
        // Category insights
        const categoryDist = this._calculateCategoryDistribution(feedback);
        if (categoryDist.topCategories.length > 0) {
            const topCategory = categoryDist.topCategories[0];
            insights.push({
                type: 'trend',
                category: 'volume',
                message: `Most feedback is about ${topCategory.category} (${topCategory.count} items)`,
                priority: 'medium',
                recommendation: `Focus improvement efforts on ${topCategory.category} area`
            });
        }
        
        // Engagement insights
        const lowEngagementStakeholders = Array.from(this.stakeholders.entries())
            .filter(([id, data]) => this._calculateEngagementLevel(data) === 'low')
            .length;
        
        if (lowEngagementStakeholders > 0) {
            insights.push({
                type: 'opportunity',
                category: 'engagement',
                message: `${lowEngagementStakeholders} stakeholders have low engagement`,
                priority: 'medium',
                recommendation: 'Implement targeted engagement strategies'
            });
        }
        
        return insights;
    }
    
    /**
     * Save processed feedback to storage
     */
    async _saveProcessedFeedback() {
        const processedPath = path.join(
            this.config.storage.feedbackDir,
            this.config.storage.processedFeedback
        );
        
        const feedbackArray = Array.from(this.feedbackStore.values());
        await fs.writeFile(processedPath, JSON.stringify(feedbackArray, null, 2));
    }
    
    /**
     * Save analytics to storage
     */
    async _saveAnalytics() {
        const analyticsPath = path.join(
            this.config.storage.feedbackDir,
            this.config.storage.analytics
        );
        
        await fs.writeFile(analyticsPath, JSON.stringify(this.analytics, null, 2));
    }
    
    /**
     * Generate feedback report
     */
    async generateFeedbackReport(period = '30d') {
        console.log(`📊 Generating feedback report for ${period}...`);
        
        await this._generateAnalytics();
        
        const report = {
            reportInfo: {
                title: 'Feedback Collection & Analysis Report',
                period,
                generatedAt: new Date().toISOString(),
                totalFeedback: this.analytics.totalFeedback
            },
            
            executiveSummary: {
                overallSentiment: this.analytics.sentimentDistribution.averageScore,
                topCategory: this.analytics.categoryDistribution.topCategories[0]?.category || 'none',
                responseRate: this.analytics.responseMetrics.responseRate,
                keyInsights: this.analytics.insights.slice(0, 3)
            },
            
            detailedAnalytics: this.analytics,
            
            stakeholderEngagement: this.analytics.stakeholderEngagement,
            
            recommendations: this._generateRecommendations()
        };
        
        // Save report
        const reportPath = path.join(
            this.config.storage.feedbackDir,
            this.config.storage.reports,
            `feedback-report-${period}-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`✅ Feedback report generated: ${reportPath}`);
        
        return report;
    }
    
    /**
     * Generate recommendations based on feedback analysis
     */
    _generateRecommendations() {
        const recommendations = [];
        
        // Based on insights
        this.analytics.insights.forEach(insight => {
            if (insight.recommendation) {
                recommendations.push({
                    category: insight.category,
                    priority: insight.priority,
                    recommendation: insight.recommendation,
                    rationale: insight.message
                });
            }
        });
        
        // General recommendations
        recommendations.push({
            category: 'system',
            priority: 'medium',
            recommendation: 'Implement proactive feedback collection in all operational processes',
            rationale: 'Increase feedback volume and quality for better insights'
        });
        
        return recommendations;
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            systemStatus: 'active',
            feedbackChannels: Object.keys(this.feedbackChannels).length,
            totalFeedback: this.feedbackStore.size,
            processingQueue: this.processingQueue.length,
            stakeholders: this.stakeholders.size,
            autoResponders: this.autoResponders.size,
            lastAnalytics: this.analytics.generatedAt,
            uptime: process.uptime()
        };
    }
    
    /**
     * Cleanup system resources
     */
    cleanup() {
        if (this.processingInterval) clearInterval(this.processingInterval);
        if (this.analyticsInterval) clearInterval(this.analyticsInterval);
        
        this.removeAllListeners();
        console.log('🧹 Feedback Collection System cleaned up');
    }
    
    // Helper methods
    _calculateAverageSentiment(feedback) {
        const sentimentScores = feedback
            .filter(item => item.sentiment)
            .map(item => item.sentiment.score);
        
        return sentimentScores.length > 0
            ? (sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length).toFixed(3)
            : 0;
    }
    
    _calculateTrendDirection(feedback) {
        // Simplified trend calculation
        return 'stable';
    }
    
    _calculateCategoryTrends(feedback) {
        return {}; // Simplified for this implementation
    }
    
    _calculateAverageResponseTime(feedback) {
        return '2.3 hours'; // Mock data
    }
    
    _calculateAutoResponseRate(feedback) {
        const autoResponded = feedback.filter(item => 
            item.actions.some(action => action.type === 'auto-response')
        );
        return feedback.length > 0 ? (autoResponded.length / feedback.length * 100).toFixed(1) : 0;
    }
    
    _calculateEscalationRate(feedback) {
        const escalated = feedback.filter(item => 
            item.actions.some(action => action.action === 'escalate')
        );
        return feedback.length > 0 ? (escalated.length / feedback.length * 100).toFixed(1) : 0;
    }
}

// CLI interface
async function main() {
    if (require.main === module) {
        const args = process.argv.slice(2);
        const command = args[0] || 'status';
        
        const feedbackSystem = new FeedbackCollectionSystem();
        
        try {
            switch (command) {
                case 'collect':
                    const sampleFeedback = {
                        content: args[1] || 'Sample feedback for testing',
                        category: args[2] || 'automation',
                        source: 'cli',
                        stakeholder: 'operations-team',
                        rating: 4
                    };
                    
                    const result = await feedbackSystem.collectFeedback(sampleFeedback);
                    console.log('Feedback collected:', result);
                    break;
                    
                case 'report':
                    const period = args[1] || '30d';
                    await feedbackSystem.generateFeedbackReport(period);
                    break;
                    
                case 'status':
                    const status = feedbackSystem.getSystemStatus();
                    console.log('\n=== Feedback System Status ===');
                    console.log(JSON.stringify(status, null, 2));
                    break;
                    
                case 'analytics':
                    await feedbackSystem._generateAnalytics();
                    console.log('Analytics generated successfully');
                    break;
                    
                default:
                    console.log('Usage: node feedback-collection-system.js [collect|report|status|analytics] [args]');
                    console.log('Examples:');
                    console.log('  node feedback-collection-system.js collect "Great automation!" automation');
                    console.log('  node feedback-collection-system.js report 30d');
                    console.log('  node feedback-collection-system.js status');
            }
            
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        } finally {
            feedbackSystem.cleanup();
            process.exit(0);
        }
    }
}

// Export for use as module
module.exports = FeedbackCollectionSystem;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}