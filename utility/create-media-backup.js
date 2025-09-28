#!/usr/bin/env node
/**
 * Media Backup Script
 * 
 * Creates comprehensive backups of files collection documents and 
 * pushes metadata snapshots to S3 with proper tagging and retention.
 * 
 * Usage:
 *   node utility/create-media-backup.js
 *   node utility/create-media-backup.js --dry-run
 *   node utility/create-media-backup.js --log --retention=30
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import models
const File = require('../models/file');
const Song = require('../models/song');
const Video = require('../models/video');
const BookImg = require('../models/bookImg');
const Album = require('../models/album');
const Website = require('../models/website');
const Article = require('../models/article');

class MediaBackupManager {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.region = process.env.S3_REGION || 'us-east-1';
    this.mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lynx_portfolio';
    this.isDryRun = false;
    this.shouldLog = false;
    this.logDir = 'logs/operations';
    this.retentionDays = 90; // Default retention
    this.backupPrefix = 'backups/media/';
    
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
      }
    });
    
    this.backupReport = {
      timestamp: new Date().toISOString(),
      collections: {},
      summary: {
        total_documents: 0,
        total_files: 0,
        backup_size_bytes: 0,
        s3_objects_created: 0
      },
      errors: [],
      warnings: []
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
      operation: 'media_backup',
      ...entry
    };
    
    const logFile = path.join(this.logDir, `media-backup-${new Date().toISOString().split('T')[0]}.log`);
    
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
    
    if (!this.mongoUri) {
      errors.push('MONGO_URI environment variable is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Connect to MongoDB
   */
  async connectToMongoDB() {
    try {
      await mongoose.connect(this.mongoUri);
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
      this.backupReport.errors.push(`MongoDB connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnectFromMongoDB() {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.warn(`Warning: Error disconnecting from MongoDB: ${error.message}`);
    }
  }

  /**
   * Generate backup metadata
   */
  generateBackupMetadata() {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';
    
    return {
      backup_id: crypto.randomUUID(),
      timestamp,
      environment,
      version: '5.1.0',
      retention_days: this.retentionDays,
      backup_type: 'media_metadata',
      source: {
        database: this.mongoUri.split('/').pop()?.split('?')[0],
        collections: ['files', 'songs', 'videos', 'bookImgs', 'albums', 'websites', 'articles']
      }
    };
  }

  /**
   * Backup files collection
   */
  async backupFilesCollection() {
    console.log('📁 Backing up files collection...');
    
    try {
      const files = await File.find({}).lean();
      
      this.backupReport.collections.files = {
        count: files.length,
        sample_fields: files.length > 0 ? Object.keys(files[0]) : [],
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${files.length} file documents`);
      return files;
    } catch (error) {
      console.error(`  ❌ Failed to backup files collection: ${error.message}`);
      this.backupReport.collections.files = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Files collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup songs collection
   */
  async backupSongsCollection() {
    console.log('🎵 Backing up songs collection...');
    
    try {
      const songs = await Song.find({}).populate('file').lean();
      
      this.backupReport.collections.songs = {
        count: songs.length,
        with_files: songs.filter(s => s.file).length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${songs.length} song documents (${this.backupReport.collections.songs.with_files} with files)`);
      return songs;
    } catch (error) {
      console.error(`  ❌ Failed to backup songs collection: ${error.message}`);
      this.backupReport.collections.songs = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Songs collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup videos collection
   */
  async backupVideosCollection() {
    console.log('🎬 Backing up videos collection...');
    
    try {
      const videos = await Video.find({}).populate('file').lean();
      
      this.backupReport.collections.videos = {
        count: videos.length,
        with_files: videos.filter(v => v.file).length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${videos.length} video documents (${this.backupReport.collections.videos.with_files} with files)`);
      return videos;
    } catch (error) {
      console.error(`  ❌ Failed to backup videos collection: ${error.message}`);
      this.backupReport.collections.videos = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Videos collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup bookImgs collection
   */
  async backupBookImgsCollection() {
    console.log('📖 Backing up bookImgs collection...');
    
    try {
      const bookImgs = await BookImg.find({}).populate('file').lean();
      
      this.backupReport.collections.bookImgs = {
        count: bookImgs.length,
        with_files: bookImgs.filter(b => b.file).length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${bookImgs.length} bookImg documents (${this.backupReport.collections.bookImgs.with_files} with files)`);
      return bookImgs;
    } catch (error) {
      console.error(`  ❌ Failed to backup bookImgs collection: ${error.message}`);
      this.backupReport.collections.bookImgs = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`BookImgs collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup albums collection
   */
  async backupAlbumsCollection() {
    console.log('💽 Backing up albums collection...');
    
    try {
      const albums = await Album.find({}).populate('image songs').lean();
      
      this.backupReport.collections.albums = {
        count: albums.length,
        with_images: albums.filter(a => a.image).length,
        with_songs: albums.filter(a => a.songs && a.songs.length > 0).length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${albums.length} album documents`);
      return albums;
    } catch (error) {
      console.error(`  ❌ Failed to backup albums collection: ${error.message}`);
      this.backupReport.collections.albums = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Albums collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup websites collection
   */
  async backupWebsitesCollection() {
    console.log('🌐 Backing up websites collection...');
    
    try {
      const websites = await Website.find({}).populate('image').lean();
      
      this.backupReport.collections.websites = {
        count: websites.length,
        with_images: websites.filter(w => w.image).length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${websites.length} website documents (${this.backupReport.collections.websites.with_images} with images)`);
      return websites;
    } catch (error) {
      console.error(`  ❌ Failed to backup websites collection: ${error.message}`);
      this.backupReport.collections.websites = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Websites collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Backup articles collection
   */
  async backupArticlesCollection() {
    console.log('📝 Backing up articles collection...');
    
    try {
      const articles = await Article.find({}).populate('image banner attachments').lean();
      
      const articlesWithFiles = articles.filter(a => 
        a.image || a.banner || (a.attachments && a.attachments.length > 0)
      );
      
      this.backupReport.collections.articles = {
        count: articles.length,
        with_files: articlesWithFiles.length,
        backup_status: 'success'
      };
      
      console.log(`  ✅ Found ${articles.length} article documents (${articlesWithFiles.length} with files)`);
      return articles;
    } catch (error) {
      console.error(`  ❌ Failed to backup articles collection: ${error.message}`);
      this.backupReport.collections.articles = {
        count: 0,
        backup_status: 'failed',
        error: error.message
      };
      this.backupReport.errors.push(`Articles collection backup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Create comprehensive backup data
   */
  async createBackupData() {
    const metadata = this.generateBackupMetadata();
    
    console.log('📊 Collecting data from all collections...');
    
    const [files, songs, videos, bookImgs, albums, websites, articles] = await Promise.all([
      this.backupFilesCollection(),
      this.backupSongsCollection(),
      this.backupVideosCollection(),
      this.backupBookImgsCollection(),
      this.backupAlbumsCollection(),
      this.backupWebsitesCollection(),
      this.backupArticlesCollection()
    ]);
    
    const backupData = {
      metadata,
      collections: {
        files,
        songs,
        videos,
        bookImgs,
        albums,
        websites,
        articles
      },
      statistics: {
        total_documents: files.length + songs.length + videos.length + 
                        bookImgs.length + albums.length + websites.length + articles.length,
        files_referenced: this.countReferencedFiles([songs, videos, bookImgs, albums, websites, articles]),
        backup_generated_at: new Date().toISOString()
      }
    };
    
    this.backupReport.summary.total_documents = backupData.statistics.total_documents;
    this.backupReport.summary.total_files = backupData.statistics.files_referenced;
    
    return backupData;
  }

  /**
   * Count referenced files across collections
   */
  countReferencedFiles(collections) {
    let count = 0;
    
    collections.forEach(collection => {
      collection.forEach(doc => {
        if (doc.file) count++;
        if (doc.image) count++;
        if (doc.banner) count++;
        if (doc.songs && Array.isArray(doc.songs)) {
          doc.songs.forEach(song => {
            if (song.file) count++;
          });
        }
        if (doc.attachments && Array.isArray(doc.attachments)) {
          count += doc.attachments.length;
        }
      });
    });
    
    return count;
  }

  /**
   * Upload backup to S3
   */
  async uploadBackupToS3(backupData, backupKey) {
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSize = Buffer.byteLength(backupJson, 'utf8');
    
    if (this.isDryRun) {
      console.log(`[DRY RUN] Would upload backup to S3:`);
      console.log(`  Key: ${backupKey}`);
      console.log(`  Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Documents: ${backupData.statistics.total_documents}`);
      
      this.backupReport.summary.backup_size_bytes = backupSize;
      this.backupReport.summary.s3_objects_created = 1;
      
      await this.writeLog({
        action: 'dry_run_backup_upload',
        backup_key: backupKey,
        backup_size_bytes: backupSize,
        backup_data: backupData.metadata
      });
      
      return { success: true, dryRun: true };
    }

    try {
      const tags = this.generateS3Tags(backupData.metadata);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: backupKey,
        Body: backupJson,
        ContentType: 'application/json',
        Metadata: {
          'backup-id': backupData.metadata.backup_id,
          'backup-type': backupData.metadata.backup_type,
          'environment': backupData.metadata.environment,
          'retention-days': this.retentionDays.toString(),
          'total-documents': backupData.statistics.total_documents.toString()
        },
        Tagging: tags
      });

      await this.client.send(command);
      
      console.log(`✅ Backup uploaded to S3: ${backupKey}`);
      console.log(`   Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Documents: ${backupData.statistics.total_documents}`);
      
      this.backupReport.summary.backup_size_bytes = backupSize;
      this.backupReport.summary.s3_objects_created = 1;
      
      await this.writeLog({
        action: 'backup_uploaded',
        backup_key: backupKey,
        backup_size_bytes: backupSize,
        s3_metadata: command.input.Metadata,
        backup_data: backupData.metadata
      });
      
      return { success: true, key: backupKey, size: backupSize };
    } catch (error) {
      console.error(`❌ Failed to upload backup to S3: ${error.message}`);
      this.backupReport.errors.push(`S3 upload failed: ${error.message}`);
      
      await this.writeLog({
        action: 'backup_upload_failed',
        backup_key: backupKey,
        error: error.message,
        error_code: error.name
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate S3 tags for backup object
   */
  generateS3Tags(metadata) {
    const tags = [
      `BackupType=${metadata.backup_type}`,
      `Environment=${metadata.environment}`,
      `RetentionDays=${this.retentionDays}`,
      `BackupDate=${metadata.timestamp.split('T')[0]}`,
      `Version=${metadata.version}`
    ];
    
    return tags.join('&');
  }

  /**
   * Generate backup key (S3 object key)
   */
  generateBackupKey(metadata) {
    const date = metadata.timestamp.split('T')[0];
    const time = metadata.timestamp.split('T')[1].split('.')[0].replace(/:/g, '-');
    const environment = metadata.environment;
    
    return `${this.backupPrefix}${environment}/${date}/media-backup-${date}-${time}-${metadata.backup_id.split('-')[0]}.json`;
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    if (this.isDryRun) {
      console.log('[DRY RUN] Would clean up old backups based on retention policy');
      return;
    }

    console.log('🧹 Cleaning up old backups...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let continuationToken = null;
      let deletedCount = 0;
      
      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: this.backupPrefix,
          ContinuationToken: continuationToken
        });
        
        const response = await this.client.send(listCommand);
        const objects = response.Contents || [];
        
        for (const obj of objects) {
          if (obj.LastModified && obj.LastModified < cutoffDate) {
            console.log(`  Marking for deletion: ${obj.Key} (${obj.LastModified.toISOString()})`);
            // Note: In a real implementation, you'd batch delete these objects
            // For now, we just count them
            deletedCount++;
          }
        }
        
        continuationToken = response.NextContinuationToken;
        
      } while (continuationToken);
      
      if (deletedCount > 0) {
        console.log(`  ℹ️  Found ${deletedCount} old backups that could be deleted`);
        this.backupReport.warnings.push(`${deletedCount} old backups found (older than ${this.retentionDays} days)`);
      } else {
        console.log('  ✅ No old backups found for cleanup');
      }
      
      await this.writeLog({
        action: 'cleanup_old_backups',
        retention_days: this.retentionDays,
        old_backups_found: deletedCount,
        cutoff_date: cutoffDate.toISOString()
      });
      
    } catch (error) {
      console.warn(`Warning: Could not clean up old backups: ${error.message}`);
      this.backupReport.warnings.push(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Run complete backup process
   */
  async run() {
    try {
      console.log('💾 Media Backup Tool');
      console.log('===================');
      console.log(`Bucket: ${this.bucketName}`);
      console.log(`MongoDB: ${this.mongoUri.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
      console.log(`Mode: ${this.isDryRun ? 'DRY RUN' : 'LIVE'}`);
      console.log(`Logging: ${this.shouldLog ? 'Enabled' : 'Disabled'}`);
      console.log(`Retention: ${this.retentionDays} days`);
      console.log('');

      // Initialize
      await this.initializeLogging();
      this.validateEnvironment();
      
      // Connect to MongoDB
      const mongoConnected = await this.connectToMongoDB();
      if (!mongoConnected) {
        throw new Error('Could not connect to MongoDB');
      }
      
      try {
        // Create backup data
        const backupData = await this.createBackupData();
        const backupKey = this.generateBackupKey(backupData.metadata);
        
        // Upload to S3
        const uploadResult = await this.uploadBackupToS3(backupData, backupKey);
        
        if (!uploadResult.success) {
          throw new Error(`Backup upload failed: ${uploadResult.error}`);
        }
        
        // Clean up old backups
        await this.cleanupOldBackups();
        
        // Summary
        console.log('');
        console.log('📊 Backup Summary');
        console.log('================');
        console.log(`Backup ID: ${backupData.metadata.backup_id}`);
        console.log(`Total Documents: ${this.backupReport.summary.total_documents}`);
        console.log(`Referenced Files: ${this.backupReport.summary.total_files}`);
        console.log(`Backup Size: ${(this.backupReport.summary.backup_size_bytes / 1024 / 1024).toFixed(2)} MB`);
        
        if (!this.isDryRun) {
          console.log(`S3 Key: ${backupKey}`);
        }
        
        // Collection details
        console.log('');
        console.log('📁 Collection Details:');
        Object.entries(this.backupReport.collections).forEach(([name, info]) => {
          const status = info.backup_status === 'success' ? '✅' : '❌';
          console.log(`  ${status} ${name}: ${info.count} documents`);
        });
        
        if (this.backupReport.warnings.length > 0) {
          console.log('');
          console.log('⚠️  Warnings:');
          this.backupReport.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        if (this.backupReport.errors.length > 0) {
          console.log('');
          console.log('❌ Errors:');
          this.backupReport.errors.forEach(error => console.log(`  - ${error}`));
        }

        await this.writeLog({
          action: 'backup_completed',
          backup_report: this.backupReport
        });

        console.log('');
        if (this.backupReport.errors.length > 0) {
          console.log('❌ Backup completed with errors');
          return false;
        } else {
          console.log('✅ Backup completed successfully');
          return true;
        }
        
      } finally {
        await this.disconnectFromMongoDB();
      }
      
    } catch (error) {
      console.error(`❌ Fatal error: ${error.message}`);
      
      await this.writeLog({
        action: 'fatal_error',
        error: error.message,
        error_code: error.name,
        stack: error.stack
      });
      
      return false;
    }
  }
}

// CLI Interface
function printUsage() {
  console.log('Media Backup Tool');
  console.log('==============================');
  console.log('');
  console.log('Usage:');
  console.log('  node utility/create-media-backup.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run                Show what would be backed up without doing it');
  console.log('  --log                    Enable logging to logs/operations/');
  console.log('  --retention=DAYS         Set backup retention period (default: 90 days)');
  console.log('  --help                   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  # Create backup with default settings');
  console.log('  node utility/create-media-backup.js');
  console.log('');
  console.log('  # Dry run with logging');
  console.log('  node utility/create-media-backup.js --dry-run --log');
  console.log('');
  console.log('  # Backup with custom retention period');
  console.log('  node utility/create-media-backup.js --retention=30');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  S3_BUCKET_NAME          S3 bucket for backup storage');
  console.log('  S3_ACCESS_KEY_ID        AWS access key ID');
  console.log('  S3_SECRET_ACCESS_KEY    AWS secret access key');
  console.log('  MONGO_URI               MongoDB connection string');
  console.log('  S3_REGION               AWS region (optional, defaults to us-east-1)');
  console.log('');
}

function parseArgs(args) {
  const config = {
    dryRun: false,
    log: false,
    retention: 90,
    help: false
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--log') {
      config.log = true;
    } else if (arg.startsWith('--retention=')) {
      const retention = parseInt(arg.substring(12));
      if (isNaN(retention) || retention < 1) {
        throw new Error('Retention must be a positive number of days');
      }
      config.retention = retention;
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

  const backupManager = new MediaBackupManager();
  backupManager.isDryRun = config.dryRun;
  backupManager.shouldLog = config.log;
  backupManager.retentionDays = config.retention;

  const success = await backupManager.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = MediaBackupManager;