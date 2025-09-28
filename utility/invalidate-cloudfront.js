#!/usr/bin/env node
/**
 * CloudFront Cache Invalidation Script
 * 
 * Batch invalidation script that respects AWS limits and provides
 * comprehensive logging and error handling.
 * 
 * Usage:
 *   node utility/create-media-backup.js --paths="/images/*,/css/*"
 *   node utility/create-media-backup.js --paths="/uploads/albums/*" --dry-run
 *   node utility/create-media-backup.js --file=paths.txt --log
 */

require('dotenv').config();
const { CloudFrontClient, CreateInvalidationCommand, GetInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CloudFrontInvalidator {
  constructor() {
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    this.region = process.env.S3_REGION || 'us-east-1';
    this.isDryRun = false;
    this.shouldLog = false;
    this.logDir = 'logs/operations';
    
    // AWS CloudFront limits
    this.MAX_PATHS_PER_REQUEST = 3000;
    this.MAX_REQUESTS_PER_MONTH = 1000; // For free tier, more for paid
    
    this.client = new CloudFrontClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
      }
    });
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
      operation: 'cloudfront_invalidation',
      ...entry
    };
    
    const logFile = path.join(this.logDir, `cloudfront-invalidation-${new Date().toISOString().split('T')[0]}.log`);
    
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
    
    if (!this.distributionId) {
      errors.push('CLOUDFRONT_DISTRIBUTION_ID environment variable is required');
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
   * Parse paths from various input formats
   */
  async parsePaths(pathsInput, pathsFile) {
    let paths = [];
    
    if (pathsInput) {
      // Parse comma-separated paths from command line
      paths = pathsInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
    } else if (pathsFile) {
      // Read paths from file
      try {
        const fileContent = await fs.readFile(pathsFile, 'utf-8');
        paths = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('#'));
      } catch (error) {
        throw new Error(`Could not read paths file '${pathsFile}': ${error.message}`);
      }
    } else {
      throw new Error('Either --paths or --file parameter is required');
    }
    
    if (paths.length === 0) {
      throw new Error('No valid paths found to invalidate');
    }
    
    // Validate paths
    paths.forEach(path => {
      if (!path.startsWith('/')) {
        throw new Error(`Path must start with '/': ${path}`);
      }
    });
    
    return paths;
  }

  /**
   * Batch paths to respect AWS limits
   */
  batchPaths(paths) {
    const batches = [];
    for (let i = 0; i < paths.length; i += this.MAX_PATHS_PER_REQUEST) {
      batches.push(paths.slice(i, i + this.MAX_PATHS_PER_REQUEST));
    }
    return batches;
  }

  /**
   * Create invalidation request
   */
  async createInvalidation(paths, batchIndex = 0) {
    const callerReference = `invalidation-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${batchIndex}`;
    
    const command = new CreateInvalidationCommand({
      DistributionId: this.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths
        },
        CallerReference: callerReference
      }
    });

    if (this.isDryRun) {
      console.log(`[DRY RUN] Would create invalidation for ${paths.length} paths:`);
      paths.forEach(path => console.log(`  - ${path}`));
      console.log(`[DRY RUN] Caller Reference: ${callerReference}`);
      
      await this.writeLog({
        action: 'dry_run_invalidation',
        distribution_id: this.distributionId,
        paths,
        caller_reference: callerReference,
        batch_index: batchIndex
      });
      
      return {
        id: `dry-run-${callerReference}`,
        status: 'DryRun',
        paths: paths.length
      };
    }

    try {
      const response = await this.client.send(command);
      console.log(`✅ Invalidation created: ${response.Invalidation.Id}`);
      console.log(`   Status: ${response.Invalidation.Status}`);
      console.log(`   Paths: ${paths.length}`);
      
      if (paths.length <= 10) {
        console.log('   Path list:');
        paths.forEach(path => console.log(`     - ${path}`));
      } else {
        console.log(`   Sample paths: ${paths.slice(0, 5).join(', ')}...`);
      }

      await this.writeLog({
        action: 'invalidation_created',
        invalidation_id: response.Invalidation.Id,
        distribution_id: this.distributionId,
        status: response.Invalidation.Status,
        paths,
        caller_reference: callerReference,
        batch_index: batchIndex,
        create_time: response.Invalidation.CreateTime
      });

      return {
        id: response.Invalidation.Id,
        status: response.Invalidation.Status,
        paths: paths.length,
        createTime: response.Invalidation.CreateTime
      };
    } catch (error) {
      console.error(`❌ Failed to create invalidation: ${error.message}`);
      
      await this.writeLog({
        action: 'invalidation_failed',
        distribution_id: this.distributionId,
        paths,
        caller_reference: callerReference,
        batch_index: batchIndex,
        error: error.message,
        error_code: error.name
      });
      
      throw error;
    }
  }

  /**
   * Check invalidation status
   */
  async checkInvalidationStatus(invalidationId) {
    if (this.isDryRun || invalidationId.startsWith('dry-run-')) {
      return { status: 'DryRun', id: invalidationId };
    }

    try {
      const command = new GetInvalidationCommand({
        DistributionId: this.distributionId,
        Id: invalidationId
      });

      const response = await this.client.send(command);
      return {
        id: invalidationId,
        status: response.Invalidation.Status,
        createTime: response.Invalidation.CreateTime
      };
    } catch (error) {
      console.warn(`Warning: Could not check status for invalidation ${invalidationId}: ${error.message}`);
      return { id: invalidationId, status: 'Unknown', error: error.message };
    }
  }

  /**
   * Estimate completion time
   */
  estimateCompletionTime(pathCount) {
    // CloudFront invalidation typically takes 10-15 minutes
    // More paths might take slightly longer
    const baseMinutes = 10;
    const additionalMinutes = Math.floor(pathCount / 1000) * 2; // 2 extra minutes per 1000 paths
    const totalMinutes = Math.min(baseMinutes + additionalMinutes, 20); // Cap at 20 minutes
    
    return totalMinutes;
  }

  /**
   * Run invalidation process
   */
  async run(pathsInput, pathsFile) {
    try {
      console.log('🌐 CloudFront Cache Invalidation Tool');
      console.log('=====================================');
      
      // Initialize
      await this.initializeLogging();
      this.validateEnvironment();
      
      console.log(`Distribution ID: ${this.distributionId}`);
      console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : 'LIVE'}`);
      console.log(`Logging: ${this.shouldLog ? 'Enabled' : 'Disabled'}`);
      console.log('');

      // Parse and validate paths
      const paths = await this.parsePaths(pathsInput, pathsFile);
      console.log(`📋 Found ${paths.length} paths to invalidate`);
      
      if (paths.length > this.MAX_PATHS_PER_REQUEST) {
        console.log(`⚠️  Paths exceed single request limit (${this.MAX_PATHS_PER_REQUEST})`);
        console.log(`   Will create ${Math.ceil(paths.length / this.MAX_PATHS_PER_REQUEST)} batched requests`);
      }

      // Estimate completion time
      const estimatedMinutes = this.estimateCompletionTime(paths.length);
      console.log(`⏱️  Estimated completion time: ${estimatedMinutes} minutes`);
      console.log('');

      // Batch and process paths
      const batches = this.batchPaths(paths);
      const results = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} paths)...`);
        
        try {
          const result = await this.createInvalidation(batch, i);
          results.push(result);
          
          // Small delay between batches to be respectful to AWS
          if (i < batches.length - 1) {
            console.log('   Waiting 2 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`❌ Batch ${i + 1} failed: ${error.message}`);
          results.push({ 
            batch: i, 
            error: error.message, 
            paths: batch.length,
            status: 'Failed'
          });
        }
      }

      // Summary
      console.log('');
      console.log('📊 Invalidation Summary');
      console.log('======================');
      
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);
      
      console.log(`Total batches: ${results.length}`);
      console.log(`Successful: ${successful.length}`);
      console.log(`Failed: ${failed.length}`);
      console.log(`Total paths processed: ${paths.length}`);
      
      if (successful.length > 0) {
        console.log('');
        console.log('✅ Successful invalidations:');
        successful.forEach(result => {
          console.log(`   ${result.id} (${result.paths} paths, ${result.status})`);
        });
      }
      
      if (failed.length > 0) {
        console.log('');
        console.log('❌ Failed invalidations:');
        failed.forEach(result => {
          console.log(`   Batch ${result.batch + 1}: ${result.error}`);
        });
      }

      if (!this.isDryRun && successful.length > 0) {
        console.log('');
        console.log('💡 Tips:');
        console.log('   - Invalidations typically complete in 10-15 minutes');
        console.log('   - Check AWS Console for real-time progress');
        console.log('   - Use CloudWatch to monitor cache hit ratios');
      }

      await this.writeLog({
        action: 'invalidation_summary',
        total_batches: results.length,
        successful_batches: successful.length,
        failed_batches: failed.length,
        total_paths: paths.length,
        estimated_completion_minutes: estimatedMinutes,
        results
      });

      // Exit code based on results
      if (failed.length > 0) {
        console.error('❌ Some invalidations failed');
        process.exit(1);
      } else {
        console.log('✅ All invalidations completed successfully');
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
  console.log('CloudFront Cache Invalidation Tool');
  console.log('===============================================');
  console.log('');
  console.log('Usage:');
  console.log('  node utility/create-media-backup.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --paths="path1,path2"    Comma-separated list of paths to invalidate');
  console.log('  --file=paths.txt         Read paths from file (one per line)');
  console.log('  --dry-run                Show what would be invalidated without doing it');
  console.log('  --log                    Enable logging to logs/operations/');
  console.log('  --help                   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  # Invalidate specific paths');
  console.log('  node utility/create-media-backup.js --paths="/images/*,/css/*"');
  console.log('');
  console.log('  # Invalidate from file');
  console.log('  node utility/create-media-backup.js --file=invalidation-paths.txt');
  console.log('');
  console.log('  # Dry run with logging');
  console.log('  node utility/create-media-backup.js --paths="/uploads/*" --dry-run --log');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  CLOUDFRONT_DISTRIBUTION_ID   CloudFront distribution ID');
  console.log('  S3_ACCESS_KEY_ID            AWS access key ID');
  console.log('  S3_SECRET_ACCESS_KEY        AWS secret access key');
  console.log('  S3_REGION                   AWS region (optional, defaults to us-east-1)');
  console.log('');
}

function parseArgs(args) {
  const config = {
    paths: null,
    file: null,
    dryRun: false,
    log: false,
    help: false
  };

  for (const arg of args) {
    if (arg.startsWith('--paths=')) {
      config.paths = arg.substring(8);
    } else if (arg.startsWith('--file=')) {
      config.file = arg.substring(7);
    } else if (arg === '--dry-run') {
      config.dryRun = true;
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

  if (!config.paths && !config.file) {
    console.error('❌ Error: Either --paths or --file parameter is required');
    console.log('');
    printUsage();
    process.exit(1);
  }

  const invalidator = new CloudFrontInvalidator();
  invalidator.isDryRun = config.dryRun;
  invalidator.shouldLog = config.log;

  await invalidator.run(config.paths, config.file);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = CloudFrontInvalidator;