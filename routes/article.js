"use strict";

// Modules
const [express, ArticleController, md_auth, md_admin, multer] = [
  require("express"),
  require("../controllers/article"),
  require("../middlewares/authenticated"),
  require("../middlewares/is_admin"),
  require("multer"),
];
const router = express.Router();
const md_upload = multer({ dest: "./uploads/article" }).any();

// Rutas de prueba
router.get("/datos-autor", ArticleController.datosAutor);

// Create
router.post(
  "/article",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.createArticle
);
router.post(
  "/articleSection",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.createArticleSection
);
router.post(
  "/articleCat",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.createArticleCat
);
router.post(
  "/articleSubCat",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.createArticleSubCat
);

// Read
router.get("/article/:id", ArticleController.getArticle);
router.get("/article-cats", ArticleController.getArticlesCats);
router.get(
  "/articles/:page?/:ipp?/:sort?/:rootAccess?/:type?/:search?",
  ArticleController.getArticles
);

// Put
router.put(
  "/article/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.updateArticle
);
router.put(
  "/article-cat/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.updateArticleCat
);
router.put(
  "/article-sub-cat/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.updateArticleSubCat
);
router.put(
  "/article-section/:id",
  [md_auth.ensureAuth, md_admin.isAdmin],
  ArticleController.updateArticleSection
);

// Delete
router.delete("/article/:id", ArticleController.deleteArticle);
router.delete("/articleSection/:id", ArticleController.deleteArticleSection);
router.delete("/articleCat/:id", ArticleController.deleteArticleCat);
router.delete("/articleSubCat/:id", ArticleController.deleteArticleSubCat);

// Files
router.post(
  "/upload-file-article/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  ArticleController.UploadFileArticle
);
router.post(
  "/upload-file-articleSection/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  ArticleController.UploadFileArticleSectionPrincipalFile
);
router.post(
  "/upload-files-articleSection/:id",
  [md_auth.ensureAuth, md_admin.isAdmin, md_upload],
  ArticleController.UploadFilesArticleSection
);

module.exports = router;
