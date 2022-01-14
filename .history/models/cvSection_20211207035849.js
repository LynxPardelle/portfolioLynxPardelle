"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CVSectionSchema = Schema({
  title: String,
  titleEng: String,
  text: String,
  textEng: String,
  CVSubSections: [{ type: Schema.ObjectId, ref: "CVSubSection" }],
  order: Number,
  titleColor: String,
  textColor: String,
  linkColor: String,
  bgColor: String,
  insertions: [String],
});

module.exports = mongoose.model("CVSection", CVSectionSchema);
