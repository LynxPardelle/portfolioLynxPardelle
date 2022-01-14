"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BookImgSchema = Schema({
  title: String,
  titleEng: String,
  img: { type: Schema.ObjectId, ref: "File" },
  order: {
    type: Number,
    unique: true
  },
});

module.exports = mongoose.model("BookImg", BookImgSchema);
