"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var WebsiteSchema = Schema({
  title: String,
  titleEng: String,
  type: String,
  typeEng: String,
  desc: String,
  descEng: String,
  link: String,
  insert: String,
  desktopImg: { type: Schema.ObjectId, ref: "File" },
  tabletImg: { type: Schema.ObjectId, ref: "File" },
  mobileImg: { type: Schema.ObjectId, ref: "File" },
  order: {
    type: Number,
    unique: true
  },
});

module.exports = mongoose.model("Website", WebsiteSchema);
