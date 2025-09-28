"use strict";

/* Modules */
var express = require("express");
var MainController = require("../controllers/main");

var router = express.Router();
var md_auth = require("../middlewares/authenticated");
var md_admin = require("../middlewares/is_admin");

var multer = require("multer");
const { S3ErrorHandler } = require('../services/s3ErrorHandler');

// Use memory storage for direct S3 streaming uploads
var md_upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // Max 10 files per request
  }
});

// Error handling middleware for multer
const multerErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        message: 'File too large',
        code: 'FILE_TOO_LARGE',
        details: 'File size exceeds 100MB limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files',
        code: 'TOO_MANY_FILES', 
        details: 'Maximum 10 files per request'
      });
    }
  }
  return S3ErrorHandler.handleUploadError(error, req, res, next);
};

var md_upload = md_upload.any();

/* Rutas de prueba */
router.get("/datos-autor", MainController.datosAutor);

/* Create */
router.post(
  "/album",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createAlbum
);
router.post(
  "/book-img",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createBookImg
);
router.post(
  "/cv-section",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createCVSection
);
router.post(
  "/cv-sub-section",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createCVSubSection
);
router.post(
  "/song",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createSong
);
router.post(
  "/video",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createVideo
);
router.post(
  "/web-site",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.createWebsite
);

/* Get */
router.get("/albums", MainController.getAlbums);
router.get("/book-imgs", MainController.getBookImgs);
router.get("/cv-sections", MainController.getCVSections);
router.get("/main", MainController.getMain);
router.get("/songs", MainController.getSongs);
router.get("/videos", MainController.getVideos);
router.get("/web-sites", MainController.getWebsites);
router.post("/login", MainController.login);

/* Update */
router.put(
  "/album/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateAlbum
);
router.put(
  "/book-img/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateBookImg
);
router.put(
  "/cv-section/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateCVSection
);
router.put(
  "/cv-sub-section/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateCVSubSection
);
router.put(
  "/main",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateMain
);
router.put(
  "/song/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateSong
);
router.put(
  "/video/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateVideo
);
router.put(
  "/web-site/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.updateWebsite
);

/* Delete */
router.delete(
  "/album/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteAlbum
);
router.delete(
  "/book-img/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteBookImg
);
router.delete(
  "/cv-section/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteCVSection
);
router.delete(
  "/cv-sub-section/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteCVSubSection
);
router.delete(
  "/song/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteSong
);
router.delete(
  "/video/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteVideo
);
router.delete(
  "/web-site/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  MainController.deleteWebsite
);

/* Files */
router.post(
  "/upload-file-album/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload, 
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileAlbum
);
router.post(
  "/upload-file-book-img/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload,
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileBookImg
);
router.post(
  "/upload-file-main/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload,
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileMain
);
router.post(
  "/upload-file-song/:id/:option",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload,
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileSong
);
router.post(
  "/upload-file-video/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload,
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileVideo
);
router.post(
  "/upload-file-web-site/:id/:option",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload,
   S3ErrorHandler.validateUploadPrerequisites, multerErrorHandler],
  MainController.UploadFileWebsite
);
router.get("/get-file/:id", MainController.getFile);
router.get("/file-info/:id", MainController.getFileInfo);

/* S3 Status Endpoint */
// S3 status endpoint for health monitoring
router.get("/s3-status", (req, res) => {
  try {
    const s3Service = require('../services/s3');
    const s3Configured = s3Service.isConfigured();
    const cloudfrontConfigured = s3Service.isCloudFrontConfigured();
    
    res.status(200).json({
      success: s3Configured,
      s3Configured: s3Configured,
      cloudfrontConfigured: cloudfrontConfigured,
      storageMode: 's3-only',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
