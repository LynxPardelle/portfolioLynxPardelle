"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var VideoSchema = Schema({
  title: String,
  titleEng: String,
  link: String,
  insert: String,
  video: { type: Schema.ObjectId, ref: "File" },
  order: Number,
});

module.exports = mongoose.model("Video", VideoSchema);
