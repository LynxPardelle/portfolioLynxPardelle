"use strict";

/* modulos */
var validator = require("validator");
var bcrypt = require("bcrypt");
var fs = require("fs");
var path = require("path");

//modelos
var Album = require("../models/album");
var BookImg = require("../models/bookImg");
var CVSection = require("../models/cvSection");
var CVSubSection = require("../models/cvSubSection");
var File = require("../models/file");
var Main = require("../models/main");
var Song = require("../models/song");
var Video = require("../models/video");
var Website = require("../models/website");

var populateAlbum = ["img"];
var populateBookImg = ["img"];
var populateCVSection = ["CVSubSections"];
var populateMain = ["logo", "backgroundImg", "CVImage", "CVBackground"];
var populateSong = ["song", "coverArt"];
var populateVideo = ["video"];
var populateWebsite = ["desktopImg", "tabletImg", "mobileImg"];

/* Main jwt */
var jwt = require("../services/jwt");

var controller = {
  datosAutor: (req, res) => {
    return res.status(200).send({
      autor: "Lynx Pardelle",
      url: "https://www.lynxpardelle.com",
    });
  },

  /* Create */
  async createAlbum(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
      });
    }

    if (validate_title) {
      /* Si todo es válido, crear el album a guardar */
      var album = new Album();

      /* Asignar valores */
      album.title = body.title;
      album.img = body.img ? body.img : null;
      album.spotify = body.spotify;
      album.tidal = body.tidal;

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar albums */
        const albums = await Album.find().populate(populateAlbum).sort("order");

        if (!albums) {
          album.order = 0;
        } else {
          album.order = albums.length + 1;

          for (let albumCheck of albums) {
            if (albumCheck.order === album.order) {
              album.order++;
            }
          }
        }

        const albumStored = await album.save();

        if (!albumStored) {
          nError = 404;
          throw new Error("No se guardó el album.");
        }

        return res.status(200).send({
          status: "success",
          album: albumStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createBookImg(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
      var validate_titleEng = !validator.isEmpty(body.titleEng);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
        validate_titleEng: "validate_titleEng: " + validate_titleEng,
      });
    }

    if (validate_title && validate_titleEng) {
      /* Si todo es válido, crear el bookImg a guardar */
      var bookImg = new BookImg();

      /* Asignar valores */
      bookImg.title = body.title;
      bookImg.titleEng = body.titleEng;
      bookImg.img = body.img ? body.img : null;

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar bookImgs */
        const bookImgs = await BookImg.find()
          .populate(populateBookImg)
          .sort("order");

        if (!bookImgs) {
          bookImg.order = 0;
        } else {
          bookImg.order = bookImgs.length + 1;

          for (let bookImgCheck of bookImgs) {
            if (bookImgCheck.order === bookImg.order) {
              bookImg.order++;
            }
          }
        }

        const bookImgStored = await bookImg.save();

        if (!bookImgStored) {
          nError = 404;
          throw new Error("No se guardó el bookImg.");
        }

        return res.status(200).send({
          status: "success",
          bookImg: bookImgStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createCVSection(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
      var validate_titleEng = !validator.isEmpty(body.titleEng);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
        validate_titleEng: "validate_titleEng: " + validate_titleEng,
      });
    }

    if (validate_title && validate_titleEng) {
      /* Si todo es válido, crear la cvSection a guardar */
      var cvSection = new CVSection();

      /* Asignar valores */
      cvSection.title = body.title;
      cvSection.titleEng = body.titleEng;
      cvSection.text = body.text;
      cvSection.textEng = body.textEng;
      cvSection.CVSubSections = body.CVSubSections ? body.CVSubSections : [];
      cvSection.titleColor = body.titleColor;
      cvSection.textColor = body.textColor;
      cvSection.linkColor = body.linkColor;
      cvSection.bgColor = body.bgColor;
      cvSection.insertions = body.insertions ? body.insertions : [];

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar cvSections */
        const cvSections = await CVSection.find()
          .populate(populateCVSection)
          .sort("order");

        if (!cvSections) {
          cvSection.order = 0;
        } else {
          cvSection.order = cvSections.length + 1;

          for (let cvSectionCheck of cvSections) {
            if (cvSectionCheck.order === cvSection.order) {
              cvSection.order++;
            }
          }
        }

        const cvSectionStored = await cvSection.save();

        if (!cvSectionStored) {
          nError = 404;
          throw new Error("No se guardó la cvSection.");
        }

        return res.status(200).send({
          status: "success",
          cvSection: cvSectionStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createCVSubSection(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
      var validate_titleEng = !validator.isEmpty(body.titleEng);
      var validate_text = !validator.isEmpty(body.text);
      var validate_textEng = !validator.isEmpty(body.textEng);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
        validate_titleEng: "validate_titleEng: " + validate_titleEng,
        validate_text: "validate_text: " + validate_text,
        validate_textEng: "validate_textEng: " + validate_textEng,
      });
    }

    if (validate_title && validate_titleEng) {
      /* Si todo es válido, crear la cvSubSection a guardar */
      var cvSubSection = new CVSubSection();

      /* Asignar valores */
      cvSubSection.title = body.title;
      cvSubSection.titleEng = body.titleEng;
      cvSubSection.text = body.text;
      cvSubSection.textEng = body.textEng;
      cvSubSection.CVSection = body.CVSection ? body.CVSection : null;
      cvSubSection.titleColor = body.titleColor;
      cvSubSection.textColor = body.textColor;
      cvSubSection.linkColor = body.linkColor;
      cvSubSection.bgColor = body.bgColor;
      cvSubSection.insertions = body.insertions ? body.insertions : [];

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar cvSubSections */
        const cvSubSections = await CVSubSection.find().sort("order");

        if (!cvSubSections) {
          cvSubSection.order = 0;
        } else {
          cvSubSection.order = cvSubSections.length + 1;

          for (let cvSubSectionCheck of cvSubSections) {
            if (cvSubSectionCheck.order === cvSubSection.order) {
              cvSubSection.order++;
            }
          }
        }

        const cvSubSectionStored = await cvSubSection.save();

        if (!cvSubSectionStored) {
          nError = 404;
          throw new Error("No se guardó la cvSubSection.");
        }

        return res.status(200).send({
          status: "success",
          cvSubSection: cvSubSectionStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createSong(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
      });
    }

    if (validate_title) {
      /* Si todo es válido, crear la song a guardar */
      var song = new Song();

      /* Asignar valores */
      song.title = body.title;
      song.song = body.song ? body.song : null;
      song.duration = body.duration;
      song.link = body.link;
      song.coverArt = body.coverArt ? body.coverArt : null;

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar songs */
        const songs = await Song.find().populate(populateSong).sort("order");

        if (!songs) {
          song.order = 0;
        } else {
          song.order = songs.length + 1;

          for (let songCheck of songs) {
            if (songCheck.order === song.order) {
              song.order++;
            }
          }
        }

        const songStored = await song.save();

        if (!songStored) {
          nError = 404;
          throw new Error("No se guardó la song.");
        }

        return res.status(200).send({
          status: "success",
          song: songStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createVideo(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
      var validate_titleEng = !validator.isEmpty(body.titleEng);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
        validate_titleEng: "validate_titleEng: " + validate_titleEng,
      });
    }

    if (validate_title && validate_titleEng) {
      /* Si todo es válido, crear el video a guardar */
      var video = new Video();

      /* Asignar valores */
      video.title = body.title;
      video.titleEng = body.titleEng;
      video.link = body.link;
      video.insert = body.insert;
      video.video = body.video ? body.video : null;

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar videos */
        const videos = await Video.find().populate(populateVideo).sort("order");

        if (!videos) {
          video.order = 0;
        } else {
          video.order = videos.length + 1;

          for (let videoCheck of videos) {
            if (videoCheck.order === video.order) {
              video.order++;
            }
          }
        }

        const videoStored = await video.save();

        if (!videoStored) {
          nError = 404;
          throw new Error("No se guardó el video.");
        }

        return res.status(200).send({
          status: "success",
          video: videoStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  async createWebsite(req, res) {
    /* Recoger parametros por post */
    var body = req.body;

    /* Validar datos (validator) */
    try {
      var validate_title = !validator.isEmpty(body.title);
      var validate_titleEng = !validator.isEmpty(body.titleEng);
      var validate_type = !validator.isEmpty(body.type);
      var validate_typeEng = !validator.isEmpty(body.typeEng);
      var validate_desc = !validator.isEmpty(body.desc);
      var validate_descEng = !validator.isEmpty(body.descEng);
      var validate_link = !validator.isEmpty(body.link);
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "¡faltan datos por enviar!",
        validate_title: "validate_title: " + validate_title,
        validate_titleEng: "validate_titleEng: " + validate_titleEng,
        validate_type: "validate_type: " + validate_type,
        validate_typeEng: "validate_typeEng: " + validate_typeEng,
        validate_desc: "validate_desc: " + validate_desc,
        validate_descEng: "validate_descEng: " + validate_descEng,
        validate_link: "validate_link: " + validate_link,
      });
    }

    if (
      validate_title &&
      validate_titleEng &&
      validate_type &&
      validate_typeEng &&
      validate_desc &&
      validate_descEng &&
      validate_link
    ) {
      /* Si todo es válido, crear el website a guardar */
      var website = new Website();

      /* Asignar valores */
      website.title = body.title;
      website.titleEng = body.titleEng;
      website.type = body.type;
      website.typeEng = body.typeEng;
      website.desc = body.desc;
      website.descEng = body.descEng;
      website.link = body.link;
      website.insert = body.insert;
      website.desktopImg = body.desktopImg ? body.desktopImg : null;
      website.tabletImg = body.tabletImg ? body.tabletImg : null;
      website.mobileImg = body.mobileImg ? body.mobileImg : null;

      let nError = 500;
      /* Guardar el articulo */
      try {
        /* Buscar websites */
        const websites = await Website.find()
          .populate(populateWebsite)
          .sort("order");

        if (!websites) {
          website.order = 0;
        } else {
          website.order = websites.length + 1;

          for (let websiteCheck of websites) {
            if (websiteCheck.order === website.order) {
              website.order++;
            }
          }
        }

        const websiteStored = await website.save();

        if (!websiteStored) {
          nError = 404;
          throw new Error("No se guardó el website.");
        }

        return res.status(200).send({
          status: "success",
          website: websiteStored,
        });
      } catch (err) {
        console.log(err);
        return res.status(nError).send({
          status: "error",
          message: err.message,
          err: err,
        });
      }
    } else {
      /* Devolver una respuesta si no es válido */
      return res.status(500).send({
        status: "error",
        message: "Los datos no son válidos, por lo que no se ha guardado.",
      });
    }
  },

  /* Get */
  async getAlbums(req, res) {
    var nError = 500;
    try {
      const albums = await Album.find().populate(populateAlbum).sort("order");
      if (!albums) {
        nError = 404;
        throw new Error("No hay album.");
      }
      return res.status(200).send({
        status: "success",
        albums: albums,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los album.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getBookImgs(req, res) {
    var nError = 500;
    try {
      const bookImgs = await BookImg.find()
        .populate(populateBookImg)
        .sort("order");
      if (!bookImgs) {
        nError = 404;
        throw new Error("No hay bookImg.");
      }
      return res.status(200).send({
        status: "success",
        bookImgs: bookImgs,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los bookImg.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getCVSections(req, res) {
    var nError = 500;
    try {
      const cvSections = await CVSection.find()
        .populate(populateCVSection)
        .sort("order");
      if (!cvSections) {
        nError = 404;
        throw new Error("No hay cvSection.");
      }
      return res.status(200).send({
        status: "success",
        cvSections: cvSections,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los cvSection.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getMain(req, res) {
    var nError = 500;
    var errMessage = "";
    try {
      const mainOld = await Main.findOne().populate(populateMain);

      if (!mainOld) {
        var main = new Main();

        if(!process.env.JWT_SECRET) {
          nError = 500;
          throw new Error("JWT_SECRET environment variable is required");
        }

        /* Asignar valores */
        main.welcome = "Te doy la bienvenida.";
        main.welcomeEng = "Welcome";
        main.CVDesc =
          "Alec Jonathan Montaño Romero\n\nAreas de experiencia:\n\nProducción audiovisual y musical\nIngeniería de audio\nDiseño gráfico, web y de sonido\nDesarrollo web\nAnimación digital\nFacilitación de cursos\nArte Glitch\nLogística";
        main.CVDescEng =
          "Alec Jonathan Montaño Romero\n\nExperience areas:\n\nMusic and audiovisual production\nAudio engineering\nSound, graphic and web design\nWeb development\nDigital animation\nCourse facilitation\nGlitch art\nLogistics";
        main.CVDesc2 =
          "Valores y actitudes\n\nResponsabilidad Orden Puntualidad Creatividad Proactividad";
        main.CVDesc2Eng =
          "Values and attitudes\n\nResponsbility Order Puntuality Creativity Proactivity";
        main.key = process.env.JWT_SECRET;
        main.errorMessage = "Error 404:\n\nPágina no encontrada.";
        main.errorMessageEng = "Error 404:\n\nPage not found.";
        main.seoTags = "lynx pardelle, web developer, web designer";

        /* Cifrar llave */
        const hash = await new Promise((resolve, reject) => {
          bcrypt.hash(main.key, 10, (err, hash) => {
            if (err) reject(err);
            resolve(hash);
          });
        });

        if (!hash) {
          nError = 500;
          errMessage = "Error de encriptación.";
          throw new Error("Error con la llave.");
        }

        main.key = hash;
        main.keyOld = hash;

        const mainStored = await main.save();

        if (!mainStored) {
          nError = 404;
          errMessage = "No se guardó el main.";
          throw new Error("No se guardó el main.");
        }

        delete mainStored.key;
        delete mainStored.keyOld;

        return res.status(200).send({
          status: "success",
          main: mainStored,
        });
      } else {
        delete mainOld.key;
        delete mainOld.keyOld;

        return res.status(200).send({
          status: "success",
          main: mainOld,
        });
      }
    } catch (err) {
      /* Devolver una respuesta si no es válido */
      return res.status(nError).send({
        status: "error",
        message: errMessage,
        errMessage: err.message,
        error: err,
      });
    }
  },

  async getSongs(req, res) {
    var nError = 500;
    try {
      const songs = await Song.find().populate(populateSong).sort("order");
      if (!songs) {
        nError = 404;
        throw new Error("No hay song.");
      }
      return res.status(200).send({
        status: "success",
        songs: songs,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los song.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getVideos(req, res) {
    var nError = 500;
    try {
      const videos = await Video.find().populate(populateVideo).sort("order");
      if (!videos) {
        nError = 404;
        throw new Error("No hay videos.");
      }
      return res.status(200).send({
        status: "success",
        videos: videos,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los videos.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async getWebsites(req, res) {
    var nError = 500;
    try {
      const websites = await Website.find()
        .populate(populateWebsite)
        .sort("order");
      if (!websites) {
        nError = 404;
        throw new Error("No hay website.");
      }
      return res.status(200).send({
        status: "success",
        websites: websites,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver los website.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async login(req, res) {
    var nError = 500;
    try {
      const body = req.body;

      if (!body.email || body.email !== "lynxpardelle@lynxpardelle.com") {
        nError = 404;
        throw {
          name: "Error",
          message: "No tienes permiso.",
        };
      }

      const main = await Main.findOne().populate(populateMain);

      if (!main) {
        nError = 404;
        throw {
          name: "Error",
          message: "Main no encontrado.",
        };
      }

      const compare = await bcrypt.compareSync(body.password, main.key);

      if (!compare) {
        nError = 404;
        throw {
          name: "Error",
          message: "contraseña incorrecta.",
        };
      }

      let user = {
        name: "Lynx Pardelle",
        email: "lynxpardelle@lynxpardelle.com",
        role: "ROLE_ADMIN",
      };

      if (body.gettoken) {
        return res.status(200).send({
          token: jwt.createToken(user),
        });
      } else {
        return res.status(200).send({
          status: "Success",
          user: user,
        });
      }
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al hacer el login.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  /* Update */
  async updateAlbum(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var albumId = req.params.id;
    var nError = 500;
    try {
      const album = await Album.findById(albumId).populate(populateAlbum);

      if (!album) {
        nError = 404;
        throw new Error("No hay el album.");
      }

      /* Buscar albums */
      const albums = await Album.find().populate(populateAlbum).sort("order");

      if (albums) {
        for (let albumCheck of albums) {
          if (albumCheck.order === album.order) {
            album.order++;
          }
        }
      }

      const albumUpdated = await Album.findByIdAndUpdate(albumId, update, {
        new: true,
      }).populate(populateAlbum);

      if (!albumUpdated) {
        nError = 404;
        throw new Error("No se actualizó el album.");
      }

      return res.status(200).send({
        status: "success",
        albumUpdated: albumUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver el album.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateBookImg(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var bookImgId = req.params.id;
    var nError = 500;
    (async () => {
      try {
        const bookImg = await BookImg.findById(bookImgId).populate(
          populateBookImg
        );

        if (!bookImg) {
          nError = 404;
          throw new Error("No hay bookImg.");
        }

        /* Buscar bookImgs */
        const bookImgs = await BookImg.find()
          .populate(populateBookImg)
          .sort("order");

        if (bookImgs) {
          for (let bookImgCheck of bookImgs) {
            if (bookImgCheck.order === bookImg.order) {
              bookImg.order++;
            }
          }
        }

        const bookImgUpdated = await BookImg.findByIdAndUpdate(
          bookImgId,
          update,
          {
            new: true,
          }
        ).populate(populateBookImg);

        if (!bookImgUpdated) {
          nError = 404;
          throw new Error("No se actualizó el bookImg.");
        }

        return res.status(200).send({
          status: "success",
          bookImgUpdated: bookImgUpdated,
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          message: "Error al devolver   bookImg.",
          errorMessage: err.message,
          err: err,
        });
      }
    })();
  },

  async updateCVSection(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var cvSectionId = req.params.id;
    var nError = 500;
    try {
      const cvSection = await CVSection.findById(cvSectionId).populate(
        populateCVSection
      );

      if (!cvSection) {
        nError = 404;
        throw new Error("No hay el cvSection.");
      }

      /* Buscar cvSections */
      const cvSections = await CVSection.find()
        .populate(populateCVSection)
        .sort("order");

      if (cvSections) {
        for (let cvSectionCheck of cvSections) {
          if (cvSectionCheck.order === cvSection.order) {
            cvSection.order++;
          }
        }
      }

      const cvSectionUpdated = await CVSection.findByIdAndUpdate(
        cvSectionId,
        update,
        {
          new: true,
        }
      ).populate(populateCVSection);

      if (!cvSectionUpdated) {
        nError = 404;
        throw new Error("No se actualizó la cvSection.");
      }

      return res.status(200).send({
        status: "success",
        cvSectionUpdated: cvSectionUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver el cvSection.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateCVSubSection(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var cvSubSectionId = req.params.id;
    var nError = 500;
    try {
      const cvSubSection = await CVSubSection.findById(cvSubSectionId);

      if (!cvSubSection) {
        nError = 404;
        throw new Error("No hay el cvSubSection.");
      }

      /* Buscar cvSubSections */
      const cvSubSections = await CVSubSection.find().sort("order");

      if (cvSubSections) {
        for (let cvSubSectionCheck of cvSubSections) {
          if (cvSubSectionCheck.order === cvSubSection.order) {
            cvSubSection.order++;
          }
        }
      }

      const cvSubSectionUpdated = await CVSubSection.findByIdAndUpdate(
        cvSubSectionId,
        update,
        {
          new: true,
        }
      );

      if (!cvSubSectionUpdated) {
        nError = 404;
        throw new Error("No se actualizó la cvSubSection.");
      }

      return res.status(200).send({
        status: "success",
        cvSubSectionUpdated: cvSubSectionUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver el cvSubSection.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateMain(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var nError = 500;
    try {
      const main = await Main.findOne().populate(populateMain);

      if (!main) {
        nError = 404;
        throw new Error("No hay main.");
      }

      const mainId = main._id;

      if (
        (update.keyOld && update.keyOld !== "") ||
        (update.key && update.key !== "")
      ) {
        //Decrypt main
        if (update.keyOld === "" || update.key === "") {
          throw new Error("Falta una contraseña.");
        }
        const check = await new Promise((resolve, reject) => {
          bcrypt.compare(update.keyOld, main.key, function (err, check) {
            if (err) reject(err);
            resolve(check);
          });
        });
        if (!check) {
          throw new Error("No tienes permiso, fallo en las llaves.");
        }
        const hash = await new Promise((resolve, reject) => {
          bcrypt.hash(update.key, 10, (err, hash) => {
            if (err) reject(err);
            resolve(hash);
          });
        });
        update.key = hash;
        update.keyOld = hash;

        if (!update.key || !update.keyOld) {
          throw new Error("Problemas con la contraseña.");
        }
      }

      main = await (() => {
        for (let key in update) {
          if (
            (key !== "key" || (key === "key" && update[key] !== "")) &&
            (key !== "keyOld" || (key === "keyOld" && update[keyOld] !== ""))
          ) {
            main[key] = update[key];
          }
        }
        return main;
      })();

      const mainUpdated = await Main.findByIdAndUpdate(mainId, main, {
        new: true,
      }).populate(populateMain);

      if (!mainUpdated) {
        nError = 404;
        throw new Error("No se actualizó el main.");
      }

      mainUpdated.key = undefined;
      mainUpdated.keyOld = undefined;

      return res.status(200).send({
        status: "success",
        mainUpdated: mainUpdated,
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        message: "Error al devolver main.",
        errorMessage: err.message,
        err: err,
      });
    }
  },

  async updateSong(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var songId = req.params.id;
    var nError = 500;
    (async () => {
      try {
        const song = await Song.findById(songId).populate(populateSong);

        if (!song) {
          nError = 404;
          throw new Error("No hay song.");
        }

        /* Buscar songs */
        const songs = await Song.find().populate(populateSong).sort("order");

        if (songs) {
          for (let songCheck of songs) {
            if (songCheck.order === song.order) {
              song.order++;
            }
          }
        }

        const songUpdated = await Song.findByIdAndUpdate(songId, update, {
          new: true,
        }).populate(populateSong);

        if (!songUpdated) {
          nError = 404;
          throw new Error("No se actualizó el song.");
        }

        return res.status(200).send({
          status: "success",
          songUpdated: songUpdated,
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          message: "Error al devolver song.",
          errorMessage: err.message,
          err: err,
        });
      }
    })();
  },

  async updateVideo(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var videoId = req.params.id;
    var nError = 500;
    (async () => {
      try {
        const video = await Video.findById(videoId).populate(populateVideo);

        if (!video) {
          nError = 404;
          throw new Error("No hay video.");
        }

        /* Buscar videos */
        const videos = await Video.find().populate(populateVideo).sort("order");

        if (videos) {
          for (let videoCheck of videos) {
            if (videoCheck.order === video.order) {
              video.order++;
            }
          }
        }

        const videoUpdated = await Video.findByIdAndUpdate(videoId, update, {
          new: true,
        }).populate(populateVideo);

        if (!videoUpdated) {
          nError = 404;
          throw new Error("No se actualizó el video.");
        }

        return res.status(200).send({
          status: "success",
          videoUpdated: videoUpdated,
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          message: "Error al devolver video.",
          errorMessage: err.message,
          err: err,
        });
      }
    })();
  },

  async updateWebsite(req, res) {
    /* Recoger datos de "PUT" */
    var update = req.body;

    var websiteId = req.params.id;
    var nError = 500;
    (async () => {
      try {
        const website = await Website.findById(websiteId).populate(
          populateWebsite
        );

        if (!website) {
          nError = 404;
          throw new Error("No hay website.");
        }

        /* Buscar websites */
        const websites = await Website.find()
          .populate(populateWebsite)
          .sort("order");

        if (websites) {
          for (let websiteCheck of websites) {
            if (websiteCheck.order === website.order) {
              website.order++;
            }
          }
        }

        const websiteUpdated = await Website.findByIdAndUpdate(
          websiteId,
          update,
          {
            new: true,
          }
        ).populate(populateWebsite);

        if (!websiteUpdated) {
          nError = 404;
          throw new Error("No se actualizó el website.");
        }

        return res.status(200).send({
          status: "success",
          websiteUpdated: websiteUpdated,
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          message: "Error al devolver website.",
          errorMessage: err.message,
          err: err,
        });
      }
    })();
  },

  /* Delete */
  async deleteAlbum(req, res) {
    /* Recoger el id de la url */
    var albumId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    (async () => {
      try {
        const album = await Album.findById(albumId).populate(populateAlbum);

        if (!album) {
          nError = 404;
          throw new Error("No se encontró nada.");
        }

        if (album.img) {
          let path_file = "./uploads/main" + album.img.location;

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
              "Error al borrar archivo ./uploads/main" + album.img.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({ _id: album.img._id });
        }

        const albumDeleted = await Album.findByIdAndDelete(albumId);

        if (!albumDeleted) {
          nError = 404;
          throw new Error("No se eliminó el album.");
        }

        return res.status(200).send({
          status: "success",
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          error_message: err.message,
          err,
        });
      }
    })();
  },

  async deleteBookImg(req, res) {
    /* Recoger el id de la url */
    var bookImgId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    (async () => {
      try {
        const bookImg = await BookImg.findById(bookImgId).populate(
          "populateBookImg"
        );

        if (!bookImg) {
          nError = 404;
          throw new Error("No hay se encontró nada.");
        }

        if (bookImg.img) {
          let path_file = "./uploads/main" + bookImg.img.location;

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
              "Error al borrar archivo ./uploads/main" + bookImg.img.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: bookImg.img._id,
          });
        }

        const bookImgDeleted = await BookImg.findByIdAndDelete(bookImgId);

        if (!bookImgDeleted) {
          nError = 404;
          throw new Error("No se eliminó el bookImg.");
        }

        return res.status(200).send({
          status: "success",
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          error_message: err.message,
          err,
        });
      }
    })();
  },

  async deleteCVSection(req, res) {
    /* Recoger el id de la url */
    var cvSectionId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    try {
      const cvSection = await CVSection.findById(cvSectionId);

      if (!cvSection) {
        nError = 404;
        throw new Error("No hay se encontró nada.");
      }

      const cvSectionDeleted = await CVSection.findByIdAndDelete(cvSectionId);

      if (!cvSectionDeleted) {
        nError = 404;
        throw new Error("No se eliminó la cvSection.");
      }

      return res.status(200).send({
        status: "success",
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err,
      });
    }
  },

  async deleteCVSubSection(req, res) {
    /* Recoger el id de la url */
    var cvSubSectionId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    try {
      const cvSubSection = await CVSubSection.findById(cvSubSectionId);

      if (!cvSubSection) {
        nError = 404;
        throw new Error("No hay se encontró nada.");
      }

      const cvSubSectionDeleted = await CVSubSection.findByIdAndDelete(
        cvSubSectionId
      );

      if (!cvSubSectionDeleted) {
        nError = 404;
        throw new Error("No se eliminó la cvSubSection.");
      }

      return res.status(200).send({
        status: "success",
      });
    } catch (err) {
      return res.status(nError).send({
        status: "error",
        error_message: err.message,
        err,
      });
    }
  },

  async deleteSong(req, res) {
    /* Recoger el id de la url */
    var songId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    (async () => {
      try {
        const song = await Song.findById(songId).populate("populateSong");

        if (!song) {
          nError = 404;
          throw new Error("No hay se encontró nada.");
        }

        if (song.song) {
          let path_file = "./uploads/main" + song.song.location;

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
              "Error al borrar archivo ./uploads/main" + song.song.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({ _id: song.song._id });
        }

        if (song.coverArt) {
          let path_file = "./uploads/main" + song.coverArt.location;

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
              "Error al borrar archivo ./uploads/main" + song.coverArt.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: song.coverArt._id,
          });
        }

        const songDeleted = await Song.findByIdAndDelete(songId);

        if (!songDeleted) {
          nError = 404;
          throw new Error("No se eliminó el song.");
        }

        return res.status(200).send({
          status: "success",
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          error_message: err.message,
          err,
        });
      }
    })();
  },

  async deleteVideo(req, res) {
    /* Recoger el id de la url */
    var videoId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    (async () => {
      try {
        const video = await Video.findById(videoId).populate("populateVideo");

        if (!video) {
          nError = 404;
          throw new Error("No hay se encontró nada.");
        }

        if (video.video) {
          let path_file = "./uploads/main" + video.video.location;

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
              "Error al borrar archivo ./uploads/main" + video.video.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: video.video._id,
          });
        }

        const videoDeleted = await Video.findByIdAndDelete(videoId);

        if (!videoDeleted) {
          nError = 404;
          throw new Error("No se eliminó el video.");
        }

        return res.status(200).send({
          status: "success",
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          error_message: err.message,
          err,
        });
      }
    })();
  },

  async deleteWebsite(req, res) {
    /* Recoger el id de la url */
    var websiteId = req.params.id;
    let nError = 500;
    /* Buscar usuario */
    (async () => {
      try {
        const website = await Website.findById(websiteId).populate(
          "populateWebsite"
        );

        if (!website) {
          nError = 404;
          throw new Error("No hay se encontró nada.");
        }

        if (website.desktopImg) {
          let path_file = "./uploads/main" + website.desktopImg.location;

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
              "Error al borrar archivo ./uploads/main" +
                website.desktopImg.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: website.desktopImg._id,
          });
        }

        if (website.tabletImg) {
          let path_file = "./uploads/main" + website.tabletImg.location;

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
              "Error al borrar archivo ./uploads/main" +
                website.tabletImg.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: website.tabletImg._id,
          });
        }

        if (website.mobileImg) {
          let path_file = "./uploads/main" + website.mobileImg.location;

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
              "Error al borrar archivo ./uploads/main" +
                website.mobileImg.location
            );
          }

          let fileRemoved = await File.findOneAndDelete({
            _id: website.mobileImg._id,
          });
        }

        const websiteDeleted = await Website.findByIdAndDelete(websiteId);

        if (!websiteDeleted) {
          nError = 404;
          throw new Error("No se eliminó el website.");
        }

        return res.status(200).send({
          status: "success",
        });
      } catch (err) {
        return res.status(nError).send({
          status: "error",
          error_message: err.message,
          err,
        });
      }
    })();
  },

  /* Uploads */
  async UploadFileAlbum(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const albumId = req.params.id;
        const album = await Album.findById(albumId).populate(populateAlbum);

        if (!album) {
          nError = 404;
          throw new Error("No hay se encontró el album.");
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

        album.img = fileStored._id;

        const albumUpdated = await Album.findByIdAndUpdate(
          { _id: albumId },
          album,
          { new: true }
        ).populate(populateAlbum);

        if (!albumUpdated) {
          nError = 404;
          throw new Error("No se actualizó el album.");
        }

        return res.status(200).send({
          status: "success",
          album: albumUpdated,
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

  async UploadFileBookImg(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const bookImgId = req.params.id;
        const bookImg = await BookImg.findById(bookImgId).populate(
          populateBookImg
        );

        if (!bookImg) {
          nError = 404;
          throw new Error("No hay se encontró el bookImg.");
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

        bookImg.img = fileStored._id;

        const bookImgUpdated = await BookImg.findByIdAndUpdate(
          { _id: bookImgId },
          bookImg,
          { new: true }
        ).populate(populateBookImg);

        if (!bookImgUpdated) {
          nError = 404;
          throw new Error("No se actualizó el bookImg.");
        }

        return res.status(200).send({
          status: "success",
          bookImg: bookImgUpdated,
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

  async UploadFileMain(req, res) {
    console.log("uploading image...");
    let nError = 500;
    try {
      const main = await Main.findOne().populate(populateMain);
      const mainId = main._id;

      if (!main) {
        nError = 404;
        throw new Error("No hay se encontró main.");
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

      /* Actualizar main */
      var option = req.params.id;

      await (() => {
        switch (option) {
          case "logo":
            main.logo = fileStored._id;
            break;
          case "backgroundImg":
            main.backgroundImg = fileStored._id;
            break;
          case "CVImage":
            main.CVImage = fileStored._id;
            break;
          case "CVBackground":
            main.CVBackground = fileStored._id;
            break;
        }
      })();

      const mainUpdated = await Main.findByIdAndUpdate({ _id: mainId }, main, {
        new: true,
      }).populate(populateMain);

      if (!mainUpdated) {
        nError = 404;
        throw new Error("No hay se actualizó el main.");
      }

      mainUpdated.key = undefined;
      mainUpdated.keyOld = undefined;

      return res.status(200).send({
        status: "success",
        main: mainUpdated,
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
  },

  async UploadFileSong(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const songId = req.params.id;
        const song = await Song.findById(songId).populate(populateSong);

        if (!song) {
          nError = 404;
          throw new Error("No hay se encontró el song.");
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

        /* Actualizar main */
        var option = req.params.option;

        if (
          !option ||
          (option === "song" &&
            file_ext != "mp3" &&
            file_ext != "mpeg" &&
            file_ext != "ogg" &&
            file_ext != "wav") ||
          (option === "coverArt" &&
            file_ext != "png" &&
            file_ext != "gif" &&
            file_ext != "jpg" &&
            file_ext != "jpeg")
        ) {
          /* Borrar el archivo */
          await fs.unlink(file_path, (err) => {
            if (err) {
              throw new Error("Error al borrar archivo.");
            }
          });
          throw new Error("La extensión del archivo no es válida.");
        }

        if (file_size > 100000000) {
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

        await (() => {
          switch (option) {
            case "song":
              song.song = fileStored._id;
              break;
            case "coverArt":
              song.coverArt = fileStored._id;
              break;
          }
        })();

        const songUpdated = await Song.findByIdAndUpdate(
          { _id: songId },
          song,
          { new: true }
        ).populate(populateSong);

        if (!songUpdated) {
          nError = 404;
          throw new Error("No se actualizó el song.");
        }

        return res.status(200).send({
          status: "success",
          song: songUpdated,
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

  async UploadFileVideo(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const videoId = req.params.id;
        const video = await Video.findById(videoId).populate(populateVideo);

        if (!video) {
          nError = 404;
          throw new Error("No hay se encontró el video.");
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

        if (file_ext != "mp4" && file_ext != "webm") {
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

        video.video = fileStored._id;

        const videoUpdated = await Video.findByIdAndUpdate(
          { _id: videoId },
          video,
          { new: true }
        ).populate(populateVideo);

        if (!videoUpdated) {
          nError = 404;
          throw new Error("No se actualizó el video.");
        }

        return res.status(200).send({
          status: "success",
          video: videoUpdated,
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

  async UploadFileWebsite(req, res) {
    console.log("uploading image...");
    let nError = 500;
    (async () => {
      try {
        const websiteId = req.params.id;
        const website = await Website.findById(websiteId).populate(
          populateWebsite
        );

        if (!website) {
          nError = 404;
          throw new Error("No hay se encontró el website.");
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

        /* Actualizar main */
        var option = req.params.option;

        await (() => {
          switch (option) {
            case "desktopImg":
              website.desktopImg = fileStored._id;
              break;
            case "tabletImg":
              website.tabletImg = fileStored._id;
              break;
            case "mobileImg":
              website.mobileImg = fileStored._id;
              break;
          }
        })();

        const websiteUpdated = await Website.findByIdAndUpdate(
          { _id: websiteId },
          website,
          { new: true }
        ).populate(populateWebsite);

        if (!websiteUpdated) {
          nError = 404;
          throw new Error("No se actualizó el website.");
        }

        return res.status(200).send({
          status: "success",
          website: websiteUpdated,
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

  async getFile(req, res) {
    var file = req.params.file;
    var path_file = "./uploads/main/" + file;

    fs.exists(path_file, (exists) => {
      if (exists) {
        return res.sendFile(path.resolve(path_file));
      } else {
        return res.status(404).send({
          status: "error",
          message: "El archivo no existe.",
        });
      }
    });
  },
};

module.exports = controller;
