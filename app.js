"use strict";

// Load environment variables first
require('dotenv').config();

//Cargar modulos de node para crear servidos
var path = require("path");
var express = require("express");
var cors = require("cors");

/* Ejecutar express (http) */
var app = express();

/* Cargar rutas */
var main_routes = require("./routes/main");
var article_routes = require("./routes/article");

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

/* rutas body-parser */
app.use("/", express.static("client", { redirect: false }));
app.use("/api/main", main_routes);
app.use("/api/article", article_routes);

// Health endpoint (moved here so it's not shadowed by the catch-all route)
app.get('/health', (req, res) => {
  // Upstream index.js attaches dynamic status, but in case it's hit here we just return basic ok.
  res.json({ status: 'ok', app: process.env.APP_NAME || 'lynx-portfolio-back', timestamp: new Date().toISOString() });
});


/* Ruta o método de prueba para el API */
app.get("/datos-autor", (req, res) => {
  console.log("Hola mundo");
  return res.status(200).send({
    autor: "Lynx Pardelle",
    url: "https://www.lynxpardelle.com",
  });
});

module.exports = app;
