"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = Schema({
  name: String,
  email: String,
  role: String,
  password: String,
  passwordOld: String,
  create_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);