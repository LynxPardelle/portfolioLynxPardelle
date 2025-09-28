"use strict";

// Load environment variables first
require('dotenv').config();

//Cargar modulos de node para crear servidos
var express = require("express");
var cors = require("cors");

// Import S3 service for configuration validation
const s3Service = require("./services/s3");

/* Ejecutar express (http) */
var app = express();

/* Cargar rutas */
var main_routes = require("./routes/main");
var article_routes = require("./routes/article");
var performance_routes = require("./routes/performance");

/* Middlewares de body-parser */
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

/* Config cabeceras y CORS */
const allowedDomains = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(
  cors({
    origin: function (origin, callback) {
      /* bypass the requests with no origin (like curl requests, mobile apps, etc ) */
      if (!origin) return callback(null, true);

      if (allowedDomains.indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. 
        Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

/* Environment Configuration Validation */
function validateEnvironmentConfig() {
  console.log('\n🔧 Environment Configuration Validation');
  console.log('=' .repeat(50));
  
  // Basic environment info
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN ? '***configured***' : 'not set'}`);
  
  // S3 Configuration
  console.log('\n📦 S3 Storage Configuration:');
  console.log(`S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'NOT SET'}`);
  console.log(`S3_REGION: ${process.env.S3_REGION || 'NOT SET'}`);
  console.log(`S3_ACCESS_KEY_ID: ${process.env.S3_ACCESS_KEY_ID ? '***configured***' : 'NOT SET'}`);
  console.log(`S3_SECRET_ACCESS_KEY: ${process.env.S3_SECRET_ACCESS_KEY ? '***configured***' : 'NOT SET'}`);
  console.log(`S3_ENDPOINT: ${process.env.S3_ENDPOINT || 'NOT SET'}`);
  console.log(`S3_UPLOAD_PREFIX: ${process.env.S3_UPLOAD_PREFIX || 'NOT SET'}`);
  console.log(`S3_KMS_KEY_ARN: ${process.env.S3_KMS_KEY_ARN || 'not configured (optional)'}`);
  
  // CloudFront Configuration
  console.log('\n🌐 CloudFront CDN Configuration:');
  console.log(`CLOUDFRONT_DOMAIN: ${process.env.CLOUDFRONT_DOMAIN || 'NOT SET'}`);
  console.log(`CLOUDFRONT_DISTRIBUTION_ID: ${process.env.CLOUDFRONT_DISTRIBUTION_ID || 'NOT SET'}`);
  
  // AWS IAM Configuration
  console.log('\n🔐 AWS IAM Configuration:');
  console.log(`AWS_ROLE_TO_ASSUME: ${process.env.AWS_ROLE_TO_ASSUME || 'not configured (optional)'}`);
  
  // S3 Service Status
  console.log('\n✅ S3 Service Status:');
  const s3Configured = s3Service.isConfigured();
  console.log(`S3 Service: ${s3Configured ? '✅ READY' : '❌ NOT CONFIGURED'}`);
  
  if (!s3Configured) {
    console.warn('\n⚠️  WARNING: S3 is not properly configured!');
    console.warn('   File uploads will fall back to local storage.');
    console.warn('   Please configure S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_REGION.');
  } else {
    console.log('✅ S3 configuration validated successfully!');
  }
  
  // CloudFront Status
  const cloudfrontConfigured = !!(process.env.CLOUDFRONT_DOMAIN && process.env.CLOUDFRONT_DISTRIBUTION_ID);
  console.log(`CloudFront CDN: ${cloudfrontConfigured ? '✅ READY' : '❌ NOT CONFIGURED'}`);
  
  if (!cloudfrontConfigured) {
    console.warn('\n⚠️  WARNING: CloudFront is not properly configured!');
    console.warn('   Assets will be served directly from S3.');
    console.warn('   Please configure CLOUDFRONT_DOMAIN and CLOUDFRONT_DISTRIBUTION_ID for optimal performance.');
  } else {
    console.log('✅ CloudFront configuration validated successfully!');
  }
  
  console.log('=' .repeat(50));
}

// Validate environment on startup
validateEnvironmentConfig();

/* rutas body-parser */
/* Ruta o método de prueba para el API */
app.get("/", (req, res) => {
  console.log("Hello world from Lynx Portfolio API.");
  return res.status(200).send({
    author: "Lynx Pardelle",
    url: "https://www.lynxpardelle.com",
  });
});
app.use("/api/main", main_routes);
app.use("/api/article", article_routes);
app.use("/api/performance", performance_routes);

// Add canary deployment routes
try {
  const canary_routes = require("./routes/canary");
  app.use("/api/canary", canary_routes);
} catch (error) {
  console.warn('Canary routes not available:', error.message);
}

// Add monitoring window routes
try {
  const monitoring_routes = require("./routes/monitoring");
  app.use("/api/monitoring", monitoring_routes);
} catch (error) {
  console.warn('Monitoring routes not available:', error.message);
}

// Add rollback management routes
try {
  const rollback_routes = require("./routes/rollback");
  app.use("/api/rollback", rollback_routes);
} catch (error) {
  console.warn('Rollback routes not available:', error.message);
}

// Health endpoint for S3-only application (moved here so it's not shadowed by the catch-all route)
app.get('/health', (req, res) => {
  try {
    // Basic health response for S3-only mode
    const health = {
      status: 'ok',
      app: 'lynx-portfolio-back',
      timestamp: new Date().toISOString(),
      storage: {
        mode: 's3-only',
        bucket: process.env.S3_BUCKET_NAME || 'not-configured',
        region: process.env.S3_REGION || 'not-configured',
        cdnDomain: process.env.CLOUDFRONT_DOMAIN || 'not-configured'
      }
    };
    
    res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      app: 'lynx-portfolio-back',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

module.exports = app;
