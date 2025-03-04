"use strict";

var mongoose = require("mongoose");
var express = require("express");
var app = require("./app");
var port = 6164;

mongoose.Promise = global.Promise;

mongoose
  .connect("mongodb://127.0.0.1:27017/lynx_portfolio")
  .then(() => {
    console.log(
      "la conexión a la base de datos de Lynx Pardelle se ha realizado correctamente."
    );

    /* Crear servidor y escuchar peticiones http */
    var server = app.listen(port, () => {
      console.log("Servidor corriendo en https://lynxpardelle.com.");
    });

    app.use(express.static("client"));
  })
  .catch((err) => console.log(err));
