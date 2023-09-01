"use strict";

/* Modulos */
const [validator, bcrypt, fs, path] = [
  require("validator"),
  require("bcrypt"),
  require("fs"),
  require("path"),
];

/* Modelos */
const [Article, ArticleSection, ArticleCat, ArticleSubCat] = [
  require("../models/article"),
  require("../models/articleSection"),
  require("../models/articleCat"),
  require("../models/articleSubCat"),
];
/* Services */
const [_utility, _mail] = [
  require("../services/utility"),
  require("../services/mail"),
];

const populate = require("../populate/populate");

/* jwt */
const jwt = require("../services/jwt");

/* Key */
const secret = require("../keys/secret");

const controller = {
  datosAutor: (req, res) => {
    return res.status(200).send({
      autor: "Lynx Pardelle",
      url: "https://www.lynxpardelle.com",
    });
  },

  /* Create */
  async createArticle(req, res) {
    let nError = 500;
    try {
      const body = req.body;
      try {
        const validate = (value) => {
          return !validator.isEmpty(value);
        };
        const val_urltitle = validate(body.urltitle);
      } catch (error) {
        throw new Error(`¡faltan datos por enviar!,
        val_title: ${val_title},
        val_titleEng: ${val_titleEng},
        val_urltitle: ${val_urltitle},
        `);
      }
      let article = new Article();
      article.title = body.title;
      article.titleEng = body.titleEng;
      article.subtitle = body.subtitle;
      article.subtitleEng = body.subtitleEng;
      article.insertions = body.insertions;
      article.cat = body.cat;
      article.subCats = body.subCats;
      article.intro = body.intro;
      article.introEng = body.introEng;
      article.outro = body.outro;
      article.outroEng = body.outroEng;
      article.sections = body.sections;
      article.tags = body.tags;
      article.urltitle = body.urltitle;
      article.coverImg = body.coverImg;
      article.titleColor = body.titleColor;
      article.textColor = body.textColor;
      article.linkColor = body.linkColor;
      article.bgColor = body.bgColor;
      article.langs = body.langs;
      article.create_at = body.create_at;
      const articleStored = await article.save();
      if (articleStored) {
        nError = 404;
        throw new Error("No se guardó el artículo.");
      }
      return res.status(200).send({
        status: "success",
        article: articleStored,
      });
    } catch (err) {
      console.log(err);
      return res.status(nError).send({
        status: "error",
        message: err.message,
        err: err,
      });
    }
  },

  async createArticleSection(req, res) {
    let nError = 500;
    try {
      const body = req.body;
      if (!body.article) {
        throw new Error(`¡Falta link de artículo!`);
      }
      let articleSection = new ArticleSection();
      articleSection.title = body.title;
      articleSection.titleEng = body.titleEng;
      articleSection.text = body.text;
      articleSection.textEng = body.textEng;
      articleSection.article = body.article;
      articleSection.principalFile = body.principalFile;
      articleSection.files = body.files;
      articleSection.order = body.order;
      articleSection.titleColor = body.titleColor;
      articleSection.textColor = body.textColor;
      articleSection.linkColor = body.linkColor;
      articleSection.bgColor = body.bgColor;
      articleSection.show = body.show;
      articleSection.insertions = body.insertions;
      const articleSectionStored = await articleSection.save();
      if (articleSectionStored) {
        nError = 404;
        throw new Error("No se guardó la sección del artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleSection: articleSectionStored,
      });
    } catch (err) {
      console.log(err);
      return res.status(nError).send({
        status: "error",
        message: err.message,
        err: err,
      });
    }
  },

  async createArticleCat(req, res) {
    let nError = 500;
    try {
      const body = req.body;
      try {
        const validate = (value) => {
          return !validator.isEmpty(value);
        };
        const [val_title, val_titleEng] = [
          validate(body.title),
          validate(body.titleEng),
        ];
      } catch (error) {
        throw new Error(`¡faltan datos por enviar!,
        val_title: ${val_title},
        val_titleEng: ${val_titleEng},
        `);
      }
      let articleCat = new ArticleCat();
      articleCat.title = body.title;
      articleCat.titleEng = body.titleEng;
      articleCat.titleColor = body.titleColor;
      articleCat.textColor = body.textColor;
      articleCat.textColor2 = body.textColor2;
      articleCat.linkColor = body.linkColor;
      articleCat.linkColor2 = body.linkColor2;
      articleCat.bgColor = body.bgColor;
      articleCat.bgColor2 = body.bgColor2;
      articleCat.subCats = body.subCats;
      articleCat.show = body.show;
      articleCat.create_at = body.create_at;
      const articleCatStored = await articleCat.save();
      if (articleCatStored) {
        nError = 404;
        throw new Error("No se guardó la categoría de artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleCat: articleCatStored,
      });
    } catch (err) {
      console.log(err);
      return res.status(nError).send({
        status: "error",
        message: err.message,
        err: err,
      });
    }
  },

  async createArticleSubCat(req, res) {
    let nError = 500;
    try {
      const body = req.body;
      try {
        const validate = (value) => {
          return !validator.isEmpty(value);
        };
        const [val_title, val_titleEng] = [
          validate(body.title),
          validate(body.titleEng),
        ];
      } catch (error) {
        throw new Error(`¡faltan datos por enviar!,
        val_title: ${val_title},
        val_titleEng: ${val_titleEng},
        `);
      }
      let articleSubCat = new ArticleSubCat();
      articleSubCat.title = body.title;
      articleSubCat.titleEng = body.titleEng;
      articleSubCat.titleColor = body.titleColor;
      articleSubCat.buttonColor = body.buttonColor;
      articleSubCat.cat = body.cat;
      articleSubCat.show = body.show;
      articleSubCat.create_at = body.create_at;
      const articleSubCatStored = await articleSubCat.save();
      if (articleSubCatStored) {
        nError = 404;
        throw new Error("No se guardó la sub-categoría de artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleSubCat: articleSubCatStored,
      });
    } catch (err) {
      console.log(err);
      return res.status(nError).send({
        status: "error",
        message: err.message,
        err: err,
      });
    }
  },

  /* Read */
  async getArticles(req, res) {
    let nError = 500;
    try {
      let page = 0;
      let itemsPerPage = 0;
      let skip = 0;
      let limit = 0;
      let sort = "-create_at";
      let json = {};
      let rootAccess = "all";
      let type = "all";
      if (req.params.page) {
        page = req.params.page;
      }
      if (req.params.ipp) {
        itemsPerPage = parseInt(req.params.ipp);
      }
      skip = page - 1;
      if (skip < 0) {
        skip = 0;
      }
      skip = skip * itemsPerPage;
      limit = itemsPerPage * page;
      if (req.params.sort) {
        sort = req.params.sort;
      }
      if (req.params.rootAccess) {
        rootAccess = req.params.rootAccess;
      }
      if (req.params.type && req.params.type !== "all") {
        json = { articleCat: req.params.type };
      }
      let articles = [];
      if (req.params.search) {
        articles = await controller.DoGetArticlesSearch(
          req.params.search,
          skip,
          limit,
          sort,
          rootAccess
        );
      } else {
        articles = await controller.DoGetArticles(json, skip, limit, sort);
      }
      if (articles && articles.articles && articles.total !== 0) {
        if (!req.params.ipp || parseInt(req.params.ipp) === 0) {
          itemsPerPage = articles.total;
        }
        return res.status(200).send({
          status: "success",
          total_items: articles.total,
          pages: Math.ceil(articles.total / itemsPerPage),
          articles: articles.articles,
        });
      } else {
        return res.status(404).send({
          status: "error",
          message: "No hay artículos.",
        });
      }
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los artículos.",
        error_message: err.message,
        err: err,
      });
    }
  },

  async getArticlesCats(req, res) {
    var nError = 500;
    try {
      const articleCats = await ArticleCat.find()
        .populate(populate.articleCat)
        .sort("order");
      if (!articleCats) {
        nError = 404;
        throw new Error("No hay categorías de artículos.");
      }
      return res.status(200).send({
        status: "success",
        articleCats: articleCats,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver las categorías de artículos.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getArticle(req, res) {
    let nError = 500;
    try {
      const articleId = req.params.id;
      const article = await controller
        .DoGetArticle(articleId)
        .populate(populate.article);
      if (!article) {
        nError = 404;
        throw new Error("No hay artículo.");
      }
      return res.status(200).send({
        status: "success",
        article: article,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver el artículo.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  /* Update */
  async updateArticle(req, res) {
    let nError = 500;
    try {
      const update = req.body;
      const articleId = req.params.id;
      const article = await Article.findById(articleId).populate(
        populate.article
      );
      if (!article) {
        nError = 404;
        throw new Error("No hay artículo.");
      }
      const articleUpdated = await Article.findByIdAndUpdate(
        articleId,
        update,
        {
          new: true,
        }
      ).populate(populate.article);
      if (!articleUpdated) {
        nError = 404;
        throw new Error("No se actualizó el artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleUpdated: articleUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver el artículo.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateArticleSection(req, res) {
    let nError = 500;
    try {
      const update = req.body;
      const articleSectionId = req.params.id;
      const articleSection = await Article.findById(articleSectionId).populate(
        populate.articleSection
      );
      if (!articleSection) {
        nError = 404;
        throw new Error("No hay sección del artículo.");
      }
      const articleSectionUpdated = await ArticleSection.findByIdAndUpdate(
        articleSectionId,
        update,
        {
          new: true,
        }
      ).populate(populate.articleSection);
      if (!articleSectionUpdated) {
        nError = 404;
        throw new Error("No se actualizó la sección del artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleSectionUpdated: articleSectionUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver la sección del artículo.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateArticleCat(req, res) {
    let nError = 500;
    try {
      const update = req.body;
      const articleCatId = req.params.id;
      const articleCat = await ArticleCat.findById(articleCatId).populate(
        populate.articleCat
      );
      if (!articleCat) {
        nError = 404;
        throw new Error("No hay categoría de artículo.");
      }
      const articleCatUpdated = await ArticleCat.findByIdAndUpdate(
        articleCatId,
        update,
        {
          new: true,
        }
      ).populate(populate.articleCat);
      if (!articleCatUpdated) {
        nError = 404;
        throw new Error("No se actualizó la categoría de artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleUpdated: articleCatUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver la categoría de artículo.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateArticleSubCat(req, res) {
    let nError = 500;
    try {
      const update = req.body;
      const articleSubCatId = req.params.id;
      const articleSubCat = await ArticleSubCat.findById(
        articleSubCatId
      ).populate(populate.articleSubCat);
      if (!articleSubCat) {
        nError = 404;
        throw new Error("No hay sub-categoría de artículo.");
      }
      const articleSubCatUpdated = await ArticleSubCat.findByIdAndUpdate(
        articleSubCatId,
        update,
        {
          new: true,
        }
      ).populate(populate.articleSubCat);
      if (!articleSubCatUpdated) {
        nError = 404;
        throw new Error("No se actualizó la sub-categoría de artículo.");
      }
      return res.status(200).send({
        status: "success",
        articleUpdated: articleSubCatUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver la sub-categoría de artículo.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  /* Delete */
  async deleteArticle(req, res) {
    let nError = 500;
    try {
      const articleId = req.params.id;
      const article = await Article.findById(articleId).populate(
        populate.article
      );

      if (!article) {
        nError = 404;
        throw new Error("No se encontró nada.");
      }

      let Errors = [];
      if (article.sections && article.sections[0]) {
        for (let section of article.sections) {
          let sectionId = section._id;
          let sectionToErase = await ArticleSection.findById(
            sectionId
          ).populate(populate.articleSection);
          if (!sectionToErase) {
            Errors.push(`No section to delete. ${section._id}: ${section}`);
          } else {
            if (sectionToErase.principalFile) {
              let path_file =
                "./uploads/article" + sectionToErase.principalFile.location;
              try {
                fs.exists(path_file, (exist, err) => {
                  if (exist) {
                    fs.unlink(path_file, (err) => {
                      if (err) {
                        throw new Error("error", "Error al borrar archivo.");
                      }
                    });
                  }
                });
              } catch (e) {
                throw new Error(
                  "error",
                  "Error al borrar archivo ./uploads/article" +
                    sectionToErase.principalFile.location
                );
              }
              let fileRemoved = await File.findOneAndDelete({
                _id: sectionToErase.principalFile._id,
              });
            }
            if (sectionToErase.files && sectionToErase.files[0]) {
              for (let file of sectionToErase.files) {
                let path_file = "./uploads/article" + file.location;
                try {
                  fs.exists(path_file, (exist, err) => {
                    if (exist) {
                      fs.unlink(path_file, (err) => {
                        if (err) {
                          throw new Error("error", "Error al borrar archivo.");
                        }
                      });
                    }
                  });
                } catch (e) {
                  throw new Error(
                    "error",
                    "Error al borrar archivo ./uploads/article" + file.location
                  );
                }
                let fileRemoved = await File.findOneAndDelete({
                  _id: file._id,
                });
              }
            }
            let sectionDeleted = await ArticleSection.findByIdAndDelete(
              sectionId
            );
          }
        }
      }
      if (article.coverImg) {
        let path_file = "./uploads/article" + article.coverImg.location;
        try {
          fs.exists(path_file, (exist, err) => {
            if (exist) {
              fs.unlink(path_file, (err) => {
                if (err) {
                  throw new Error("error", "Error al borrar archivo.");
                }
              });
            }
          });
        } catch (e) {
          throw new Error(
            "error",
            "Error al borrar archivo ./uploads/article" +
              article.coverImg.location
          );
        }
        let fileRemoved = await File.findOneAndDelete({
          _id: article.coverImg._id,
        });
      }

      const articleDeleted = await Article.findByIdAndDelete(articleId);

      if (!articleDeleted) {
        nError = 404;
        throw new Error("No se eliminó el artículo.");
      }

      return res.status(200).send({
        status: "success",
        Errors: Errors,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err: err,
      });
    }
  },

  async deleteArticleSection(req, res) {
    let nError = 500;
    try {
      const articleSectionId = req.params.id;
      const articleSection = await ArticleSection.findById(
        articleSectionId
      ).populate(populate.article);

      if (!articleSection) {
        nError = 404;
        throw new Error("No se encontró nada.");
      }

      if (articleSection.principalFile) {
        let path_file =
          "./uploads/article" + articleSection.principalFile.location;
        try {
          fs.exists(path_file, (exist, err) => {
            if (exist) {
              fs.unlink(path_file, (err) => {
                if (err) {
                  throw new Error("error", "Error al borrar archivo.");
                }
              });
            }
          });
        } catch (e) {
          throw new Error(
            "error",
            "Error al borrar archivo ./uploads/article" +
              articleSection.principalFile.location
          );
        }
        let fileRemoved = await File.findOneAndDelete({
          _id: sectionToErase.principalFile._id,
        });
      }
      if (articleSection.files && articleSection.files[0]) {
        for (let file of articleSection.files) {
          let path_file = "./uploads/article" + file.location;
          try {
            fs.exists(path_file, (exist, err) => {
              if (exist) {
                fs.unlink(path_file, (err) => {
                  if (err) {
                    throw new Error("error", "Error al borrar archivo.");
                  }
                });
              }
            });
          } catch (e) {
            throw new Error(
              "error",
              "Error al borrar archivo ./uploads/article" + file.location
            );
          }
          let fileRemoved = await File.findOneAndDelete({
            _id: file._id,
          });
        }
      }

      const articleSectionDeleted = await ArticleSection.findByIdAndDelete(
        articleSectionId
      );

      if (!articleSectionDeleted) {
        nError = 404;
        throw new Error("No se eliminó la sección del artículo.");
      }

      return res.status(200).send({
        status: "success",
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err: err,
      });
    }
  },

  async deleteArticleCat(req, res) {
    let nError = 500;
    try {
      const articleCatId = req.params.id;
      const articleCat = await ArticleCat.findById(articleCatId).populate(
        populate.articleCat
      );

      if (!articleCat) {
        nError = 404;
        throw new Error("No se encontró nada.");
      }

      let Errors = [];

      if (articleCat.subcats && articleCat.subcats[0]) {
        for (let subcat of articleCat.subcats) {
          let subcatId = subcat._id;
          let subCatToDelete = await ArticleSubCat.findById();
          if (!subCatToDelete) {
            Errors.push(`No section to delete. ${section._id}: ${section}`);
          } else {
            let subCatDeleted = await ArticleSubCat.findByIdAndDelete(subcatId);
          }
        }
      }

      const articleCatDeleted = await ArticleCat.findByIdAndDelete(
        articleCatId
      );

      if (!articleCatDeleted) {
        nError = 404;
        throw new Error("No se eliminó la categoría de artículo.");
      }

      return res.status(200).send({
        status: "success",
        Errors: Errors,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err: err,
      });
    }
  },

  async deleteArticleSubCat(req, res) {
    let nError = 500;
    try {
      const articleSubCatId = req.params.id;
      const articleSubCat = await ArticleSubCat.findById(
        articleSubCatId
      ).populate(populate.articleSubCat);

      if (!articleSubCat) {
        nError = 404;
        throw new Error("No se encontró nada.");
      }

      const articleSubCatDeleted = await ArticleSubCat.findByIdAndDelete(
        articleSubCatId
      );

      if (!articleSubCatDeleted) {
        nError = 404;
        throw new Error("No se eliminó la categoría de artículo.");
      }

      return res.status(200).send({
        status: "success",
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err: err,
      });
    }
  },

  /* Uploads */
  async UploadFileArticle(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const articleId = req.params.id;
        const article = await Article.findById(articleId).populate(
          populate.article
        );

        if (!article) {
          nError = 404;
          throw new Error("No hay se encontró el artículo.");
        }

        //Recoger el fichero de la petición
        if (!req.files) {
          throw new Error("Archivo no subido...");
          nError = 404;
        }

        /* Extensión y tamaño del fichero */
        var file_ext = req.files[0].mimetype.split("/")[1];
        var file_size = req.files[0].size;
        var file_path = req.files[0].path;

        if (
          file_ext != "png" &&
          file_ext != "gif" &&
          file_ext != "jpg" &&
          file_ext != "jpeg"
        ) {
          /* Borrar el archivo */
          await fs.unlink(file_path, (err) => {
            if (err) {
              throw new Error("Error al borrar archivo.");
            }
          });
          throw new Error("La extensión del archivo no es válida.");
        }

        if (file_size > 50000000) {
          /* Borrar el archivo */
          await fs.unlink(file_path, (err) => {
            if (err) {
              throw new Error("Error al borrar archivo.");
            }
          });
          throw new Error(
            "error",
            "El archivo es demasiado grande. (tamaño máximo permitido = 45mb)"
          );
        }
        //Conseguir nombre del archivo
        var file_originalFileName = req.files[0].originalname;
        var cutter = "/";
        if (file_path.includes("\\")) {
          cutter = "\\";
        }
        var file_split = file_path.split(cutter);

        var file_name = req.files[0].filename;
        var slicedOldName =
          file_name.slice(0, 2) +
          file_name.slice(file_name.length - 1, file_name.length);

        var fileOriginalsplit = file_originalFileName.split(".");

        var newOriginalName =
          fileOriginalsplit[0] + slicedOldName + "." + fileOriginalsplit[1];

        var newName =
          file_split[0] + cutter + file_split[1] + cutter + newOriginalName;

        await fs.rename(file_path, newName, function (err) {
          if (err) {
            throw new Error("El archivo NO se ha renombrado correctamente.");
          }
        });

        /* Crear el objeto a guardar */
        var file = await new File();

        /* Asignar valores */
        if (fileOriginalsplit[0].includes("EnglishTitle")) {
          file.title = fileOriginalsplit[0].split("EnglishTitle")[0];
          file.titleEng = fileOriginalsplit[0].split("EnglishTitle")[1];
        } else {
          file.title = fileOriginalsplit[0];
          file.titleEng = fileOriginalsplit[0];
        }
        file.location = newOriginalName;
        file.type = file_ext;
        file.size = file_size;

        var fileStored = await file.save();

        if (!fileStored) {
          return res.status(404).send({
            status: "error",
            message: "El archivo NO se ha guardado.",
          });
        }

        article.coverImg = fileStored._id;

        const articleUpdated = await Article.findByIdAndUpdate(
          { _id: articleId },
          article,
          { new: true }
        ).populate(populate.article);

        if (!articleUpdated) {
          nError = 404;
          throw new Error("No se actualizó el article.");
        }

        return res.status(200).send({
          status: "success",
          article: articleUpdated,
          file: fileStored._id,
        });
      } catch (e) {
        return res.status(nError).send({
          status: "error",
          message: "El archivo tuvo un error al cargarse.",
          error_message: e.message,
          error: e,
        });
      }
    })();
  },

  async UploadFileArticleSectionPrincipalFile(req, res) {
    let nError = 500;
    try {
      /* Recoger el id de la url */
      let articleSection = await ArticleSection.findById(req.params.id);
      if (!articleSection) {
        nError = 404;
        throw new Error("No hay sección del article.");
      }
      //Recoger el fichero de la petición
      if (!req.files) {
        throw new Error("Archivo no subido...");
        nError = 404;
      }
      /* Extensión y tamaño del fichero */
      const file_ext = req.files[0].mimetype.split("/")[1];
      var file_size = req.files[0].size;
      var file_path = req.files[0].path;
      if (
        file_ext != "png" &&
        file_ext != "gif" &&
        file_ext != "jpg" &&
        file_ext != "jpeg" &&
        file_ext != "mp3" &&
        file_ext != "mpeg" &&
        file_ext != "mp4" &&
        file_ext != "mov" &&
        file_ext != "webp" &&
        file_ext != "webm" &&
        file_ext != "wav" &&
        file_ext != "ogg" &&
        file_ext != "psd" &&
        file_ext != "zip" &&
        file_ext != "rar" &&
        file_ext != "ai" &&
        file_ext != "flp" &&
        file_ext != "als" &&
        file_ext != "avi"
      ) {
        /* Borrar el archivo */
        await fs.unlink(file_path, (err) => {
          if (err) {
            throw new Error("Error al borrar archivo.");
          }
        });
        throw new Error("La extensión del archivo no es válida.");
      }
      if (file_size > 50000000) {
        /* Borrar el archivo */
        await fs.unlink(file_path, (err) => {
          if (err) {
            throw new Error("Error al borrar archivo.");
          }
        });
        throw new Error(
          "error",
          "El archivo es demasiado grande. (tamaño máximo permitido = 45mb)"
        );
      }
      //Conseguir nombre del archivo
      var file_originalFileName = req.files[0].originalname;
      var cutter = "/";
      if (file_path.includes("\\")) {
        cutter = "\\";
      }
      var file_split = file_path.split(cutter);

      var file_name = req.files[0].filename;
      var slicedOldName =
        file_name.slice(0, 2) +
        file_name.slice(file_name.length - 1, file_name.length);

      var fileOriginalsplit = file_originalFileName.split(".");

      var newOriginalName =
        fileOriginalsplit[0] + slicedOldName + "." + fileOriginalsplit[1];

      var newName =
        file_split[0] + cutter + file_split[1] + cutter + newOriginalName;

      await fs.rename(file_path, newName, function (err) {
        if (err) {
          throw new Error("El archivo NO se ha renombrado correctamente.");
        }
      });
      /* Crear el objeto a guardar */
      let file = await new File();
      /* Asignar valores */
      if (fileOriginalsplit[0].includes("EnglishTitle")) {
        file.title = fileOriginalsplit[0].split("EnglishTitle")[0];
        file.titleEng = fileOriginalsplit[0].split("EnglishTitle")[1];
      } else {
        file.title = fileOriginalsplit[0];
        file.titleEng = fileOriginalsplit[0];
      }
      file.location = newOriginalName;
      file.type = file_ext;
      file.size = file_size;
      file.create_at = new Date();
      const fileStored = await file.save();
      if (!fileStored) {
        return res.status(404).send({
          status: "error",
          message: "El archivo NO se ha guardado.",
        });
      }
      articleSection.principalFile = fileStored._id;
      const articleSectionUpdate = await ArticleSection.findByIdAndUpdate(
        articleSection._id,
        articleSection,
        {
          new: true,
        }
      ).populate();
      if (!articleSectionUpdate) {
        nError = 500;
        errMessage = "No se pudo actualizar la sección principal";
        throw new Error(errMessage);
      }
      const mailTitle = `Se actualizó una sección principal.`;
      const mailText = `Se actualizó una sección principal.`;
      const mailHtml = `Se actualizó una sección principal.`;
      const mails = [
        {
          to: "lnxdrk@gmail.com",
          title: mailTitle,
          text: mailText,
          html: mailHtml,
        },
        {
          to: `${userStored.email}`,
          title: mailTitle,
          text: mailText,
          html: mailHtml,
        },
      ];
      _mail.DoSendEmail(mails);
      return res.status(200).send({
        status: "success",
        articleSection: articleSectionUpdate,
        file: articleSectionUpdate.principalFile,
      });
    } catch (e) {
      return res.status(nError).send({
        status: "error",
        message: "El archivo tuvo un error al cargarse.",
        error_message: e.message,
        error: e,
      });
    }
  },

  async UploadFilesArticleSection(req, res) {
    let nError = 500;
    try {
      /* Recoger el id de la url */
      let articleSection = await ArticleSection.findById(req.params.id);
      if (!articleSection) {
        nError = 404;
        throw new Error("No hay sección del article.");
      }
      //Recoger el fichero de la petición
      if (!req.files) {
        throw new Error("Archivo no subido...");
        nError = 404;
      }
      for (let file of req.files) {
        /* Extensión y tamaño del fichero */
        const file_ext = req.files[0].mimetype.split("/")[1];
        var file_size = req.files[0].size;
        var file_path = req.files[0].path;
        if (
          file_ext != "png" &&
          file_ext != "gif" &&
          file_ext != "jpg" &&
          file_ext != "jpeg"
        ) {
          /* Borrar el archivo */
          await fs.unlink(file_path, (err) => {
            if (err) {
              throw new Error("Error al borrar archivo.");
            }
          });
          throw new Error("La extensión del archivo no es válida.");
        }
        if (file_size > 50000000) {
          /* Borrar el archivo */
          await fs.unlink(file_path, (err) => {
            if (err) {
              throw new Error("Error al borrar archivo.");
            }
          });
          throw new Error(
            "error",
            "El archivo es demasiado grande. (tamaño máximo permitido = 45mb)"
          );
        }
        //Conseguir nombre del archivo
        var file_originalFileName = req.files[0].originalname;
        var cutter = "/";
        if (file_path.includes("\\")) {
          cutter = "\\";
        }
        var file_split = file_path.split(cutter);

        var file_name = req.files[0].filename;
        var slicedOldName =
          file_name.slice(0, 2) +
          file_name.slice(file_name.length - 1, file_name.length);

        var fileOriginalsplit = file_originalFileName.split(".");

        var newOriginalName =
          fileOriginalsplit[0] + slicedOldName + "." + fileOriginalsplit[1];

        var newName =
          file_split[0] + cutter + file_split[1] + cutter + newOriginalName;

        await fs.rename(file_path, newName, function (err) {
          if (err) {
            throw new Error("El archivo NO se ha renombrado correctamente.");
          }
        });
        /* Crear el objeto a guardar */
        let file = await new File();
        /* Asignar valores */
        if (fileOriginalsplit[0].includes("EnglishTitle")) {
          file.title = fileOriginalsplit[0].split("EnglishTitle")[0];
          file.titleEng = fileOriginalsplit[0].split("EnglishTitle")[1];
        } else {
          file.title = fileOriginalsplit[0];
          file.titleEng = fileOriginalsplit[0];
        }
        file.location = newOriginalName;
        file.type = file_ext;
        file.size = file_size;
        file.create_at = new Date();
        const fileStored = await file.save();
        if (!fileStored) {
          return res.status(404).send({
            status: "error",
            message: "El archivo NO se ha guardado.",
          });
        }
        articleSection.files.push(fileStored._id);
      }
      const articleSectionUpdate = await ArticleSection.findByIdAndUpdate(
        articleSection._id,
        articleSection,
        {
          new: true,
        }
      ).populate();
      if (!articleSectionUpdate) {
        nError = 500;
        errMessage = "No se pudo actualizar la sección principal";
        throw new Error(errMessage);
      }
      const mailTitle = `Se actualizó una sección principal.`;
      const mailText = `Se actualizó una sección principal.`;
      const mailHtml = `Se actualizó una sección principal.`;
      const mails = [
        {
          to: "lnxdrk@gmail.com",
          title: mailTitle,
          text: mailText,
          html: mailHtml,
        },
        {
          to: `${userStored.email}`,
          title: mailTitle,
          text: mailText,
          html: mailHtml,
        },
      ];
      _mail.DoSendEmail(mails);
      return res.status(200).send({
        status: "success",
        articleSection: articleSectionUpdate,
        files: articleSectionUpdate.files,
      });
    } catch (e) {
      return res.status(nError).send({
        status: "error",
        message: "El archivo tuvo un error al cargarse.",
        error_message: e.message,
        error: e,
      });
    }
  },

  /* Exported Functions */
  async DoGetArticles(json, skip, limit, sort) {
    try {
      const articles = await Article.find(json)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate(populate.article);
      const total = await Articles.count(json);
      return { articles, total };
    } catch (err) {
      throw Error(err);
    }
  },

  async DoGetArticlesSearch(search, skip, limit, sort, rootAccess) {
    try {
      let articles = [];
      const articlesToSearch = await Article.find({})
        .sort(sort)
        .populate(populate.article);

      search = new RegExp(`${search}`, "i");

      await (() => {
        for (let article of articlesToSearch) {
          if (
            ((article.title && search.test(article.title)) ||
              (article.titleEng && search.test(article.titleEng)) ||
              (article.subtitle && search.test(article.subtitle)) ||
              (article.subtitleEng && search.test(article.subtitleEng)) ||
              (article.intro && search.test(article.intro)) ||
              (article.introEng && search.test(article.introEng)) ||
              (article.outro && search.test(article.outro)) ||
              (article.outroEng && search.test(article.outroEng)) ||
              (article.tags && search.test(article.tags)) ||
              (article.urltitle && search.test(article.urltitle)) ||
              (article.articleCat &&
                ((article.articleCat.title &&
                  search.test(article.articleCat.title)) ||
                  (article.articleCat.titleEng &&
                    search.test(article.articleCat.titleEng))))) &&
            (rootAccess === "all" || article.articleCat.title === rootAccess) &&
            !articles.includes(article)
          ) {
            articles.push(article);
          }

          /* insertions [String]; subCats []; sections[]; langs [String]; */
          if (
            rootAccess === "all" ||
            (rootAccess.includes("insertion") && article.insertions[0])
          ) {
            for (let insertion of article.insertions) {
              if (search.test(insertion) && !articles.includes(article)) {
                article.push(article);
              }
            }
          }
          if (
            rootAccess === "all" ||
            (rootAccess.includes("subCat") && article.subCats[0])
          ) {
            for (let subCat of article.subCats) {
              if (
                ((subCat.title && search.test(subCat.title)) ||
                  (subCat.titleEng && search.test(subCat.titleEng))) &&
                !articles.includes(article)
              ) {
                article.push(article);
              }
            }
          }
          if (
            rootAccess === "all" ||
            (rootAccess.includes("section") && article.sections[0])
          ) {
            for (let section of article.sections) {
              if (
                ((section.title && search.test(section.title)) ||
                  (section.titleEng && search.test(section.titleEng)) ||
                  (section.text && search.test(section.text)) ||
                  (section.textEng && search.test(section.textEng))) &&
                !articles.includes(article)
              ) {
                article.push(article);
              }
              if (section.insertions[0]) {
                for (let insertion of section.insertions) {
                  if (search.test(insertion) && !articles.includes(article)) {
                    article.push(article);
                  }
                }
              }
            }
          }
          if (article.langs[0]) {
            for (let lang of article.langs) {
              if (search.test(lang) && !articles.includes(article)) {
                article.push(article);
              }
            }
          }
        }
      })();

      let total = articles.length;

      let articlesFiltered = [];

      let i = 0;

      if (articles.length < limit - skip) {
        if (articles.length < skip) {
          skip = 0;
        } else {
          limit = articles.length - skip;
        }
      }

      for (let article of articles) {
        if (i >= skip) {
          if (limit != 0) {
            if (articlesFiltered.length < limit) {
              articlesFiltered.push(article);
              if (articles.length === i + 1) {
                return { articles: articlesFiltered, total };
              }
            } else {
              return { articles: articlesFiltered, total };
            }
            i++;
          } else {
            articlesFiltered.push(article);
            i++;
            if (i == articles.length) {
              return { articles: articlesFiltered, total };
            }
          }
        }
      }
    } catch (err) {
      throw Error(err);
    }
  },

  async DoGetArticle(articleId) {
    try {
      const article = await Article.findById(articleId).populate(
        populate.article
      );
      return article;
    } catch (err) {
      throw Error(err);
    }
  },
};

module.exports = controller;
