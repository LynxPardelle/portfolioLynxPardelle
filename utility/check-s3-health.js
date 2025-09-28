#!/usr/bin/env node
/**
 * S3 Health Check Script
 * 
 * Comprehensive S3 bucket health diagnostics including encryption,
 * versioning, lifecycle policies, and storage monitoring.
 * 
 * Usage:
 *   node utility/check-s3-health.js
 *   node utility/check-s3-health.js --detailed
 *   node utility/check-s3-health.js --log --detailed
 */

require('dotenv').config();
const { 
  S3Client, 
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLocationCommand,
  GetBucketPolicyCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  GetBucketNotificationConfigurationCommand
} = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');

class S3HealthChecker {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.region = process.env.S3_REGION || 'us-east-1';
    this.uploadPrefix = process.env.S3_UPLOAD_PREFIX || 'uploads/';
    this.isDetailed = false;
    this.shouldLog = false;
    this.logDir = 'logs/operations';
    
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
      }
    });
    
    // Health check thresholds
    this.thresholds = {
      maxObjects: 100000,
      maxSizeGB: 100,
      oldObjectsDays: 365,
      maxErrors: 10
    };
    
    this.healthReport = {
      bucket: this.bucketName,
      timestamp: new Date().toISOString(),
      region: this.region,
      checks: {},
      issues: [],
      warnings: [],
      recommendations: [],
      overall_health: 'unknown'
    };
  }

  /**
   * Initialize logging directory
   */
  async initializeLogging() {
    if (this.shouldLog) {
      try {
        await fs.mkdir(this.logDir, { recursive: true });
      } catch (error) {
        console.warn(`Warning: Could not create log directory: ${error.message}`);
        this.shouldLog = false;
      }
    }
  }

  /**
   * Write log entry with timestamp
   */
  async writeLog(entry) {
    if (!this.shouldLog) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation: 's3_health_check',
      ...entry
    };
    
    const logFile = path.join(this.logDir, `s3-health-${new Date().toISOString().split('T')[0]}.log`);
    
    try {
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.warn(`Warning: Could not write to log file: ${error.message}`);
    }
  }

  /**
   * Validate environment and configuration
   */
  validateEnvironment() {
    const errors = [];
    
    if (!this.bucketName) {
      errors.push('S3_BUCKET_NAME environment variable is required');
    }
    
    if (!process.env.S3_ACCESS_KEY_ID) {
      errors.push('S3_ACCESS_KEY_ID environment variable is required');
    }
    
    if (!process.env.S3_SECRET_ACCESS_KEY) {
      errors.push('S3_SECRET_ACCESS_KEY environment variable is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Check bucket accessibility
   */
  async checkBucketAccess() {
    console.log('🔍 Checking bucket accessibility...');
    
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      
      this.healthReport.checks.bucket_access = {
        status: 'pass',
        message: 'Bucket is accessible'
      };
      
      console.log('  ✅ Bucket is accessible');
      return true;
    } catch (error) {
      this.healthReport.checks.bucket_access = {
        status: 'fail',
        message: `Bucket access failed: ${error.message}`,
        error_code: error.name
      };
      
      this.healthReport.issues.push('Bucket is not accessible');
      console.log(`  ❌ Bucket access failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check bucket location/region
   */
  async checkBucketLocation() {
    console.log('🌍 Checking bucket location...');
    
    try {
      const command = new GetBucketLocationCommand({ Bucket: this.bucketName });
      const response = await this.client.send(command);
      
      const bucketRegion = response.LocationConstraint || 'us-east-1';
      const regionMatch = bucketRegion === this.region;
      
      this.healthReport.checks.bucket_location = {
        status: regionMatch ? 'pass' : 'warning',
        bucket_region: bucketRegion,
        configured_region: this.region,
        match: regionMatch
      };
      
      if (regionMatch) {
        console.log(`  ✅ Bucket region (${bucketRegion}) matches configuration`);
      } else {
        console.log(`  ⚠️  Bucket region (${bucketRegion}) differs from configuration (${this.region})`);
        this.healthReport.warnings.push(`Bucket region (${bucketRegion}) differs from configured region (${this.region})`);
      }
      
      return bucketRegion;
    } catch (error) {
      this.healthReport.checks.bucket_location = {
        status: 'fail',
        message: `Could not determine bucket location: ${error.message}`
      };
      
      console.log(`  ❌ Could not check bucket location: ${error.message}`);
      return null;
    }
  }

  /**
   * Check bucket encryption
   */
  async checkBucketEncryption() {
    console.log('🔒 Checking bucket encryption...');
    
    try {
      const command = new GetBucketEncryptionCommand({ Bucket: this.bucketName });
      const response = await this.client.send(command);
      
      const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
      const hasEncryption = rules.length > 0;
      
      this.healthReport.checks.bucket_encryption = {
        status: hasEncryption ? 'pass' : 'warning',
        enabled: hasEncryption,
        rules: rules.map(rule => ({
          algorithm: rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
          kms_key: rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
        }))
      };
      
      if (hasEncryption) {
        console.log('  ✅ Bucket encryption is enabled');
        if (this.isDetailed) {
          rules.forEach(rule => {
            const algo = rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
            const kmsKey = rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
            console.log(`    Algorithm: ${algo}`);
            if (kmsKey) console.log(`    KMS Key: ${kmsKey}`);
          });
        }
      } else {
        console.log('  ⚠️  Bucket encryption is not configured');
        this.healthReport.warnings.push('Bucket encryption is not configured');
        this.healthReport.recommendations.push('Enable server-side encryption for better security');
      }
      
      return hasEncryption;
    } catch (error) {
      if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
        this.healthReport.checks.bucket_encryption = {
          status: 'warning',
          enabled: false,
          message: 'No encryption configuration found'
        };
        
        console.log('  ⚠️  No encryption configuration found');
        this.healthReport.warnings.push('Bucket encryption is not configured');
        return false;
      }
      
      this.healthReport.checks.bucket_encryption = {
        status: 'fail',
        message: `Could not check encryption: ${error.message}`
      };
      
      console.log(`  ❌ Could not check encryption: ${error.message}`);
      return null;
    }
  }

  /**
   * Check bucket versioning
   */
  async checkBucketVersioning() {
    console.log('📝 Checking bucket versioning...');
    
    try {
      const command = new GetBucketVersioningCommand({ Bucket: this.bucketName });
      const response = await this.client.send(command);
      
      const status = response.Status || 'Disabled';
      const mfaDelete = response.MfaDelete || 'Disabled';
      
      this.healthReport.checks.bucket_versioning = {
        status: status === 'Enabled' ? 'pass' : 'info',
        versioning_status: status,
        mfa_delete: mfaDelete
      };
      
      if (status === 'Enabled') {
        console.log('  ✅ Bucket versioning is enabled');
        if (mfaDelete === 'Enabled') {
          console.log('  ✅ MFA delete protection is enabled');
        }
      } else {
        console.log(`  ℹ️  Bucket versioning is ${status.toLowerCase()}`);
        if (status === 'Disabled') {
          this.healthReport.recommendations.push('Consider enabling versioning for data protection');
        }
      }
      
      return status;
    } catch (error) {
      this.healthReport.checks.bucket_versioning = {
        status: 'fail',
        message: `Could not check versioning: ${error.message}`
      };
      
      console.log(`  ❌ Could not check versioning: ${error.message}`);
      return null;
    }
  }

  /**
   * Check lifecycle policies
   */
  async checkLifecyclePolicies() {
    console.log('♻️  Checking lifecycle policies...');
    
    try {
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: this.bucketName });
      const response = await this.client.send(command);
      
      const rules = response.Rules || [];
      const hasLifecycle = rules.length > 0;
      
      this.healthReport.checks.lifecycle_policies = {
        status: 'info',
        enabled: hasLifecycle,
        rules_count: rules.length,
        rules: rules.map(rule => ({
          id: rule.ID,
          status: rule.Status,
          prefix: rule.Filter?.Prefix,
          transitions: rule.Transitions?.map(t => ({
            days: t.Days,
            storage_class: t.StorageClass
          })) || [],
          expiration: rule.Expiration ? {
            days: rule.Expiration.Days,
            expired_object_delete_marker: rule.Expiration.ExpiredObjectDeleteMarker
          } : null
        }))
      };
      
      if (hasLifecycle) {
        console.log(`  ✅ Found ${rules.length} lifecycle rule(s)`);
        if (this.isDetailed) {
          rules.forEach(rule => {
            console.log(`    Rule: ${rule.ID} (${rule.Status})`);
            if (rule.Filter?.Prefix) console.log(`      Prefix: ${rule.Filter.Prefix}`);
            if (rule.Transitions) {
              rule.Transitions.forEach(t => {
                console.log(`      Transition: ${t.StorageClass} after ${t.Days} days`);
              });
            }
            if (rule.Expiration?.Days) {
              console.log(`      Expiration: ${rule.Expiration.Days} days`);
            }
          });
        }
      } else {
        console.log('  ℹ️  No lifecycle policies configured');
        this.healthReport.recommendations.push('Consider configuring lifecycle policies for cost optimization');
      }
      
      return rules;
    } catch (error) {
      if (error.name === 'NoSuchLifecycleConfiguration') {
        this.healthReport.checks.lifecycle_policies = {
          status: 'info',
          enabled: false,
          message: 'No lifecycle configuration found'
        };
        
        console.log('  ℹ️  No lifecycle policies configured');
        return [];
      }
      
      this.healthReport.checks.lifecycle_policies = {
        status: 'fail',
        message: `Could not check lifecycle policies: ${error.message}`
      };
      
      console.log(`  ❌ Could not check lifecycle policies: ${error.message}`);
      return null;
    }
  }

  /**
   * Check bucket contents and usage
   */
  async checkBucketUsage() {
    console.log('📊 Checking bucket usage...');
    
    try {
      let totalObjects = 0;
      let totalSize = 0;
      let prefixStats = {};
      let oldObjects = 0;
      let continuationToken = null;
      const sampleObjects = [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.thresholds.oldObjectsDays);
      
      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1000,
          ContinuationToken: continuationToken
        });
        
        const response = await this.client.send(command);
        const objects = response.Contents || [];
        
        for (const obj of objects) {
          totalObjects++;
          totalSize += obj.Size || 0;
          
          // Track prefix statistics
          const prefix = obj.Key.split('/')[0];
          if (!prefixStats[prefix]) {
            prefixStats[prefix] = { count: 0, size: 0 };
          }
          prefixStats[prefix].count++;
          prefixStats[prefix].size += obj.Size || 0;
          
          // Check for old objects
          if (obj.LastModified && obj.LastModified < thirtyDaysAgo) {
            oldObjects++;
          }
          
          // Collect sample objects for detailed report
          if (this.isDetailed && sampleObjects.length < 10) {
            sampleObjects.push({
              key: obj.Key,
              size: obj.Size,
              last_modified: obj.LastModified,
              storage_class: obj.StorageClass
            });
          }
        }
        
        continuationToken = response.NextContinuationToken;
        
        // Progress indicator for large buckets
        if (totalObjects > 0 && totalObjects % 10000 === 0) {
          console.log(`    Processed ${totalObjects} objects...`);
        }
        
      } while (continuationToken);
      
      const totalSizeGB = totalSize / (1024 * 1024 * 1024);
      
      this.healthReport.checks.bucket_usage = {
        status: this.assessUsageHealth(totalObjects, totalSizeGB),
        total_objects: totalObjects,
        total_size_bytes: totalSize,
        total_size_gb: Math.round(totalSizeGB * 100) / 100,
        old_objects: oldObjects,
        old_objects_percentage: totalObjects > 0 ? Math.round((oldObjects / totalObjects) * 100) : 0,
        prefix_stats: prefixStats,
        sample_objects: this.isDetailed ? sampleObjects : undefined
      };
      
      console.log(`  📈 Total objects: ${totalObjects.toLocaleString()}`);
      console.log(`  📦 Total size: ${totalSizeGB.toFixed(2)} GB`);
      console.log(`  📅 Old objects (>1 year): ${oldObjects.toLocaleString()} (${Math.round((oldObjects / totalObjects) * 100)}%)`);
      
      if (this.isDetailed && Object.keys(prefixStats).length > 0) {
        console.log('  📁 Top prefixes by object count:');
        const sortedPrefixes = Object.entries(prefixStats)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 10);
        
        sortedPrefixes.forEach(([prefix, stats]) => {
          const sizeGB = stats.size / (1024 * 1024 * 1024);
          console.log(`    ${prefix}: ${stats.count.toLocaleString()} objects, ${sizeGB.toFixed(2)} GB`);
        });
      }
      
      // Check thresholds
      if (totalObjects > this.thresholds.maxObjects) {
        this.healthReport.warnings.push(`Object count (${totalObjects.toLocaleString()}) exceeds threshold (${this.thresholds.maxObjects.toLocaleString()})`);
      }
      
      if (totalSizeGB > this.thresholds.maxSizeGB) {
        this.healthReport.warnings.push(`Bucket size (${totalSizeGB.toFixed(2)} GB) exceeds threshold (${this.thresholds.maxSizeGB} GB)`);
      }
      
      if (oldObjects > 0) {
        this.healthReport.recommendations.push(`Consider archiving or deleting ${oldObjects.toLocaleString()} old objects (>1 year)`);
      }
      
      return {
        totalObjects,
        totalSizeGB,
        prefixStats,
        oldObjects
      };
      
    } catch (error) {
      this.healthReport.checks.bucket_usage = {
        status: 'fail',
        message: `Could not check bucket usage: ${error.message}`
      };
      
      console.log(`  ❌ Could not check bucket usage: ${error.message}`);
      return null;
    }
  }

  /**
   * Assess usage health based on metrics
   */
  assessUsageHealth(totalObjects, totalSizeGB) {
    if (totalObjects > this.thresholds.maxObjects || totalSizeGB > this.thresholds.maxSizeGB) {
      return 'warning';
    }
    return 'pass';
  }

  /**
   * Check bucket policy (if detailed mode)
   */
  async checkBucketPolicy() {
    if (!this.isDetailed) return null;
    
    console.log('🛡️  Checking bucket policy...');
    
    try {
      const command = new GetBucketPolicyCommand({ Bucket: this.bucketName });
      const response = await this.client.send(command);
      
      const policy = JSON.parse(response.Policy);
      
      this.healthReport.checks.bucket_policy = {
        status: 'info',
        has_policy: true,
        policy: policy
      };
      
      console.log('  ✅ Bucket policy is configured');
      console.log(`    Statements: ${policy.Statement?.length || 0}`);
      
      return policy;
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        this.healthReport.checks.bucket_policy = {
          status: 'info',
          has_policy: false,
          message: 'No bucket policy configured'
        };
        
        console.log('  ℹ️  No bucket policy configured');
        return null;
      }
      
      this.healthReport.checks.bucket_policy = {
        status: 'fail',
        message: `Could not check bucket policy: ${error.message}`
      };
      
      console.log(`  ❌ Could not check bucket policy: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth() {
    const checks = this.healthReport.checks;
    let passCount = 0;
    let failCount = 0;
    let totalChecks = 0;
    
    Object.values(checks).forEach(check => {
      if (check.status) {
        totalChecks++;
        if (check.status === 'pass') passCount++;
        if (check.status === 'fail') failCount++;
      }
    });
    
    if (failCount > 0) {
      this.healthReport.overall_health = 'critical';
    } else if (this.healthReport.issues.length > 0) {
      this.healthReport.overall_health = 'unhealthy';
    } else if (this.healthReport.warnings.length > 3) {
      this.healthReport.overall_health = 'warning';
    } else if (this.healthReport.warnings.length > 0) {
      this.healthReport.overall_health = 'good';
    } else {
      this.healthReport.overall_health = 'excellent';
    }
    
    this.healthReport.health_score = {
      total_checks: totalChecks,
      passed: passCount,
      failed: failCount,
      warnings: this.healthReport.warnings.length,
      issues: this.healthReport.issues.length
    };
  }

  /**
   * Run complete health check
   */
  async run() {
    try {
      console.log('🏥 S3 Bucket Health Check');
      console.log('========================');
      console.log(`Bucket: ${this.bucketName}`);
      console.log(`Region: ${this.region}`);
      console.log(`Mode: ${this.isDetailed ? 'Detailed' : 'Standard'}`);
      console.log(`Logging: ${this.shouldLog ? 'Enabled' : 'Disabled'}`);
      console.log('');

      // Initialize
      await this.initializeLogging();
      this.validateEnvironment();
      
      // Run health checks
      const accessOk = await this.checkBucketAccess();
      if (!accessOk) {
        console.log('❌ Cannot proceed with health checks - bucket is not accessible');
        return;
      }
      
      await this.checkBucketLocation();
      await this.checkBucketEncryption();
      await this.checkBucketVersioning();
      await this.checkLifecyclePolicies();
      await this.checkBucketUsage();
      
      if (this.isDetailed) {
        await this.checkBucketPolicy();
      }
      
      // Calculate overall health
      this.calculateOverallHealth();
      
      // Summary
      console.log('');
      console.log('📊 Health Summary');
      console.log('================');
      
      const healthEmoji = {
        'excellent': '🟢',
        'good': '🟡',
        'warning': '🟠',
        'unhealthy': '🔴',
        'critical': '💀'
      };
      
      console.log(`Overall Health: ${healthEmoji[this.healthReport.overall_health]} ${this.healthReport.overall_health.toUpperCase()}`);
      console.log(`Checks: ${this.healthReport.health_score.passed}/${this.healthReport.health_score.total_checks} passed`);
      
      if (this.healthReport.issues.length > 0) {
        console.log('');
        console.log('❌ Issues:');
        this.healthReport.issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      if (this.healthReport.warnings.length > 0) {
        console.log('');
        console.log('⚠️  Warnings:');
        this.healthReport.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      if (this.healthReport.recommendations.length > 0) {
        console.log('');
        console.log('💡 Recommendations:');
        this.healthReport.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }

      // Log results
      await this.writeLog({
        action: 'health_check_completed',
        health_report: this.healthReport
      });

      // Exit code based on health
      if (this.healthReport.overall_health === 'critical' || this.healthReport.issues.length > 0) {
        console.log('');
        console.log('❌ Health check completed with issues');
        process.exit(1);
      } else {
        console.log('');
        console.log('✅ Health check completed successfully');
        process.exit(0);
      }
      
    } catch (error) {
      console.error(`❌ Fatal error: ${error.message}`);
      
      await this.writeLog({
        action: 'fatal_error',
        error: error.message,
        error_code: error.name,
        stack: error.stack
      });
      
      process.exit(1);
    }
  }
}

// CLI Interface
function printUsage() {
  console.log('S3 Health Check Tool');
  console.log('=================================');
  console.log('');
  console.log('Usage:');
  console.log('  node utility/check-s3-health.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --detailed               Run detailed health check with additional information');
  console.log('  --log                    Enable logging to logs/operations/');
  console.log('  --help                   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  # Basic health check');
  console.log('  node utility/check-s3-health.js');
  console.log('');
  console.log('  # Detailed health check with logging');
  console.log('  node utility/check-s3-health.js --detailed --log');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  S3_BUCKET_NAME          S3 bucket name to check');
  console.log('  S3_ACCESS_KEY_ID        AWS access key ID');
  console.log('  S3_SECRET_ACCESS_KEY    AWS secret access key');
  console.log('  S3_REGION               AWS region (optional, defaults to us-east-1)');
  console.log('  S3_UPLOAD_PREFIX        Upload prefix (optional, defaults to uploads/)');
  console.log('');
}

function parseArgs(args) {
  const config = {
    detailed: false,
    log: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--detailed') {
      config.detailed = true;
    } else if (arg === '--log') {
      config.log = true;
    } else if (arg === '--help') {
      config.help = true;
    }
  }

  return config;
}

async function main() {
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  if (config.help) {
    printUsage();
    process.exit(0);
  }

  const checker = new S3HealthChecker();
  checker.isDetailed = config.detailed;
  checker.shouldLog = config.log;

  await checker.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = S3HealthChecker;