#!/usr/bin/env node
/**
 * AWS Cost Monitoring Script for S3 & CloudFront
 * Retrieves cost information and sends metrics to CloudWatch
 */

require('dotenv').config();
const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

class CostMonitor {
  constructor() {
    this.costExplorerClient = new CostExplorerClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    this.cloudWatchClient = new CloudWatchClient({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Get cost data for the last 30 days
   */
  async getCostData() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const params = {
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: "DAILY",
      Metrics: ["BlendedCost"],
      GroupBy: [
        {
          Type: "DIMENSION",
          Key: "SERVICE"
        }
      ],
      Filter: {
        Dimensions: {
          Key: "SERVICE",
          Values: ["Amazon Simple Storage Service", "Amazon CloudFront"],
          MatchOptions: ["EQUALS"]
        }
      }
    };

    try {
      const command = new GetCostAndUsageCommand(params);
      const result = await this.costExplorerClient.send(command);
      return result;
    } catch (error) {
      console.error("Error fetching cost data:", error);
      throw error;
    }
  }

  /**
   * Send cost metrics to CloudWatch
   */
  async sendCostMetrics(costData) {
    try {
      const totalCosts = {
        s3: 0,
        cloudfront: 0,
        total: 0
      };

      // Process cost data
      if (costData.ResultsByTime) {
        for (const timeResult of costData.ResultsByTime) {
          for (const group of timeResult.Groups) {
            const service = group.Keys[0];
            const cost = parseFloat(group.Metrics.BlendedCost.Amount);

            if (service === "Amazon Simple Storage Service") {
              totalCosts.s3 += cost;
            } else if (service === "Amazon CloudFront") {
              totalCosts.cloudfront += cost;
            }
            totalCosts.total += cost;
          }
        }
      }

      // Send metrics to CloudWatch
      const metricData = {
        Namespace: 'LynxPortfolio/Cost',
        MetricData: [
          {
            MetricName: 'S3Cost',
            Value: totalCosts.s3,
            Unit: 'None',
            Timestamp: new Date()
          },
          {
            MetricName: 'CloudFrontCost',
            Value: totalCosts.cloudfront,
            Unit: 'None',
            Timestamp: new Date()
          },
          {
            MetricName: 'TotalCost',
            Value: totalCosts.total,
            Unit: 'None',
            Timestamp: new Date()
          }
        ]
      };

      const command = new PutMetricDataCommand(metricData);
      await this.cloudWatchClient.send(command);

      console.log('Cost metrics sent successfully:', totalCosts);
      return totalCosts;
    } catch (error) {
      console.error("Error sending cost metrics:", error);
      throw error;
    }
  }

  /**
   * Run cost monitoring
   */
  async run() {
    try {
      console.log('📊 Fetching AWS cost data...');
      const costData = await this.getCostData();
      
      console.log('📈 Sending cost metrics to CloudWatch...');
      const costs = await this.sendCostMetrics(costData);
      
      console.log('✅ Cost monitoring completed successfully');
      console.log(`S3 Cost (30 days): $${costs.s3.toFixed(2)}`);
      console.log(`CloudFront Cost (30 days): $${costs.cloudfront.toFixed(2)}`);
      console.log(`Total Cost (30 days): $${costs.total.toFixed(2)}`);

      // Check against budget thresholds
      const monthlyBudget = 200; // $200 monthly budget
      const currentMonthlyRate = costs.total * (30 / 30); // Normalize to monthly
      
      if (currentMonthlyRate > monthlyBudget * 0.8) {
        console.warn(`⚠️  WARNING: Current monthly rate ($${currentMonthlyRate.toFixed(2)}) exceeds 80% of budget ($${monthlyBudget})`);
      }

      return costs;
    } catch (error) {
      console.error('❌ Cost monitoring failed:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new CostMonitor();
  monitor.run().catch(console.error);
}

module.exports = CostMonitor;