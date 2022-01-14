"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CVSubSectionSchema = Schema({
  title: String,
  titleEng: String,
  text: String,
  textEng: String,
  CVSection: { type: Schema.ObjectId, ref: "CVSection" },
  order: Number,
  titleColor: String,
  textColor: String,
  linkColor: String,
  bgColor: String,
  insertions: [String],
});

module.exports = mongoose.model("CVSubSection", CVSubSectionSchema);
