"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FileSchema = Schema({
  title: String,
  titleEng: String,
  location: String,
  size: String,
  type: String,
});

module.exports = mongoose.model("File", FileSchema);
