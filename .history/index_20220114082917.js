"use strict";

var mongoose = require("mongoose");
var express = require("express");
var app = require("./app");
var port = 6164;

mongoose.Promise = global.Promise;

mongoose
  .connect("mongodb://159.203.122.158:27017/lynx_portfolio", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(
      "la conexión a la base de datos de Lynx Pardelle se ha realizado correctamente."
    );

    // Crear servidor y escuchar peticiones http
    var server = app.listen(port, () => {
      console.log("Servidor corriendo en https://localhost:6164.");
    });

    app.use(express.static("client"));
  })
  .catch((err) => console.log(err));
