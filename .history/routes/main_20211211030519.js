'use strict';

// Modules
var express = require('express');
var MainController = require('../controllers/main');

var router = express.Router();
var md_auth = require('../middlewares/authenticated');
var md_admin = require('../middlewares/is_admin');

var multer = require('multer');
var md_upload = multer({ dest: './uploads/main' });
var md_upload = md_upload.any();

// Rutas de prueba
router.get('/datos-autor', MainController.datosAutor);

// Create
router.post('/album', MainController.createAlbum);
router.post('/book-img', MainController.createBookImg);
router.post('/cv-section', MainController.createCVSection);
router.post('/cv-sub-section', MainController.createCVSubSection);
router.post('/song', MainController.createSong);
router.post('/video', MainController.createVideo);
router.post('/web-site', MainController.createWebsite);

// Get
router.get('/albums', MainController.getAlbums);
router.get('/book-imgs', MainController.getBookImgs);
router.get('/main', MainController.getMain);
router.get('/cv-sections', MainController.getCVSections);
router.get('/songs', MainController.getSongs);
router.get('/videos', MainController.getVideos);
router.get('/web-sites', MainController.getWebsites);

// Update
router.put('/main', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateMain);
router.put('/cv-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateCVSection);
router.put('/cv-sub-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateCVSubSection);

// Delete
router.delete('/cv-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.deleteCVSection);
router.delete('/cv-sub-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.deleteCVSubSection);

// Files
router.post("/upload-file-main/:id", [md_auth.ensureAuth, md_admin.isAdmin, md_upload], MainController.UploadFileMain);
router.get("/get-file/:file", MainController.getFile);

module.exports = router;