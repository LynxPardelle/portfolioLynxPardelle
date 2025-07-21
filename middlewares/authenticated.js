"use strict";

var jwt = require("jwt-simple");
var moment = require("moment");

exports.ensureAuth = function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "La petición no tiene la cabecera de autenticación." });
  }

  var token = req.headers.authorization.replace(/['"]+/g, "");

  try {
    var secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).send({ message: "JWT_SECRET environment variable is required" });
    }
    
    var payload = jwt.decode(token, secret);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        message: "El token ha expirado",
      });
    }
  } catch (ex) {
    return res.status(404).send({
      message: "El token no es válido",
    });
  }

  req.user = payload;

  next();
};

exports.optionalAuth = function (req, res, next) {
  if (req && req.headers && req.headers.authorization) {
    var token = req.headers.authorization.replace(/['"]+/g, "");

    try {
      var secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).send({ message: "JWT_SECRET environment variable is required" });
      }
      
      var payload = jwt.decode(token, secret);
      if (payload.exp <= moment().unix()) {
        return res.status(401).send({
          message: "El token ha expirado",
        });
      }
    } catch (ex) {
      return res.status(404).send({
        message: "El token no es válido",
      });
    }

    req.user = payload;

    next();
  } else {
    next();
  }
};
