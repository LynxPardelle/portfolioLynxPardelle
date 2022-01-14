"use strict";

// Modules
var express = require("express");
var MainController = require("../controllers/main");

var router = express.Router();
var md_auth = require("../middlewares/authenticated");
var md_admin = require("../middlewares/is_admin");

var multer = require("multer");
var md_upload = multer({ dest: "./uploads/main" });
var md_upload = md_upload.any();

// Rutas de prueba
router.get("/datos-autor", MainController.datosAutor);

// Create
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

// Get
router.get("/albums", MainController.getAlbums);
router.get("/book-imgs", MainController.getBookImgs);
router.get("/cv-sections", MainController.getCVSections);
router.get("/main", MainController.getMain);
router.get("/songs", MainController.getSongs);
router.get("/videos", MainController.getVideos);
router.get("/web-sites", MainController.getWebsites);

// Update
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

// Delete
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

// Files
router.post(
  "/upload-file-album/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileAlbum
);
router.post(
  "/upload-file-book-img/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileBookImg
);
router.post(
  "/upload-file-main/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileMain
);
router.post(
  "/upload-file-song/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileSong
);
router.post(
  "/upload-file-video/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileVideo
);
router.post(
  "/upload-file-web-site/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  MainController.UploadFileWebsite
);
router.get("/get-file/:file", MainController.getFile);

module.exports = router;
