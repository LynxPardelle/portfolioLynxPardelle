"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MainSchema = Schema({
  welcome: String,
  welgomeEng: String,
  logo: { type: Schema.ObjectId, ref: "File" },
  backgroundImg: { type: Schema.ObjectId, ref: "File" },
  CVImage: { type: Schema.ObjectId, ref: "File" },
  CVBackground: [{ type: Schema.ObjectId, ref: "File" }],
  CVDesc: String,
  CVDescEng: String,
  CVDesc2: String,
  CVDesc2Eng: String,
  key: String,
  keyOld: String,
  errorMessage: String,
  seoTags: String,
  seoImg: String,
});

module.exports = mongoose.model("Main", MainSchema);
