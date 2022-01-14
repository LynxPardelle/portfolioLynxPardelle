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
router.post('/cv-section', MainController.createCVSection);
router.post('/cv-sub-section', MainController.createCVSubSection);

// Get
router.get('/main', MainController.getMain);
router.get('/sections', MainController.getCVSections);

// Update
router.put('/main', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateMain);
router.put('/cv-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateCVSection);
router.put('/cv-sub-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.updateCVSubSection);

// Delete
router.delete('/cv-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.deleteCVSection);
router.delete('/cv-sub-section/:id', [md_auth.ensureAuth, md_admin.isAdmin], MainController.deleteCVSubSection);

// Files
router.post("/upload-file-main/:id", [md_auth.ensureAuth, md_admin.isAdmin, md_upload], MainController.UploadFile);
router.get("/get-file/:file", MainController.getFile);

module.exports = router;