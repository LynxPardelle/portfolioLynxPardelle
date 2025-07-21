"use strict";

const mongoose = require("mongoose");
const express = require("express");
const app = require("./app");

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/lynx_portfolio")
  .then(() => {
    console.log(
      "la conexión a la base de datos de Lynx Pardelle se ha realizado correctamente."
    );

    /* Crear servidor y escuchar peticiones http */
    app.listen(process.env.PORT || 6164, () => {
      console.log("Servidor corriendo en https://lynxpardelle.com.");
    });

    app.use(express.static("client"));
  })
  .catch((err) => console.log(err));
